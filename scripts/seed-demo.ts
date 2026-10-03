/**
 * Idempotent development/staging dataset. Uses Application Default Credentials
 * (GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`).
 * It never deletes data and only upserts documents with `isDemoData: true`.
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

const db = getFirestore();
const auth = getAuth();
const DEMO_PASSWORD = process.env.DAILYMART_DEMO_PASSWORD ?? 'Demo@12345';

type DemoUser = { key: string; email: string; name: string; claim?: string; role: string };

const users: DemoUser[] = [
  { key: 'admin', email: 'admin@dailymart.com', name: 'DailyMart Demo Admin', claim: 'SUPER_ADMIN', role: 'admin' },
  { key: 'owner', email: 'shopowner@dailymart.com', name: 'Ramesh Sharma (Owner)', role: 'shop_owner' },
  { key: 'delivery', email: 'delivery@dailymart.com', name: 'Sunil Kumar (Delivery Partner)', role: 'delivery_staff' },
  { key: 'customer', email: 'user@dailymart.com', name: 'Yashwant Verma', role: 'customer' },
];

async function ensureUser(user: DemoUser) {
  let record;
  try {
    record = await auth.getUserByEmail(user.email);
  } catch (error: unknown) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    record = await auth.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      displayName: user.name,
      emailVerified: true,
    });
  }

  if (user.claim) {
    await auth.setCustomUserClaims(record.uid, { platformRole: user.claim });
  }

  await db.doc(`users/${record.uid}`).set(
    {
      id: record.uid,
      uid: record.uid,
      name: user.name,
      email: user.email,
      phone: '+91 99000 0000' + (users.indexOf(user) + 1),
      role: user.role,
      roles: {
        customer: true,
        merchant: user.role === 'shop_owner',
        delivery: user.role === 'delivery_staff',
        admin: user.role === 'admin',
      },
      status: 'ACTIVE',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return record.uid;
}

async function main() {
  console.log('Seeding DailyMart demo environment with 4 roles and 3 shops...');
  const ids = Object.fromEntries(
    await Promise.all(users.map(async (user) => [user.key, await ensureUser(user)] as const))
  ) as Record<string, string>;

  // Ensure Admin in adminUsers
  await db.doc(`adminUsers/${ids.admin}`).set(
    {
      id: ids.admin,
      name: 'DailyMart Demo Admin',
      email: 'admin@dailymart.com',
      role: 'SUPER_ADMIN',
      isActive: true,
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Shop 1
  const shop1Id = 'demo-shop-shree-krishna';
  await db.doc(`shops/${shop1Id}`).set(
    {
      id: shop1Id,
      name: 'Shree Krishna General Store',
      ownerId: ids.owner,
      ownerName: 'Ramesh Sharma',
      category: 'Groceries & Daily Staples',
      description: 'Neighborhood grocery and daily essentials store.',
      phone: '+91 99000 00002',
      address: 'Shop 4, Jairaj Nagar, Tukum',
      city: 'Chandrapur',
      pincode: '442401',
      latitude: 19.9707,
      longitude: 79.2967,
      status: 'ACTIVE',
      operationalStatus: 'OPEN',
      verificationStatus: 'VERIFIED',
      isActive: true,
      isOpen: true,
      deliveryRadius: 12,
      deliveryFee: 20,
      freeDeliveryAbove: 299,
      minOrder: 99,
      estimatedDeliveryTime: '20–30 min',
      gstin: '27AABCS1429B1ZB',
      pan: 'AABCS1429B',
      tags: ['Groceries', 'Daily Essentials', 'Atta & Rice'],
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Shop 2
  const shop2Id = 'demo-shop-fresh-basket';
  await db.doc(`shops/${shop2Id}`).set(
    {
      id: shop2Id,
      name: 'Fresh Basket Organics',
      ownerId: 'demo_owner_2',
      ownerName: 'Sunita Patel',
      category: 'Fresh Fruits & Vegetables',
      description: 'Hand-picked fresh fruits and green vegetables.',
      phone: '+91 99000 00020',
      address: 'Plot 12, Gandhi Chowk, Ramnagar',
      city: 'Chandrapur',
      pincode: '442401',
      latitude: 19.9650,
      longitude: 79.3010,
      status: 'ACTIVE',
      operationalStatus: 'OPEN',
      verificationStatus: 'VERIFIED',
      isActive: true,
      isOpen: true,
      deliveryRadius: 12,
      deliveryFee: 15,
      freeDeliveryAbove: 199,
      minOrder: 79,
      estimatedDeliveryTime: '15–25 min',
      gstin: '27AABCF9921D1Z8',
      pan: 'AABCF9921D',
      tags: ['Organic', 'Vegetables', 'Fruits'],
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Shop 3
  const shop3Id = 'demo-shop-city-mart';
  await db.doc(`shops/${shop3Id}`).set(
    {
      id: shop3Id,
      name: 'City Daily Mart Supermarket',
      ownerId: 'demo_owner_3',
      ownerName: 'Vikram Singh',
      category: 'General Supermarket',
      description: 'Complete home supermarket covering cleaning, snacks, beverages and dairy.',
      phone: '+91 99000 00030',
      address: 'Near Stadium, Civil Lines',
      city: 'Chandrapur',
      pincode: '442401',
      latitude: 19.9740,
      longitude: 79.2880,
      status: 'ACTIVE',
      operationalStatus: 'OPEN',
      verificationStatus: 'VERIFIED',
      isActive: true,
      isOpen: true,
      deliveryRadius: 12,
      deliveryFee: 25,
      freeDeliveryAbove: 349,
      minOrder: 120,
      estimatedDeliveryTime: '25–35 min',
      gstin: '27AAACD5512E1Z2',
      pan: 'AAACD5512E',
      tags: ['Supermarket', 'Snacks', 'Beverages'],
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Memberships
  await db.doc(`shopMembers/${ids.owner}_${shop1Id}`).set(
    {
      shopId: shop1Id,
      userId: ids.owner,
      name: 'Ramesh Sharma (Owner)',
      email: 'shopowner@dailymart.com',
      phone: '+91 99000 00002',
      role: 'SHOP_OWNER',
      permissions: ['PRODUCT_MANAGE', 'ORDER_MANAGE', 'EMPLOYEE_MANAGE', 'DELIVERY_MANAGE'],
      status: 'ACTIVE',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db.doc(`shopMembers/${ids.delivery}_${shop1Id}`).set(
    {
      shopId: shop1Id,
      shopOwnerId: ids.owner,
      userId: ids.delivery,
      name: 'Sunil Kumar (Delivery Partner)',
      email: 'delivery@dailymart.com',
      phone: '+91 99000 00003',
      role: 'DELIVERY_STAFF',
      vehicleType: 'BIKE',
      permissions: [],
      status: 'ACTIVE',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Pending seller application for admin testing
  await db.doc('sellerApplications/demo-app-green-garden').set(
    {
      id: 'demo-app-green-garden',
      applicationId: 'DM-REG-2041',
      applicantUid: 'demo_user_applicant',
      applicantUserId: 'demo_user_applicant',
      applicantName: 'Vikrant Deshmukh',
      applicantPhone: '+91 99000 00050',
      applicantEmail: 'vikrant.spices@example.com',
      shopName: 'Green Garden Fresh & Spices',
      category: 'Groceries & Daily Staples',
      address: 'Near Old Cotton Market, Main Road',
      city: 'Chandrapur',
      pincode: '442401',
      deliveryRadius: 12,
      gstin: '27AAACE1234F1Z9',
      pan: 'AAACE1234F',
      latitude: 19.9685,
      longitude: 79.2930,
      documents: ['GST REG-06 Certificate', 'FSSAI License'],
      status: 'PENDING',
      isDemoData: true,
      environment: 'demo',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('✅ DailyMart demo dataset seeded successfully.');
}

main().catch((error) => {
  console.error('Error during demo seed script:', error);
  process.exitCode = 1;
});
