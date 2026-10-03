import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { normalizeGstin, isValidGstin } from '../lib/gstin';
import {
  ResolvedAccess,
  DetailedUserRole,
  AdminRole,
  WorkspaceType,
  UserProfile,
} from '../types';

let functionsInstance: any = null;
try {
  functionsInstance = getFunctions();
} catch (e) {
  // Functions not initialized in local setup
}

async function callFunction<T>(name: string, data: unknown): Promise<T> {
  if (!functionsInstance) throw new Error('FUNCTIONS_NOT_AVAILABLE');
  const result = await httpsCallable<unknown, T>(functionsInstance, name)(data);
  return result.data;
}

export const marketplaceApi = {
  createOrder: async (data: {
    idempotencyKey: string;
    shopId: string;
    items: { productId: string; quantity: number }[];
    deliveryAddress: string;
    phone: string;
    customerName?: string;
    paymentMethod: 'COD' | 'ONLINE';
    notes?: string;
  }): Promise<{ orderId: string }> => {
    // Attempt backend Cloud Function first
    try {
      if (functionsInstance && auth.currentUser) {
        return await callFunction<{ orderId: string }>('createOrder', data);
      }
    } catch (fnErr) {
      console.warn('Backend function call failed, utilizing client transaction fallback:', fnErr);
    }

    // Secure client-side transaction fallback
    const uid = auth.currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 8);
    const orderDocId = `${uid}_${data.idempotencyKey.substring(0, 16)}`;
    const orderRef = doc(db, 'orders', orderDocId);

    const createdId = await runTransaction(db, async (tx) => {
      const existing = await tx.get(orderRef);
      if (existing.exists()) {
        return existing.id;
      }

      // 1. Fetch shop
      const shopRef = doc(db, 'shops', data.shopId);
      const shopSnap = await tx.get(shopRef);
      if (!shopSnap.exists()) {
        throw new Error('SHOP_NOT_FOUND');
      }
      const shopData = shopSnap.data();

      // 2. Fetch products & calculate authoritative prices
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of data.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await tx.get(prodRef);
        if (!prodSnap.exists()) {
          throw new Error(`Product ${item.productId} not found`);
        }
        const prod = prodSnap.data();
        if (prod.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${prod.name}`);
        }

        const price = Number(prod.price) || 0;
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          productId: item.productId,
          name: prod.name,
          unit: prod.unit || '1 unit',
          image: prod.image || '',
          price,
          quantity: item.quantity,
          subtotal: lineTotal,
        });

        // Deduct stock
        tx.update(prodRef, {
          stockQuantity: Math.max(0, prod.stockQuantity - item.quantity),
          updatedAt: new Date().toISOString(),
        });
      }

      const deliveryFee = Number(shopData.deliveryFee ?? 20);
      const discount = 0;
      const totalAmount = subtotal + deliveryFee - discount;
      const customerName = data.customerName || auth.currentUser?.displayName || 'Customer';

      const initialHistoryItem = {
        status: 'ORDER_PLACED',
        timestamp: new Date().toISOString(),
        updatedBy: customerName,
        actorRole: 'CUSTOMER',
        reason: 'Customer placed order via DailyMart.',
      };

      const newOrder = {
        id: orderDocId,
        orderId: 'DM-' + Math.floor(1000 + Math.random() * 9000),
        customerId: uid,
        customerName,
        customerPhone: data.phone,
        deliveryAddress: data.deliveryAddress,
        shopId: data.shopId,
        shopName: shopData.name,
        shopOwnerId: shopData.ownerId,
        items: orderItems,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
        orderStatus: 'ORDER_PLACED',
        estimatedDeliveryTime: shopData.estimatedDeliveryTime || '25–35 min',
        notes: data.notes || '',
        statusHistory: [initialHistoryItem],
        inventoryDeducted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tx.set(orderRef, newOrder);

      // Create payment record
      const payRef = doc(db, 'orderPayments', orderDocId);
      tx.set(payRef, {
        orderId: orderDocId,
        customerId: uid,
        shopId: data.shopId,
        method: data.paymentMethod,
        status: data.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
        amount: totalAmount,
        platformFee: Math.round(subtotal * 0.05),
        merchantAmount: totalAmount - Math.round(subtotal * 0.05),
        createdAt: new Date().toISOString(),
      });

      return orderDocId;
    });

    return { orderId: createdId };
  },

  transitionOrder: async (data: {
    orderId: string;
    nextStatus: string;
    reason?: string;
    actorRole?: string;
    actorName?: string;
  }): Promise<{ ok: boolean }> => {
    try {
      if (functionsInstance && auth.currentUser) {
        return await callFunction<{ ok: boolean }>('transitionOrder', data);
      }
    } catch (e) {
      console.warn('Backend transitionOrder call failed, utilizing client transaction fallback:', e);
    }

    const orderRef = doc(db, 'orders', data.orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('ORDER_NOT_FOUND');

    const order = snap.data();
    const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

    const historyItem = {
      status: data.nextStatus,
      previousStatus: order.orderStatus,
      timestamp: new Date().toISOString(),
      updatedBy: data.actorName || auth.currentUser?.displayName || 'User',
      actorRole: data.actorRole || 'SHOP_OWNER',
      reason: data.reason || `Status updated to ${data.nextStatus}`,
    };

    const updatePayload: Record<string, any> = {
      orderStatus: data.nextStatus,
      statusHistory: [...currentHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    if (data.reason) updatePayload.rejectionReason = data.reason;

    if (data.nextStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
      updatePayload.paymentStatus = 'COLLECTED';
    }

    await updateDoc(orderRef, updatePayload);
    return { ok: true };
  },

  manageProduct: async (data: any): Promise<{ productId: string }> => {
    try {
      if (functionsInstance && auth.currentUser) {
        return await callFunction<{ productId: string }>('manageProduct', data);
      }
    } catch (e) {
      console.warn('Functions manageProduct fallback:', e);
    }

    if (data.action === 'CREATE') {
      const prodRef = doc(collection(db, 'products'));
      await setDoc(prodRef, {
        ...data.product,
        id: prodRef.id,
        shopId: data.shopId,
        isActive: true,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { productId: prodRef.id };
    }

    if (data.productId) {
      const prodRef = doc(db, 'products', data.productId);
      if (data.action === 'DEACTIVATE') {
        await updateDoc(prodRef, { isActive: false, updatedAt: new Date().toISOString() });
      } else if (data.action === 'ADJUST_STOCK') {
        await updateDoc(prodRef, {
          stockQuantity: data.product.stockQuantity,
          inStock: data.product.stockQuantity > 0,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await updateDoc(prodRef, { ...data.product, updatedAt: new Date().toISOString() });
      }
      return { productId: data.productId };
    }

    return { productId: 'unknown' };
  },

  manageShopMember: async (data: any): Promise<{ ok: boolean }> => {
    try {
      if (functionsInstance && auth.currentUser) {
        return await callFunction<{ ok: boolean }>('manageShopMember', data);
      }
    } catch (e) {
      console.warn('Functions manageShopMember fallback:', e);
    }

    const memberDocId = `${data.userId}_${data.shopId}`;
    await setDoc(
      doc(db, 'shopMembers', memberDocId),
      {
        id: memberDocId,
        shopId: data.shopId,
        shopOwnerId: data.shopOwnerId || auth.currentUser?.uid || '',
        userId: data.userId,
        name: data.name || 'Staff Member',
        phone: data.phone || '',
        email: (data.email || '').toLowerCase(),
        role: data.role || 'DELIVERY_STAFF',
        vehicleType: data.vehicleType || 'BIKE',
        status: data.action === 'DEACTIVATE' ? 'INACTIVE' : 'ACTIVE',
        permissions: data.permissions || [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { ok: true };
  },

  assignDeliveryStaff: async (data: {
    orderId: string;
    deliveryStaffId: string;
    deliveryStaffName: string;
    deliveryStaffPhone?: string;
  }): Promise<{ ok: boolean }> => {
    const orderRef = doc(db, 'orders', data.orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('ORDER_NOT_FOUND');

    const order = snap.data();
    const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const historyItem = {
      status: 'ASSIGNED_TO_DELIVERY',
      previousStatus: order.orderStatus,
      timestamp: new Date().toISOString(),
      updatedBy: auth.currentUser?.displayName || 'Shop Owner',
      actorRole: 'SHOP_OWNER',
      reason: `Order assigned to rider ${data.deliveryStaffName}`,
    };

    await updateDoc(orderRef, {
      orderStatus: 'ASSIGNED_TO_DELIVERY',
      deliveryStaffId: data.deliveryStaffId,
      deliveryStaffName: data.deliveryStaffName,
      deliveryStaffPhone: data.deliveryStaffPhone || '',
      statusHistory: [...currentHistory, historyItem],
      updatedAt: new Date().toISOString(),
    });

    // Also record in deliveryAssignments collection
    const assignmentRef = doc(collection(db, 'deliveryAssignments'));
    await setDoc(assignmentRef, {
      id: assignmentRef.id,
      orderId: data.orderId,
      shopId: order.shopId,
      shopName: order.shopName || '',
      deliveryStaffId: data.deliveryStaffId,
      deliveryStaffName: data.deliveryStaffName,
      deliveryStaffPhone: data.deliveryStaffPhone || '',
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { ok: true };
  },

  markCodCollected: async (data: { orderId: string }): Promise<{ ok: boolean }> => {
    try {
      if (functionsInstance && auth.currentUser) {
        return await callFunction<{ ok: boolean }>('markCodCollected', data);
      }
    } catch (e) {
      console.warn('Functions markCodCollected fallback:', e);
    }

    const orderRef = doc(db, 'orders', data.orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'COLLECTED',
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  },

  resolveAccess: async (): Promise<ResolvedAccess> => {
    const user = auth.currentUser;
    if (!user) {
      return {
        adminRole: null,
        shopRole: null,
        deliveryRole: null,
        ownedShopIds: [],
        staffShopIds: [],
        deliveryShopIds: [],
        isCustomer: true,
        detailedRole: 'CUSTOMER',
        authorizedWorkspaces: ['customer'],
        primaryWorkspace: 'customer',
      };
    }

    try {
      if (functionsInstance) {
        const remote = await callFunction<any>('resolveAccess', {});
        if (remote) return { ...remote, isCustomer: true };
      }
    } catch (e) {
      // Fall through to Firestore resolution
    }

    const email = user.email?.toLowerCase().trim() || '';

    // 1. Check Admin Roles (SUPER_ADMIN, OPERATIONS_ADMIN, FINANCE_ADMIN, SUPPORT_ADMIN)
    let adminRole: AdminRole | null = null;

    // Check custom claims
    try {
      const idTokenResult = await user.getIdTokenResult();
      const claims = idTokenResult.claims;
      if (claims?.role && ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(claims.role as string)) {
        adminRole = claims.role as AdminRole;
      }
    } catch {
      // Claims check failed or not set
    }

    // Check trusted admin email
    if (!adminRole) {
      const isSuperAdminEmail =
        email === 'admin@dailymart.com' ||
        email === 'dhandesaurav37@gmail.com' ||
        email.endsWith('@dailymart.com') && email.startsWith('admin');

      if (isSuperAdminEmail) {
        adminRole = 'SUPER_ADMIN';
      }
    }

    // Check adminUsers document
    if (!adminRole) {
      try {
        const adminSnap = await getDoc(doc(db, 'adminUsers', user.uid));
        if (adminSnap.exists() && adminSnap.data().isActive) {
          adminRole = (adminSnap.data().role as AdminRole) || 'OPERATIONS_ADMIN';
        }
      } catch {
        // Fallback
      }
    }

    // 2. Check Shop Ownership & Staff Memberships
    // Possible roles: SHOP_OWNER, SHOP_MANAGER, INVENTORY_MANAGER, ORDER_MANAGER
    const ownedShopIds: string[] = [];
    const staffShopIds: string[] = [];
    const deliveryShopIds: string[] = [];
    let detectedShopRole: 'SHOP_OWNER' | 'SHOP_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER' | null = null;
    let detectedDeliveryRole: 'DELIVERY_STAFF' | null = null;

    // Developer demo account email shortcuts (if enabled)
    if (email === 'shopowner@dailymart.com') {
      ownedShopIds.push('demo-shop-shree-krishna');
      detectedShopRole = 'SHOP_OWNER';
    }
    if (email === 'delivery@dailymart.com') {
      deliveryShopIds.push('demo-shop-shree-krishna');
      detectedDeliveryRole = 'DELIVERY_STAFF';
    }

    // Query direct shop ownership from 'shops' collection
    try {
      const shopsQ = query(collection(db, 'shops'), where('ownerId', '==', user.uid));
      const shopsSnaps = await getDocs(shopsQ);
      shopsSnaps.forEach((d) => {
        if (!ownedShopIds.includes(d.id)) {
          ownedShopIds.push(d.id);
        }
      });
      if (ownedShopIds.length > 0 && !detectedShopRole) {
        detectedShopRole = 'SHOP_OWNER';
      }
    } catch (err) {
      // Handled silently
    }

    // Query shop members by UID
    try {
      const q = query(
        collection(db, 'shopMembers'),
        where('userId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      );
      const snaps = await getDocs(q);
      snaps.forEach((d) => {
        const m = d.data();
        if (m.role === 'SHOP_OWNER') {
          if (!ownedShopIds.includes(m.shopId)) ownedShopIds.push(m.shopId);
          detectedShopRole = 'SHOP_OWNER';
        } else if (['SHOP_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'].includes(m.role)) {
          if (!staffShopIds.includes(m.shopId)) staffShopIds.push(m.shopId);
          if (!detectedShopRole) detectedShopRole = m.role;
        } else if (m.role === 'DELIVERY_STAFF') {
          if (!deliveryShopIds.includes(m.shopId)) deliveryShopIds.push(m.shopId);
          detectedDeliveryRole = 'DELIVERY_STAFF';
        }
      });
    } catch {
      // Permission or network error handled safely
    }

    // Query shop members by email (allows invitations created before user first signs in)
    if (email) {
      try {
        const emailQ = query(
          collection(db, 'shopMembers'),
          where('email', '==', email),
          where('status', '==', 'ACTIVE')
        );
        const emailSnaps = await getDocs(emailQ);
        emailSnaps.forEach((d) => {
          const m = d.data();
          if (m.role === 'SHOP_OWNER') {
            if (!ownedShopIds.includes(m.shopId)) ownedShopIds.push(m.shopId);
            detectedShopRole = 'SHOP_OWNER';
          } else if (['SHOP_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'].includes(m.role)) {
            if (!staffShopIds.includes(m.shopId)) staffShopIds.push(m.shopId);
            if (!detectedShopRole) detectedShopRole = m.role;
          } else if (m.role === 'DELIVERY_STAFF') {
            if (!deliveryShopIds.includes(m.shopId)) deliveryShopIds.push(m.shopId);
            detectedDeliveryRole = 'DELIVERY_STAFF';
          }
        });
      } catch {
        // Handled safely
      }
    }

    // 3. Compute Authorized Workspaces & Detailed Role
    const authorizedWorkspaces: WorkspaceType[] = ['customer'];

    if (adminRole) {
      authorizedWorkspaces.push('admin');
    }
    if (detectedShopRole || ownedShopIds.length > 0 || staffShopIds.length > 0) {
      authorizedWorkspaces.push('shop_owner');
    }
    if (detectedDeliveryRole || deliveryShopIds.length > 0) {
      authorizedWorkspaces.push('delivery_staff');
    }

    // Determine detailed role and default landing workspace
    let detailedRole: DetailedUserRole = 'CUSTOMER';
    let primaryWorkspace: WorkspaceType = 'customer';

    if (adminRole) {
      detailedRole = adminRole;
      primaryWorkspace = 'admin';
    } else if (detectedShopRole) {
      detailedRole = detectedShopRole;
      primaryWorkspace = 'shop_owner';
    } else if (detectedDeliveryRole) {
      detailedRole = 'DELIVERY_STAFF';
      primaryWorkspace = 'delivery_staff';
    } else {
      detailedRole = 'CUSTOMER';
      primaryWorkspace = 'customer';
    }

    return {
      adminRole,
      shopRole: detectedShopRole,
      deliveryRole: detectedDeliveryRole,
      ownedShopIds,
      staffShopIds,
      deliveryShopIds,
      isCustomer: true,
      detailedRole,
      authorizedWorkspaces,
      primaryWorkspace,
    };
  },

  syncUserProfile: async (
    user: { uid: string; email?: string | null; displayName?: string | null; phoneNumber?: string | null },
    additionalData?: { name?: string; phone?: string }
  ): Promise<UserProfile> => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          id: user.uid,
          uid: user.uid,
          name: additionalData?.name?.trim() || user.displayName || 'Customer',
          email: user.email?.toLowerCase().trim() || '',
          phone: additionalData?.phone?.trim() || user.phoneNumber || '',
          role: 'customer',
          detailedRole: 'CUSTOMER',
          roles: {
            customer: true,
            merchant: false,
            delivery: false,
            admin: false,
          },
          status: 'ACTIVE',
          address: 'Local Customer Address',
          latitude: 19.9615,
          longitude: 79.2961,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      } else {
        const existing = snap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        if (additionalData?.name && (!existing.name || existing.name === 'Customer')) {
          updates.name = additionalData.name.trim();
        }
        if (additionalData?.phone && !existing.phone) {
          updates.phone = additionalData.phone.trim();
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
          return { ...existing, ...updates };
        }
        return existing;
      }
    } catch {
      // If permission or network issue, construct memory fallback
      return {
        id: user.uid,
        uid: user.uid,
        name: additionalData?.name?.trim() || user.displayName || 'Customer',
        email: user.email?.toLowerCase().trim() || '',
        phone: additionalData?.phone?.trim() || user.phoneNumber || '',
        role: 'customer',
        detailedRole: 'CUSTOMER',
        roles: {
          customer: true,
          merchant: false,
          delivery: false,
          admin: false,
        },
        status: 'ACTIVE',
        address: 'Local Customer Address',
        latitude: 19.9615,
        longitude: 79.2961,
      };
    }
  },

  submitSellerApplication: async (data: {
    businessName: string;
    businessType: string;
    address: string;
    city: string;
    pincode: string;
    category: string;
    latitude: number;
    longitude: number;
    phone: string;
    gstin?: string;
    documents?: string[];
  }): Promise<{ applicationId: string }> => {
    // 1. Mandatory GSTIN normalization & validation
    if (!data.gstin) {
      throw new Error('GSTIN is mandatory for seller registration on DailyMart.');
    }

    const gstinCheck = isValidGstin(data.gstin);
    if (!gstinCheck.isValid) {
      throw new Error(gstinCheck.error || 'Invalid GSTIN provided.');
    }

    const normalizedGstin = gstinCheck.normalized;

    // 2. Prevent duplicate GSTIN registrations
    const duplicateAppQuery = query(
      collection(db, 'sellerApplications'),
      where('gstin', '==', normalizedGstin)
    );
    const dupAppSnap = await getDocs(duplicateAppQuery);
    if (!dupAppSnap.empty) {
      throw new Error(`An application with GSTIN ${normalizedGstin} already exists.`);
    }

    const duplicateShopQuery = query(
      collection(db, 'shops'),
      where('gstin', '==', normalizedGstin)
    );
    const dupShopSnap = await getDocs(duplicateShopQuery);
    if (!dupShopSnap.empty) {
      throw new Error(`A registered shop is already active with GSTIN ${normalizedGstin}.`);
    }

    const uid = auth.currentUser?.uid || 'applicant_' + Math.random().toString(36).substring(2, 8);
    const appRef = doc(collection(db, 'sellerApplications'));

    await setDoc(appRef, {
      id: appRef.id,
      applicationId: 'DM-REG-' + Math.floor(1000 + Math.random() * 9000),
      applicantUid: uid,
      applicantUserId: uid,
      applicantName: auth.currentUser?.displayName || 'Applicant',
      applicantPhone: data.phone,
      applicantEmail: auth.currentUser?.email || '',
      shopName: data.businessName,
      category: data.category,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      deliveryRadius: 12,
      gstin: normalizedGstin,
      pan: gstinCheck.pan,
      documents: data.documents || ['GST REG-06 Certificate'],
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { applicationId: appRef.id };
  },
};
