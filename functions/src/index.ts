import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { z } from 'zod';

initializeApp();
const db = getFirestore();
const money = z.number().finite().nonnegative();
const role = z.enum(['SHOP_OWNER', 'SHOP_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'DELIVERY_STAFF']);
const orderTransitions: Record<string, string[]> = {
  ORDER_PLACED: ['SHOP_ACCEPTED', 'REJECTED', 'CANCELLED'], SHOP_ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'], READY_FOR_PICKUP: ['ASSIGNED_TO_DELIVERY'],
  ASSIGNED_TO_DELIVERY: ['PICKED_UP'], PICKED_UP: ['OUT_FOR_DELIVERY'], OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
};
function requireAuth(uid?: string) { if (!uid) throw new HttpsError('unauthenticated', 'UNAUTHENTICATED'); return uid; }
async function membership(uid: string, shopId: string) { const d = await db.doc(`shopMembers/${uid}_${shopId}`).get(); return d.exists && d.data()?.status === 'ACTIVE' ? d.data()! : null; }
async function requireShopPermission(uid: string, shopId: string, permission: string) { const m = await membership(uid, shopId); if (!m || (m.role !== 'SHOP_OWNER' && !m.permissions?.includes(permission))) throw new HttpsError('permission-denied', 'NOT_SHOP_MEMBER'); return m; }
async function audit(actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) { await db.collection('auditLogs').add({ actorId, action, entityType, entityId, metadata, timestamp: FieldValue.serverTimestamp() }); }

export const createOrder = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const input = z.object({ idempotencyKey: z.string().min(16).max(128), shopId: z.string().min(1), items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1).max(100), deliveryAddress: z.string().min(8).max(500), phone: z.string().min(7).max(24), paymentMethod: z.enum(['COD', 'ONLINE']), notes: z.string().max(1000).optional() }).parse(request.data);
  const orderRef = db.collection('orders').doc(`${uid}_${input.idempotencyKey}`);
  await db.runTransaction(async tx => {
    const existing = await tx.get(orderRef); if (existing.exists) return;
    const shopRef = db.doc(`shops/${input.shopId}`); const shop = await tx.get(shopRef);
    if (!shop.exists || shop.data()?.status !== 'ACTIVE' || shop.data()?.operationalStatus !== 'OPEN') throw new HttpsError('failed-precondition', 'SHOP_NOT_AVAILABLE');
    let subtotal = 0; const snapshots: unknown[] = [];
    for (const line of input.items) { const ref = db.doc(`products/${line.productId}`); const product = await tx.get(ref); const p = product.data();
      if (!product.exists || p?.shopId !== input.shopId || !p.isActive || !p.isAvailable || !Number.isInteger(p.stockQuantity) || p.stockQuantity < line.quantity) throw new HttpsError('failed-precondition', 'OUT_OF_STOCK');
      const price = Number(p.price); if (!Number.isFinite(price) || price < 0) throw new HttpsError('internal', 'INVALID_PRODUCT_PRICE');
      subtotal += price * line.quantity; snapshots.push({ productId: line.productId, name: p.name, unit: p.unit, image: p.image ?? null, price, quantity: line.quantity, subtotal: price * line.quantity });
      tx.update(ref, { stockQuantity: p.stockQuantity - line.quantity, reservedQuantity: FieldValue.increment(line.quantity), updatedAt: FieldValue.serverTimestamp() });
      tx.create(db.collection('inventoryAdjustments').doc(), { shopId: input.shopId, productId: line.productId, delta: -line.quantity, reason: 'ORDER_RESERVATION', orderId: orderRef.id, actorId: uid, createdAt: FieldValue.serverTimestamp() });
    }
    const settings = await tx.get(db.doc('platformSettings/payment')); const commissionRate = Number(settings.data()?.commissionRate ?? 0);
    const deliveryFee = Number(shop.data()?.deliveryConfig?.deliveryFee ?? 0); const platformFee = Math.round(subtotal * commissionRate) / 100;
    tx.create(orderRef, { customerId: uid, shopId: input.shopId, items: snapshots, deliveryAddress: input.deliveryAddress, customerPhone: input.phone, notes: input.notes ?? '', paymentMethod: input.paymentMethod, paymentStatus: input.paymentMethod === 'COD' ? 'PENDING' : 'PENDING', orderStatus: 'ORDER_PLACED', financials: { subtotal, deliveryFee, discount: 0, tax: 0, platformFee, totalAmount: subtotal + deliveryFee, currency: 'INR', merchantAmount: subtotal + deliveryFee - platformFee, refundAmount: 0 }, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.create(db.collection('orderPayments').doc(orderRef.id), { orderId: orderRef.id, customerId: uid, shopId: input.shopId, method: input.paymentMethod, status: 'PENDING', amount: subtotal + deliveryFee, platformFee, merchantAmount: subtotal + deliveryFee - platformFee, idempotencyKey: input.idempotencyKey, createdAt: FieldValue.serverTimestamp() });
  });
  await audit(uid, 'ORDER_CREATED', 'ORDER', orderRef.id, { shopId: input.shopId }); return { orderId: orderRef.id };
});

export const transitionOrder = onCall(async request => {
  const uid = requireAuth(request.auth?.uid); const input = z.object({ orderId: z.string().min(1), nextStatus: z.string(), reason: z.string().max(500).optional() }).parse(request.data); const ref = db.doc(`orders/${input.orderId}`);
  await db.runTransaction(async tx => { const snap = await tx.get(ref); if (!snap.exists) throw new HttpsError('not-found', 'ORDER_NOT_FOUND'); const order = snap.data()!; await requireShopPermission(uid, order.shopId, 'ORDER_MANAGE'); if (!orderTransitions[order.orderStatus]?.includes(input.nextStatus)) throw new HttpsError('failed-precondition', 'INVALID_STATUS_TRANSITION'); tx.update(ref, { orderStatus: input.nextStatus, statusReason: input.reason ?? null, updatedAt: FieldValue.serverTimestamp() }); });
  await audit(uid, 'ORDER_STATUS_CHANGED', 'ORDER', input.orderId, { nextStatus: input.nextStatus }); return { ok: true };
});

export const manageProduct = onCall(async request => {
  const uid = requireAuth(request.auth?.uid); const input = z.object({ action: z.enum(['CREATE', 'UPDATE', 'DEACTIVATE', 'ADJUST_STOCK']), productId: z.string().optional(), shopId: z.string().min(1), product: z.object({ name: z.string().min(1).max(160).optional(), price: money.optional(), stockQuantity: z.number().int().min(0).optional(), lowStockThreshold: z.number().int().min(0).optional(), category: z.string().max(80).optional(), description: z.string().max(2000).optional(), sku: z.string().max(80).optional(), image: z.string().url().optional(), isAvailable: z.boolean().optional() }).default({}) }).parse(request.data); await requireShopPermission(uid, input.shopId, 'PRODUCT_MANAGE');
  const ref = input.action === 'CREATE' ? db.collection('products').doc() : db.doc(`products/${input.productId}`); if (input.action !== 'CREATE') { const p = await ref.get(); if (!p.exists || p.data()?.shopId !== input.shopId) throw new HttpsError('not-found', 'PRODUCT_NOT_FOUND'); }
  if (input.action === 'CREATE') { if (input.product.name === undefined || input.product.price === undefined || input.product.stockQuantity === undefined) throw new HttpsError('invalid-argument', 'INVALID_PRODUCT'); await ref.create({ ...input.product, shopId: input.shopId, isActive: true, isAvailable: input.product.isAvailable ?? true, reservedQuantity: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); }
  else if (input.action === 'DEACTIVATE') await ref.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
  else await ref.update({ ...input.product, updatedAt: FieldValue.serverTimestamp() });
  await audit(uid, `PRODUCT_${input.action}`, 'PRODUCT', ref.id, { shopId: input.shopId }); return { productId: ref.id };
});

export const manageShopMember = onCall(async request => {
  const uid = requireAuth(request.auth?.uid); const input = z.object({ action: z.enum(['INVITE', 'UPDATE', 'DEACTIVATE', 'REMOVE']), shopId: z.string(), userId: z.string(), role: role.optional(), permissions: z.array(z.string().max(64)).max(32).optional() }).parse(request.data); await requireShopPermission(uid, input.shopId, 'EMPLOYEE_MANAGE'); const ref = db.doc(`shopMembers/${input.userId}_${input.shopId}`);
  if (input.action === 'REMOVE') await ref.delete(); else await ref.set({ shopId: input.shopId, userId: input.userId, role: input.role ?? 'ORDER_MANAGER', permissions: input.permissions ?? [], status: input.action === 'DEACTIVATE' ? 'INACTIVE' : 'ACTIVE', updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() }, { merge: true }); await audit(uid, `SHOP_MEMBER_${input.action}`, 'SHOP_MEMBER', ref.id, { shopId: input.shopId }); return { ok: true };
});

export const resolveAccess = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const token = request.auth?.token ?? {};
  const memberships = await db.collection('shopMembers').where('userId', '==', uid).where('status', '==', 'ACTIVE').get();
  const ownedShopIds: string[] = []; const deliveryShopIds: string[] = [];
  memberships.forEach((membership) => {
    const data = membership.data();
    if (data.role === 'SHOP_OWNER') ownedShopIds.push(data.shopId);
    if (data.role === 'DELIVERY_STAFF') deliveryShopIds.push(data.shopId);
  });
  const adminRole = typeof token.platformRole === 'string' && ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(token.platformRole) ? token.platformRole : null;
  const profile = db.doc(`users/${uid}`);
  if (!(await profile.get()).exists) await profile.create({ uid, name: token.name ?? '', email: token.email ?? '', phone: token.phone_number ?? '', status: 'ACTIVE', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { adminRole, ownedShopIds, deliveryShopIds };
});

export const submitSellerApplication = onCall(async request => {
  const uid = requireAuth(request.auth?.uid);
  const input = z.object({ businessName: z.string().min(2).max(160), businessType: z.string().min(2).max(80), address: z.string().min(8).max(500), city: z.string().min(2).max(80), pincode: z.string().min(4).max(12), category: z.string().min(2).max(80), latitude: z.number().finite(), longitude: z.number().finite(), phone: z.string().min(7).max(24), documents: z.array(z.string().max(500)).max(10).default([]) }).parse(request.data);
  const existing = await db.collection('sellerApplications').where('applicantUserId', '==', uid).where('status', 'in', ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED']).limit(1).get();
  if (!existing.empty) return { applicationId: existing.docs[0].id };
  const ref = db.collection('sellerApplications').doc();
  await ref.create({ ...input, applicantUserId: uid, status: 'PENDING', submittedAt: FieldValue.serverTimestamp(), reviewedAt: null, reviewedBy: null });
  await audit(uid, 'SELLER_APPLICATION_SUBMITTED', 'SELLER_APPLICATION', ref.id); return { applicationId: ref.id };
});

export const markCodCollected = onCall(async request => { const uid = requireAuth(request.auth?.uid); const input = z.object({ orderId: z.string() }).parse(request.data); const ref = db.doc(`orders/${input.orderId}`); const order = await ref.get(); if (!order.exists) throw new HttpsError('not-found', 'ORDER_NOT_FOUND'); const m = await membership(uid, order.data()!.shopId); if (!m || (m.role !== 'DELIVERY_STAFF' && m.role !== 'SHOP_OWNER')) throw new HttpsError('permission-denied', 'NOT_DELIVERY_STAFF'); await ref.update({ paymentStatus: 'COLLECTED', codCollectedBy: uid, codCollectedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); await audit(uid, 'COD_COLLECTED', 'ORDER', input.orderId); return { ok: true }; });

export const paymentWebhook = onCall(async () => { throw new HttpsError('unimplemented', 'Use an authenticated provider HTTP webhook endpoint configured with the provider signature secret.'); });
logger.info('DailyMart trusted commerce functions loaded');
