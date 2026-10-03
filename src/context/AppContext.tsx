import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, testFirestoreConnection } from '../lib/firebase';
import { marketplaceApi } from '../services/marketplaceApi';
import {
  Shop,
  Product,
  Cart,
  CartItem,
  Order,
  UserLocation,
  OrderStatus,
  BusinessHours,
  DeliveryConfig,
  MerchantAccount,
  PaymentRecord,
  MerchantNotification,
  MerchantCustomer,
  UserProfile,
  UserRoles,
  UserRole,
  SellerApplication,
  AdminRole,
  Category,
  Dispute,
  AuditLog,
  PlatformSettings,
  ShopMember,
  WorkspaceType,
  DetailedUserRole,
} from '../types';
import { calculateDistanceKm, getNearbyShops, POPULAR_DELIVERY_LOCATIONS } from '../lib/geo';
import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_DELIVERY_CONFIG,
  DEFAULT_PLATFORM_SETTINGS,
} from '../lib/seedData';
import { seedDemoMarketplace } from '../lib/seedDemoData';

interface ConflictModalState {
  isOpen: boolean;
  pendingProduct: Product | null;
  currentShopName: string;
  pendingShopName: string;
}

interface AppContextType {
  // Location
  userLocation: UserLocation;
  updateLocation: (loc: UserLocation) => void;
  detectCurrentLocation: () => Promise<boolean>;
  isDetectingLocation: boolean;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;

  // Authentication & Unified Modal
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;

  // Shops & Products
  shops: Shop[];
  nearbyShops: Shop[];
  products: Product[];
  isLoadingData: boolean;
  getProductsForShop: (shopId: string) => Product[];
  activeShop: Shop | null;
  setActiveShopId: (shopId: string | null) => void;

  // Cart
  cart: Cart;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  conflictModal: ConflictModalState;
  closeConflictModal: () => void;
  resolveConflictClearAndAdd: () => void;
  cartItemCount: number;
  cartSubtotal: number;

  // Navigation & Routing
  currentTab: 'home' | 'shops' | 'orders' | 'cart' | 'profile';
  setCurrentTab: (tab: 'home' | 'shops' | 'orders' | 'cart' | 'profile') => void;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  isCheckingOut: boolean;
  setIsCheckingOut: (checking: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Orders
  customerOrders: Order[];
  activeOrder: Order | null;
  createOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    landmark?: string;
    paymentMethod: 'COD' | 'ONLINE';
    notes?: string;
  }) => Promise<string | null>;

  // Customer & Auth Identity
  currentUser: UserProfile | null;
  currentUserId: string;
  updateCustomerProfile: (data: Partial<UserProfile>) => Promise<boolean>;

  // Multi-Role Capabilities & Authorization
  isVerifiedAdmin: boolean;
  canAccessSellerDashboard: boolean;
  isAuthorizedDelivery: boolean;
  detailedUserRole: DetailedUserRole;
  authorizedWorkspaces: WorkspaceType[];
  switchWorkspace: (workspace: WorkspaceType) => boolean;
  accessDeniedNotice: string | null;
  clearAccessDeniedNotice: () => void;
  verifyAndLoginAdmin: (email: string, password?: string) => Promise<boolean>;
  logoutAdmin: () => void;
  loginDemoAccount: (email: string) => void;

  // Seller Application & Onboarding
  sellerApplication: SellerApplication | null;
  submitSellerApplication: (data: {
    applicantName: string;
    applicantPhone: string;
    applicantEmail?: string;
    shopName: string;
    category: string;
    address: string;
    city: string;
    pincode: string;
    deliveryRadius: number;
    gstin: string; // MANDATORY
  }) => Promise<string | null>;
  isBecomeSellerModalOpen: boolean;
  setIsBecomeSellerModalOpen: (open: boolean) => void;
  isSellerDetailsModalOpen: boolean;
  setIsSellerDetailsModalOpen: (open: boolean) => void;

  // Roles: Customer, Shop Owner, Delivery Staff, Admin
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  adminRole: AdminRole;
  setAdminRole: (role: AdminRole) => void;

  // Shop Owner Flow
  shopOwnerShop: Shop | null;
  shopOwnerOrders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<boolean>;
  toggleShopOpenStatus: (shopId: string, isOpen: boolean) => Promise<boolean>;
  setManualShopOverride: (shopId: string, override: 'OPEN' | 'CLOSED' | null) => Promise<boolean>;
  updateBusinessHours: (shopId: string, hours: BusinessHours) => Promise<boolean>;
  updateDeliveryConfig: (shopId: string, config: DeliveryConfig) => Promise<boolean>;
  updateShopProfile: (shopId: string, data: Partial<Shop>) => Promise<boolean>;

  // Product & Inventory Management
  addProduct: (productData: Omit<Product, 'id'>) => Promise<string | null>;
  updateProduct: (productId: string, data: Partial<Product>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  updateProductStock: (productId: string, stockQuantity: number, lowStockThreshold?: number) => Promise<boolean>;

  // Billing & Payments
  merchantAccount: MerchantAccount | null;
  updateMerchantAccount: (shopId: string, accountData: Partial<MerchantAccount>) => Promise<boolean>;
  merchantPayments: PaymentRecord[];
  markCodPaymentCollected: (orderId: string) => Promise<boolean>;

  // CRM
  merchantCustomers: MerchantCustomer[];
  customerNotes: Record<string, string>;
  saveCustomerNote: (customerId: string, note: string) => void;

  // Notifications
  merchantNotifications: MerchantNotification[];
  markNotificationAsRead: (id: string) => Promise<boolean>;
  clearAllNotifications: () => Promise<boolean>;

  // Delivery Staff Management
  shopMembers: ShopMember[];
  assignDeliveryStaff: (orderId: string, staff: { id: string; name: string; phone?: string }) => Promise<boolean>;
  addShopDeliveryStaff: (staffData: { name: string; phone: string; email: string; vehicleType?: 'BIKE' | 'SCOOTER' | 'EV' | 'CYCLE' | 'OTHER' }) => Promise<boolean>;

  // Demo Environment
  seedDemoData: () => Promise<any>;

  /* ==================== ADMIN STATE & ACTIONS ==================== */
  allOrders: Order[];
  allPayments: PaymentRecord[];
  merchantAccountsList: MerchantAccount[];
  categories: Category[];
  disputes: Dispute[];
  auditLogs: AuditLog[];
  platformSettings: PlatformSettings;
  usersList: UserProfile[];

  // Admin Shop Actions
  approveMerchant: (appOrShopId: string, notes?: string) => Promise<boolean>;
  rejectMerchant: (shopId: string, reason: string) => Promise<boolean>;
  suspendShop: (shopId: string, reason: string) => Promise<boolean>;
  activateShop: (shopId: string) => Promise<boolean>;

  // Admin Order Actions
  adminCancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  adminRefundOrder: (orderId: string, refundAmount: number, reason: string) => Promise<boolean>;

  // Admin Payout Actions
  adminProcessPayout: (paymentId: string) => Promise<boolean>;

  // Admin Category Actions
  createCategory: (category: Omit<Category, 'id'>) => Promise<string | null>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Admin Dispute Actions
  createDispute: (dispute: Omit<Dispute, 'id' | 'disputeId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  resolveDispute: (disputeId: string, resolution: string, refundAmount?: number) => Promise<boolean>;
  rejectDispute: (disputeId: string, reason: string) => Promise<boolean>;

  // Admin Settings & User Actions
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => Promise<boolean>;
  updateCustomerStatus: (customerId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED', reason?: string) => Promise<boolean>;
  logAuditAction: (action: string, resourceType: AuditLog['resourceType'], resourceId: string, details: string, reason?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_LOCATION_KEY = 'dailymart_user_location';
const LOCAL_STORAGE_CART_KEY = 'dailymart_cart';
const LOCAL_STORAGE_CUSTOMER_ID_KEY = 'dailymart_customer_id';
const LOCAL_STORAGE_CRM_NOTES_KEY = 'dailymart_merchant_crm_notes';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Customer Location State
  const [userLocation, setUserLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOCATION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return POPULAR_DELIVERY_LOCATIONS[0];
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auth & Identity persistence
  const [authUserId, setAuthUserId] = useState<string | null>(() => auth.currentUser?.uid || null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!auth.currentUser);

  const [customerId] = useState<string>(() => {
    let id = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_ID_KEY);
    if (!id) {
      id = 'cust_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(LOCAL_STORAGE_CUSTOMER_ID_KEY, id);
    }
    return id;
  });

  const currentUserId = authUserId || customerId;
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([]);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [authorizedShopIds, setAuthorizedShopIds] = useState<string[]>([]);
  const [adminRole, setAdminRoleState] = useState<AdminRole>('SUPER_ADMIN');
  const [isBecomeSellerModalOpen, setIsBecomeSellerModalOpen] = useState(false);
  const [isSellerDetailsModalOpen, setIsSellerDetailsModalOpen] = useState(false);

  // 2. Data State
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopMembers, setShopMembers] = useState<ShopMember[]>([]);
  const [merchantAccounts, setMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<MerchantNotification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'shops' | 'orders' | 'cart' | 'profile'>('home');
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 4 Backend Roles: 'customer' | 'shop_owner' | 'delivery_staff' | 'admin'
  const [userRole, setUserRoleState] = useState<UserRole>('customer');
  const [detailedUserRole, setDetailedUserRole] = useState<DetailedUserRole>('CUSTOMER');
  const [authorizedWorkspaces, setAuthorizedWorkspaces] = useState<WorkspaceType[]>(['customer']);
  const [isAuthorizedDelivery, setIsAuthorizedDelivery] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);

  // Can user access seller dashboard? (Checks verified shop ownership or staff membership)
  const canAccessSellerDashboard = useMemo(() => {
    return authorizedShopIds.length > 0;
  }, [authorizedShopIds]);

  // Automatic backend role resolution upon login
  useEffect(() => {
    if (!authUserId) {
      setAuthorizedShopIds([]);
      setIsVerifiedAdmin(false);
      setIsAuthorizedDelivery(false);
      setAuthorizedWorkspaces(['customer']);
      setDetailedUserRole('CUSTOMER');
      setUserRoleState('customer');
      return;
    }

    marketplaceApi.resolveAccess().then((access) => {
      setAuthorizedShopIds([...access.ownedShopIds, ...access.staffShopIds]);
      setIsVerifiedAdmin(access.adminRole !== null);
      setIsAuthorizedDelivery(access.deliveryShopIds.length > 0 || access.deliveryRole !== null);
      setAuthorizedWorkspaces(access.authorizedWorkspaces);
      setDetailedUserRole(access.detailedRole);

      if (access.adminRole) {
        setAdminRoleState(access.adminRole as AdminRole);
      }
      setUserRoleState(access.primaryWorkspace);
    }).catch((err) => {
      console.warn('Role resolution fallback notice:', err);
      setAuthorizedShopIds([]);
      setIsVerifiedAdmin(false);
      setIsAuthorizedDelivery(false);
      setAuthorizedWorkspaces(['customer']);
      setDetailedUserRole('CUSTOMER');
      setUserRoleState('customer');
    });

    // Sync authenticated user profile document
    if (auth.currentUser) {
      marketplaceApi.syncUserProfile(auth.currentUser).then((profile) => {
        setCurrentUser(profile);
      }).catch(() => {});
    }
  }, [authUserId]);

  // Active seller application if submitted
  const sellerApplication = useMemo(() => {
    return (
      sellerApplications.find(
        (a) => a.applicantUserId === currentUserId || a.applicantUserId === customerId
      ) ||
      currentUser?.sellerApplication ||
      null
    );
  }, [sellerApplications, currentUser, currentUserId, customerId]);

  const submitSellerApplication = useCallback(async (data: {
    applicantName: string;
    applicantPhone: string;
    applicantEmail?: string;
    shopName: string;
    category: string;
    address: string;
    city: string;
    pincode: string;
    deliveryRadius: number;
    gstin: string;
  }): Promise<string | null> => {
    try {
      const result = await marketplaceApi.submitSellerApplication({
        businessName: data.shopName,
        businessType: data.category,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        category: data.category,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        phone: data.applicantPhone,
        gstin: data.gstin,
        documents: ['GST REG-06 Certificate', 'Gumasta License'],
      });
      return result.applicationId;
    } catch (error) {
      console.error('Seller application submission failed:', error);
      return null;
    }
  }, [userLocation]);

  const updateCustomerProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (currentUserId) {
        await updateDoc(doc(db, 'users', currentUserId), {
          ...data,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [currentUserId]);

  const verifyAndLoginAdmin = useCallback(async (_email: string, _password?: string): Promise<boolean> => isVerifiedAdmin, [isVerifiedAdmin]);
  const logoutAdmin = useCallback(() => {
    setUserRoleState('customer');
  }, []);

  const loginDemoAccount = useCallback(
    (demoEmail: string) => {
      const email = demoEmail.toLowerCase().trim();
      setIsAuthenticated(true);

      if (email === 'admin@dailymart.com') {
        const uid = 'demo_user_admin';
        setAuthUserId(uid);
        setIsVerifiedAdmin(true);
        setIsAuthorizedDelivery(false);
        setAuthorizedWorkspaces(['customer', 'admin']);
        setDetailedUserRole('SUPER_ADMIN');
        setAdminRoleState('SUPER_ADMIN');
        setUserRoleState('admin');
        setCurrentUser({
          id: uid,
          uid,
          name: 'Platform Operations Admin',
          email: 'admin@dailymart.com',
          phone: '+91 99000 00001',
          role: 'admin',
          detailedRole: 'SUPER_ADMIN',
          roles: { customer: true, merchant: true, delivery: true, admin: true },
          address: 'DailyMart Corporate Hub, Mumbai',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        });
        return;
      }

      if (email === 'shopowner@dailymart.com') {
        const uid = 'demo_user_shopowner';
        setAuthUserId(uid);
        setAuthorizedShopIds(['demo-shop-shree-krishna']);
        setIsVerifiedAdmin(false);
        setIsAuthorizedDelivery(false);
        setAuthorizedWorkspaces(['customer', 'shop_owner']);
        setDetailedUserRole('SHOP_OWNER');
        setUserRoleState('shop_owner');
        setCurrentUser({
          id: uid,
          uid,
          name: 'Rajesh Sharma (Store Owner)',
          email: 'shopowner@dailymart.com',
          phone: '+91 99000 00002',
          role: 'shop_owner',
          detailedRole: 'SHOP_OWNER',
          roles: { customer: true, merchant: true, delivery: false, admin: false },
          address: 'Civil Lines, Chandrapur',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        });
        return;
      }

      if (email === 'delivery@dailymart.com') {
        const uid = 'demo_user_delivery';
        setAuthUserId(uid);
        setUserRoleState('delivery_staff');
        setIsVerifiedAdmin(false);
        setIsAuthorizedDelivery(true);
        setAuthorizedWorkspaces(['customer', 'delivery_staff']);
        setDetailedUserRole('DELIVERY_STAFF');
        setAuthorizedShopIds([]);
        setCurrentUser({
          id: uid,
          uid,
          name: 'Sunil Kumar (Delivery Partner)',
          email: 'delivery@dailymart.com',
          phone: '+91 99000 00003',
          role: 'delivery_staff',
          detailedRole: 'DELIVERY_STAFF',
          roles: { customer: true, merchant: false, delivery: true, admin: false },
          address: 'Station Road, Chandrapur',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        });
        return;
      }

      // Default customer demo
      const uid = 'demo_user_customer';
      setAuthUserId(uid);
      setUserRoleState('customer');
      setIsVerifiedAdmin(false);
      setIsAuthorizedDelivery(false);
      setAuthorizedWorkspaces(['customer']);
      setDetailedUserRole('CUSTOMER');
      setAuthorizedShopIds([]);
      setCurrentUser({
        id: uid,
        uid,
        name: 'Aarav Patel',
        email: email || 'user@dailymart.com',
        phone: '+91 98220 12345',
        role: 'customer',
        detailedRole: 'CUSTOMER',
        roles: { customer: true, merchant: false, delivery: false, admin: false },
        address: userLocation.address || 'Civil Lines, Chandrapur',
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      });
    },
    [userLocation.address, userLocation.lat, userLocation.lng]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setAuthUserId(null);
    setIsAuthenticated(false);
    setIsVerifiedAdmin(false);
    setIsAuthorizedDelivery(false);
    setAuthorizedShopIds([]);
    setAuthorizedWorkspaces(['customer']);
    setDetailedUserRole('CUSTOMER');
    setUserRoleState('customer');
    setCurrentUser(null);
  }, []);

  const switchWorkspace = useCallback(
    (target: WorkspaceType): boolean => {
      if (!authUserId && target !== 'customer') {
        setIsAuthModalOpen(true);
        setAccessDeniedNotice('Sign in required to access partner or administrative workspaces.');
        return false;
      }

      if (target === 'admin') {
        if (!isVerifiedAdmin) {
          setAccessDeniedNotice('Access Denied: Platform Administrator authorization required.');
          return false;
        }
        setUserRoleState('admin');
        setAccessDeniedNotice(null);
        return true;
      }

      if (target === 'shop_owner') {
        if (authorizedShopIds.length === 0) {
          setAccessDeniedNotice('Access Denied: You do not have an approved shop on DailyMart.');
          return false;
        }
        setUserRoleState('shop_owner');
        setAccessDeniedNotice(null);
        return true;
      }

      if (target === 'delivery_staff') {
        if (!isAuthorizedDelivery) {
          setAccessDeniedNotice('Access Denied: You are not authorized as an active delivery partner.');
          return false;
        }
        setUserRoleState('delivery_staff');
        setAccessDeniedNotice(null);
        return true;
      }

      // Customer store is always accessible
      setUserRoleState('customer');
      setAccessDeniedNotice(null);
      return true;
    },
    [authUserId, isVerifiedAdmin, authorizedShopIds.length, isAuthorizedDelivery, setIsAuthModalOpen]
  );

  const setUserRole = useCallback(
    (role: UserRole) => {
      switchWorkspace(role);
    },
    [switchWorkspace]
  );

  const clearAccessDeniedNotice = useCallback(() => {
    setAccessDeniedNotice(null);
  }, []);

  const setAdminRole = useCallback((_role: AdminRole) => {}, []);

  // CRM internal merchant notes
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CRM_NOTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      cust_default: 'Regular grocery buyer, prefers morning delivery.',
    };
  });

  // Cart State
  const [cart, setCart] = useState<Cart>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { shopId: null, shopName: null, items: [] };
  });

  // Conflict modal state
  const [conflictModal, setConflictModal] = useState<ConflictModalState>({
    isOpen: false,
    pendingProduct: null,
    currentShopName: '',
    pendingShopName: '',
  });

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Update & persist location
  const updateLocation = useCallback((loc: UserLocation) => {
    setUserLocation(loc);
    try {
      localStorage.setItem(LOCAL_STORAGE_LOCATION_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save CRM Note
  const saveCustomerNote = useCallback((cId: string, note: string) => {
    setCustomerNotes((prev) => {
      const updated = { ...prev, [cId]: note };
      try {
        localStorage.setItem(LOCAL_STORAGE_CRM_NOTES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  // GPS detection
  const detectCurrentLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      return false;
    }

    setIsDetectingLocation(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newLoc: UserLocation = {
            address: 'GPS Detected Location',
            area: 'Local Vicinity',
            city: 'Local Area',
            lat,
            lng,
            isCustom: true,
          };
          updateLocation(newLoc);
          setIsDetectingLocation(false);
          setIsLocationModalOpen(false);
          resolve(true);
        },
        (error) => {
          console.warn('Geolocation warning:', error.message);
          setIsDetectingLocation(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [updateLocation]);

  // Audit Logger
  const logAuditAction = useCallback(
    async (
      action: string,
      resourceType: AuditLog['resourceType'],
      resourceId: string,
      details: string,
      reason?: string
    ) => {
      try {
        const newLog = {
          adminId: auth.currentUser?.uid || 'admin_sys',
          adminEmail: auth.currentUser?.email || 'admin@dailymart.com',
          adminRole,
          action,
          resourceType,
          resourceId,
          details,
          reason,
          timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'auditLogs'), newLog);
      } catch (e) {
        console.error('Audit log error:', e);
      }
    },
    [adminRole]
  );

  // Firestore Listeners & Boot
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen to shops
    const unsubShops = onSnapshot(
      collection(db, 'shops'),
      (snapshot) => {
        if (snapshot.empty) {
          setIsLoadingData(false);
        } else {
          const list: Shop[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              name: data.name || 'Local Grocery Store',
              ownerId: data.ownerId || 'owner_1',
              ownerName: data.ownerName || 'Store Owner',
              category: data.category || 'Groceries & Essentials',
              description: data.description || '',
              phone: data.phone || '',
              address: data.address || 'Local Street',
              city: data.city || 'City',
              pincode: data.pincode || '',
              latitude: Number(data.latitude) || userLocation.lat,
              longitude: Number(data.longitude) || userLocation.lng,
              isOpen: data.isOpen !== false,
              manualOverride: data.manualOverride || null,
              verificationStatus: data.verificationStatus || 'VERIFIED',
              verifiedBy: data.verifiedBy,
              verifiedAt: data.verifiedAt,
              verificationNotes: data.verificationNotes,
              isActive: data.isActive !== false,
              businessHours: data.businessHours || DEFAULT_BUSINESS_HOURS,
              deliveryConfig: data.deliveryConfig || DEFAULT_DELIVERY_CONFIG,
              rating: Number(data.rating) || 4.5,
              totalRatings: Number(data.totalRatings) || 20,
              deliveryRadius: Number(data.deliveryRadius) || 12,
              deliveryFee: Number(data.deliveryFee) || 20,
              freeDeliveryAbove: Number(data.freeDeliveryAbove) || 299,
              minOrder: Number(data.minOrder) || 99,
              estimatedDeliveryTime: data.estimatedDeliveryTime || '25–35 min',
              image: data.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600',
              coverImage: data.coverImage || data.image,
              tags: Array.isArray(data.tags) ? data.tags : ['Groceries'],
              gstin: data.gstin,
              pan: data.pan,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });
          setShops(list);
          setIsLoadingData(false);
        }
      },
      (error) => {
        setIsLoadingData(false);
        if ((error as any)?.code !== 'permission-denied') {
          console.warn('Shops listener warning:', error);
        }
      }
    );

    // 2. Listen to products
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            shopId: data.shopId,
            shopName: data.shopName || '',
            name: data.name || '',
            description: data.description || '',
            category: data.category || 'General',
            price: Number(data.price) || 0,
            mrp: Number(data.mrp) || Number(data.price) || 0,
            unit: data.unit || '1 unit',
            image: data.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
            stockQuantity: Number(data.stockQuantity ?? 20),
            lowStockThreshold: Number(data.lowStockThreshold ?? 10),
            inStock: data.inStock !== false && Number(data.stockQuantity ?? 20) > 0,
            isActive: data.isActive !== false,
            isAvailable: data.isAvailable !== false,
            isFeatured: !!data.isFeatured,
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
        setProducts(list);
      },
      (error) => {
        if ((error as any)?.code !== 'permission-denied') {
          console.warn('Products listener warning:', error);
        }
      }
    );

    // 3. Listen to orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            orderId: data.orderId || d.id.substring(0, 7).toUpperCase(),
            customerId: data.customerId || '',
            customerName: data.customerName || 'Customer',
            customerPhone: data.customerPhone || '',
            deliveryAddress: data.deliveryAddress || '',
            customerLatitude: Number(data.customerLatitude) || 0,
            customerLongitude: Number(data.customerLongitude) || 0,
            shopId: data.shopId || '',
            shopName: data.shopName || '',
            shopOwnerId: data.shopOwnerId || '',
            deliveryStaffId: data.deliveryStaffId || null,
            deliveryStaffName: data.deliveryStaffName || null,
            deliveryStaffPhone: data.deliveryStaffPhone || null,
            items: data.items || [],
            subtotal: Number(data.subtotal) || 0,
            deliveryFee: Number(data.deliveryFee) || 0,
            discount: Number(data.discount) || 0,
            totalAmount: Number(data.totalAmount) || 0,
            paymentMethod: data.paymentMethod || 'COD',
            paymentStatus: data.paymentStatus || 'PENDING',
            orderStatus: data.orderStatus || 'PENDING',
            estimatedDeliveryTime: data.estimatedDeliveryTime || '25–35 min',
            notes: data.notes || '',
            rejectionReason: data.rejectionReason,
            cancellationReason: data.cancellationReason,
            failureReason: data.failureReason,
            statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
            inventoryDeducted: !!data.inventoryDeducted,
            adminActionReason: data.adminActionReason,
            refundedAmount: Number(data.refundedAmount) || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        setOrders(list);
      },
      (error) => {
        if ((error as any)?.code !== 'permission-denied') {
          console.warn('Orders listener warning:', error);
        }
      }
    );

    // 4. Listen to categories
    const categoriesQuery = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Category);
        });
        setCategories(list);
      },
      (err) => {
        if ((err as any)?.code !== 'permission-denied') {
          console.warn('Categories warning:', err);
        }
      }
    );

    // 5. Listen to platformSettings
    const unsubSettings = onSnapshot(
      doc(db, 'platformSettings', 'main'),
      (d) => {
        if (d.exists()) {
          setPlatformSettings(d.data() as PlatformSettings);
        }
      },
      (err) => {
        if ((err as any)?.code !== 'permission-denied') {
          console.warn('Settings warning:', err);
        }
      }
    );

    // 6. Listen to Seller Applications
    const unsubSellerApps = onSnapshot(
      collection(db, 'sellerApplications'),
      (snapshot) => {
        const list: SellerApplication[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as SellerApplication);
        });
        setSellerApplications(list);
      },
      (err) => {
        if ((err as any)?.code !== 'permission-denied') {
          console.warn('Seller apps warning:', err);
        }
      }
    );

    // 7. Auth state listener
    const unsubAuth = onAuthStateChanged(auth, (usr) => {
      setAuthUserId(usr?.uid ?? null);
      setIsAuthenticated(!!usr);
    });

    return () => {
      unsubShops();
      unsubProducts();
      unsubOrders();
      unsubCategories();
      unsubSettings();
      unsubSellerApps();
      unsubAuth();
    };
  }, [userLocation.lat, userLocation.lng, userLocation.address]);

  // Compute nearby shops within default 12 km radius
  const nearbyShops = useMemo(() => {
    const radius = platformSettings.defaultDeliveryRadiusKm || 12;
    const discoverableShops = shops.filter(
      (s) => s.isActive !== false && s.verificationStatus !== 'REJECTED' && s.verificationStatus !== 'SUSPENDED'
    );
    return getNearbyShops(discoverableShops, userLocation, radius);
  }, [shops, userLocation, platformSettings.defaultDeliveryRadiusKm]);

  const activeShop = useMemo(() => {
    if (!activeShopId) return null;
    return shops.find((s) => s.id === activeShopId) || null;
  }, [shops, activeShopId]);

  const getProductsForShop = useCallback(
    (shopId: string) => {
      return products.filter((p) => p.shopId === shopId && p.isActive !== false);
    },
    [products]
  );

  // Cart Management
  const addToCart = useCallback(
    (product: Product, quantity = 1): boolean => {
      if (cart.shopId && cart.shopId !== product.shopId && cart.items.length > 0) {
        setConflictModal({
          isOpen: true,
          pendingProduct: product,
          currentShopName: cart.shopName || 'another shop',
          pendingShopName: product.shopName,
        });
        return false;
      }

      setCart((prev) => {
        const existingIdx = prev.items.findIndex((item) => item.product.id === product.id);
        let newItems: CartItem[];

        if (existingIdx > -1) {
          newItems = [...prev.items];
          newItems[existingIdx] = {
            ...newItems[existingIdx],
            quantity: newItems[existingIdx].quantity + quantity,
          };
        } else {
          newItems = [...prev.items, { product, quantity }];
        }

        return {
          shopId: product.shopId,
          shopName: product.shopName,
          items: newItems,
        };
      });

      return true;
    },
    [cart]
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const remaining = prev.items.filter((item) => item.product.id !== productId);
        return {
          shopId: remaining.length === 0 ? null : prev.shopId,
          shopName: remaining.length === 0 ? null : prev.shopName,
          items: remaining,
        };
      }

      const updated = prev.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      return { ...prev, items: updated };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const remaining = prev.items.filter((item) => item.product.id !== productId);
      return {
        shopId: remaining.length === 0 ? null : prev.shopId,
        shopName: remaining.length === 0 ? null : prev.shopName,
        items: remaining,
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({ shopId: null, shopName: null, items: [] });
  }, []);

  const closeConflictModal = useCallback(() => {
    setConflictModal({
      isOpen: false,
      pendingProduct: null,
      currentShopName: '',
      pendingShopName: '',
    });
  }, []);

  const resolveConflictClearAndAdd = useCallback(() => {
    if (conflictModal.pendingProduct) {
      const p = conflictModal.pendingProduct;
      setCart({
        shopId: p.shopId,
        shopName: p.shopName,
        items: [{ product: p, quantity: 1 }],
      });
    }
    closeConflictModal();
  }, [conflictModal.pendingProduct, closeConflictModal]);

  const cartItemCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

  const cartSubtotal = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart.items]);

  // Customer Orders
  const customerOrders = useMemo(() => {
    return orders.filter((o) => o.customerId === currentUserId || o.customerId === customerId);
  }, [orders, currentUserId, customerId]);

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find((o) => o.id === activeOrderId || o.orderId === activeOrderId) || null;
  }, [orders, activeOrderId]);

  // Create Order with central Commission & server authoritative pricing
  const createOrder = useCallback(
    async (orderData: {
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      landmark?: string;
      paymentMethod: 'COD' | 'ONLINE';
      notes?: string;
    }): Promise<string | null> => {
      if (!cart.shopId || cart.items.length === 0) return null;

      const fullAddress = orderData.landmark
        ? `${orderData.deliveryAddress} (Near ${orderData.landmark})`
        : orderData.deliveryAddress;

      try {
        const response = await marketplaceApi.createOrder({
          idempotencyKey: crypto.randomUUID(),
          shopId: cart.shopId,
          items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          deliveryAddress: fullAddress,
          phone: orderData.customerPhone,
          customerName: orderData.customerName,
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
        });

        clearCart();
        return response.orderId;
      } catch (err) {
        console.error('Error placing order:', err);
        return null;
      }
    },
    [cart, clearCart]
  );

  // Shop Owner State
  const shopOwnerShop = useMemo(() => {
    return shops.find((shop) => authorizedShopIds.includes(shop.id) || shop.ownerId === currentUserId) || null;
  }, [shops, authorizedShopIds, currentUserId]);

  const shopOwnerOrders = useMemo(() => {
    if (!shopOwnerShop) return [];
    return orders.filter((o) => o.shopId === shopOwnerShop.id);
  }, [orders, shopOwnerShop]);

  // Scoped Shop Members listener for authenticated merchant & staff context
  useEffect(() => {
    if (!authUserId) {
      setShopMembers([]);
      return;
    }

    try {
      const membersQuery = shopOwnerShop?.id
        ? query(collection(db, 'shopMembers'), where('shopId', '==', shopOwnerShop.id))
        : query(collection(db, 'shopMembers'), where('userId', '==', authUserId));

      const unsubMembers = onSnapshot(
        membersQuery,
        (snapshot) => {
          const list: ShopMember[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as ShopMember);
          });
          setShopMembers(list);
        },
        (_err) => {
          // Gracefully ignore permission-denied without triggering fatal console errors
        }
      );

      return () => unsubMembers();
    } catch (_err) {
      // Ignore query formation error if index/query parameters are resolving
    }
  }, [authUserId, shopOwnerShop?.id]);

  const merchantAccount = useMemo(() => {
    if (!shopOwnerShop) return null;
    return merchantAccounts.find((a) => a.shopId === shopOwnerShop.id) || null;
  }, [merchantAccounts, shopOwnerShop]);

  const merchantPayments = useMemo(() => {
    if (!shopOwnerShop) return [];
    return payments.filter((p) => p.shopId === shopOwnerShop.id);
  }, [payments, shopOwnerShop]);

  const merchantNotifications = useMemo(() => {
    if (!shopOwnerShop) return [];
    return notifications.filter((n) => n.shopId === shopOwnerShop.id);
  }, [notifications, shopOwnerShop]);

  // Merchant CRM
  const merchantCustomers = useMemo(() => {
    if (!shopOwnerShop) return [];
    const customerMap: Record<string, MerchantCustomer> = {};

    shopOwnerOrders.forEach((o) => {
      const cId = o.customerId || o.customerPhone || 'unknown';
      if (!customerMap[cId]) {
        customerMap[cId] = {
          customerId: cId,
          name: o.customerName || 'Customer',
          phone: o.customerPhone || '',
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstOrderDate: o.createdAt,
          lastOrderDate: o.createdAt,
          segment: 'New',
          status: 'ACTIVE',
          internalNotes: customerNotes[cId] || '',
          addresses: o.deliveryAddress ? [o.deliveryAddress] : [],
        };
      }

      const c = customerMap[cId];
      c.totalOrders += 1;
      c.totalSpent += o.totalAmount;
      if (new Date(o.createdAt) < new Date(c.firstOrderDate)) {
        c.firstOrderDate = o.createdAt;
      }
      if (new Date(o.createdAt) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = o.createdAt;
      }
      if (o.deliveryAddress && !c.addresses?.includes(o.deliveryAddress)) {
        c.addresses?.push(o.deliveryAddress);
      }
    });

    return Object.values(customerMap).map((c) => {
      c.averageOrderValue = Math.round(c.totalSpent / Math.max(1, c.totalOrders));
      return c;
    });
  }, [shopOwnerOrders, shopOwnerShop, customerNotes]);

  // Order Status Transitions with Status History
  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, reason?: string): Promise<boolean> => {
      try {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return false;

        const actorName =
          userRole === 'admin'
            ? 'Administrator'
            : userRole === 'delivery_staff'
            ? 'Delivery Staff'
            : userRole === 'shop_owner'
            ? 'Shop Owner'
            : 'Customer';

        const actorRole =
          userRole === 'admin'
            ? 'ADMIN'
            : userRole === 'delivery_staff'
            ? 'DELIVERY_STAFF'
            : userRole === 'shop_owner'
            ? 'SHOP_OWNER'
            : 'CUSTOMER';

        await marketplaceApi.transitionOrder({
          orderId,
          nextStatus: status,
          reason,
          actorRole,
          actorName,
        });

        return true;
      } catch (e) {
        console.error('Error updating order status:', e);
        return false;
      }
    },
    [orders, userRole]
  );

  // Mark COD collected
  const markCodPaymentCollected = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        await marketplaceApi.markCodCollected({ orderId });
        return true;
      } catch (e) {
        console.error('Error marking COD payment collected:', e);
        return false;
      }
    },
    []
  );

  // Merchant Shop Actions
  const toggleShopOpenStatus = useCallback(async (shopId: string, isOpen: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        isOpen,
        manualOverride: isOpen ? 'OPEN' : 'CLOSED',
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const setManualShopOverride = useCallback(
    async (shopId: string, override: 'OPEN' | 'CLOSED' | null): Promise<boolean> => {
      try {
        const isOpen = override === 'OPEN' ? true : override === 'CLOSED' ? false : true;
        await updateDoc(doc(db, 'shops', shopId), {
          manualOverride: override,
          isOpen,
          updatedAt: new Date().toISOString(),
        });
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    []
  );

  const updateBusinessHours = useCallback(async (shopId: string, hours: BusinessHours): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        businessHours: hours,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const updateDeliveryConfig = useCallback(async (shopId: string, config: DeliveryConfig): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        deliveryConfig: config,
        deliveryFee: config.deliveryFee,
        deliveryRadius: config.deliveryRadius,
        freeDeliveryAbove: config.freeDeliveryAbove,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const updateShopProfile = useCallback(async (shopId: string, data: Partial<Shop>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  // Products CRUD
  const addProduct = useCallback(async (productData: Omit<Product, 'id'>): Promise<string | null> => {
    try {
      const response = await marketplaceApi.manageProduct({ action: 'CREATE', shopId: productData.shopId, product: productData });
      return response.productId;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, data: Partial<Product>): Promise<boolean> => {
    try {
      const existing = products.find((product) => product.id === productId);
      if (!existing) return false;
      await marketplaceApi.manageProduct({ action: 'UPDATE', shopId: existing.shopId, productId, product: data });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [products]);

  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const existing = products.find((product) => product.id === productId);
      if (!existing) return false;
      await marketplaceApi.manageProduct({ action: 'DEACTIVATE', shopId: existing.shopId, productId });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [products]);

  const updateProductStock = useCallback(
    async (productId: string, stockQuantity: number, lowStockThreshold?: number): Promise<boolean> => {
      try {
        const existing = products.find((product) => product.id === productId);
        if (!existing) return false;
        await marketplaceApi.manageProduct({ action: 'ADJUST_STOCK', shopId: existing.shopId, productId, product: { stockQuantity, ...(lowStockThreshold === undefined ? {} : { lowStockThreshold }) } });
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [products]
  );

  const updateMerchantAccount = useCallback(
    async (shopId: string, accountData: Partial<MerchantAccount>): Promise<boolean> => {
      try {
        await setDoc(
          doc(db, 'merchantAccounts', shopId),
          {
            ...accountData,
            shopId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    []
  );

  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const clearAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      for (const n of merchantNotifications) {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [merchantNotifications]);

  // Delivery Staff Assignment & Management
  const assignDeliveryStaff = useCallback(
    async (orderId: string, staff: { id: string; name: string; phone?: string }): Promise<boolean> => {
      try {
        await marketplaceApi.assignDeliveryStaff({
          orderId,
          deliveryStaffId: staff.id,
          deliveryStaffName: staff.name,
          deliveryStaffPhone: staff.phone,
        });
        return true;
      } catch (err) {
        console.error('Failed to assign delivery staff:', err);
        return false;
      }
    },
    []
  );

  const addShopDeliveryStaff = useCallback(
    async (data: { name: string; phone: string; email: string; vehicleType?: 'BIKE' | 'SCOOTER' | 'EV' | 'CYCLE' | 'OTHER' }): Promise<boolean> => {
      if (!shopOwnerShop) return false;
      try {
        const staffUserId = 'staff_' + Math.random().toString(36).substring(2, 9);
        await marketplaceApi.manageShopMember({
          action: 'INVITE',
          shopId: shopOwnerShop.id,
          shopOwnerId: currentUser?.uid || auth.currentUser?.uid || '',
          userId: staffUserId,
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim().toLowerCase(),
          role: 'DELIVERY_STAFF',
          vehicleType: data.vehicleType || 'BIKE',
          permissions: [],
        });
        return true;
      } catch (err) {
        console.error('Failed to add delivery staff:', err);
        return false;
      }
    },
    [shopOwnerShop, currentUser]
  );

  // Demo seed trigger
  const seedDemoData = useCallback(async () => {
    return await seedDemoMarketplace();
  }, []);

  /* ==================== ADMIN ACTIONS IMPLEMENTATION ==================== */

  const approveMerchant = useCallback(
    async (appOrShopId: string, notes?: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();

        // 1. Check if it's a seller application
        const appRef = doc(db, 'sellerApplications', appOrShopId);
        const appSnap = await getDoc(appRef);

        if (appSnap.exists()) {
          const appData = appSnap.data() as SellerApplication;
          const newShopId = 'shop_' + appOrShopId.replace(/[^a-zA-Z0-9]/g, '_');

          // Create active shop
          await setDoc(doc(db, 'shops', newShopId), {
            id: newShopId,
            name: appData.shopName,
            ownerId: appData.applicantUid || appData.applicantUserId,
            ownerName: appData.applicantName,
            category: appData.category,
            address: appData.address,
            city: appData.city,
            pincode: appData.pincode,
            latitude: appData.latitude || userLocation.lat,
            longitude: appData.longitude || userLocation.lng,
            deliveryRadius: appData.deliveryRadius || 12,
            deliveryFee: 20,
            freeDeliveryAbove: 299,
            minOrder: 99,
            estimatedDeliveryTime: '20–30 min',
            gstin: appData.gstin,
            pan: appData.pan,
            isOpen: true,
            isActive: true,
            verificationStatus: 'VERIFIED',
            image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600',
            tags: ['Groceries', appData.category],
            createdAt: now,
            updatedAt: now,
          });

          // Create shop member (SHOP_OWNER)
          const applicantUid = (appData.applicantUid || appData.applicantUserId || 'owner_' + newShopId) as string;
          await setDoc(doc(db, 'shopMembers', `${applicantUid}_${newShopId}`), {
            id: `${applicantUid}_${newShopId}`,
            shopId: newShopId,
            shopOwnerId: applicantUid,
            userId: applicantUid,
            name: appData.applicantName,
            phone: appData.applicantPhone,
            email: appData.applicantEmail || '',
            role: 'SHOP_OWNER',
            status: 'ACTIVE',
            permissions: ['PRODUCT_MANAGE', 'ORDER_MANAGE', 'EMPLOYEE_MANAGE', 'DELIVERY_MANAGE'],
            createdAt: now,
            updatedAt: now,
          });

          // Update user profile role if applicant user ID exists
          if (applicantUid) {
            try {
              await updateDoc(doc(db, 'users', applicantUid), {
                role: 'shop_owner',
                shopId: newShopId,
                'roles.merchant': true,
                updatedAt: now,
              });
            } catch (userErr) {
              console.warn('Could not update user profile doc:', userErr);
            }
          }

          // Update application status
          await updateDoc(appRef, {
            status: 'APPROVED',
            shopId: newShopId,
            reviewNotes: notes || 'Approved by Admin operations',
            reviewedAt: now,
            updatedAt: now,
          });

          await logAuditAction('SELLER_APPLICATION_APPROVED', 'SELLER_APPLICATION', appOrShopId, `Seller application approved: ${appData.shopName}`);
          return true;
        }

        // 2. Standard shop approval
        await updateDoc(doc(db, 'shops', appOrShopId), {
          verificationStatus: 'VERIFIED',
          verifiedBy: 'admin_sys',
          verifiedAt: now,
          verificationNotes: notes || 'Approved by Admin operations',
          isActive: true,
          isOpen: true,
          updatedAt: now,
        });

        await logAuditAction('MERCHANT_APPROVED', 'SHOP', appOrShopId, `Shop ${appOrShopId} approved & activated.`, notes);
        return true;
      } catch (e) {
        console.error('Failed to approve merchant:', e);
        return false;
      }
    },
    [userLocation, logAuditAction]
  );

  const rejectMerchant = useCallback(
    async (shopId: string, reason: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'shops', shopId), {
          verificationStatus: 'REJECTED',
          verificationNotes: reason,
          isActive: false,
          isOpen: false,
          updatedAt: now,
        });

        await logAuditAction('MERCHANT_REJECTED', 'SHOP', shopId, `Merchant application rejected: ${reason}`, reason);
        return true;
      } catch (e) {
        console.error('Failed to reject merchant:', e);
        return false;
      }
    },
    [logAuditAction]
  );

  const suspendShop = useCallback(
    async (shopId: string, reason: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'shops', shopId), {
          verificationStatus: 'SUSPENDED',
          verificationNotes: reason,
          isActive: false,
          isOpen: false,
          updatedAt: now,
        });

        await logAuditAction('SHOP_SUSPENDED', 'SHOP', shopId, `Shop suspended: ${reason}`, reason);
        return true;
      } catch (e) {
        console.error('Failed to suspend shop:', e);
        return false;
      }
    },
    [logAuditAction]
  );

  const activateShop = useCallback(
    async (shopId: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'shops', shopId), {
          verificationStatus: 'VERIFIED',
          isActive: true,
          isOpen: true,
          updatedAt: now,
        });

        await logAuditAction('SHOP_ACTIVATED', 'SHOP', shopId, `Shop reactivated by admin.`);
        return true;
      } catch (e) {
        console.error('Failed to activate shop:', e);
        return false;
      }
    },
    [logAuditAction]
  );

  const adminCancelOrder = useCallback(
    async (orderId: string, reason: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'orders', orderId), {
          orderStatus: 'CANCELLED',
          cancellationReason: reason,
          updatedAt: now,
        });
        await logAuditAction('ORDER_CANCELLED', 'ORDER', orderId, `Admin cancelled order. Reason: ${reason}`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const adminRefundOrder = useCallback(
    async (orderId: string, refundAmount: number, reason: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'REFUNDED',
          refundedAmount: refundAmount,
          adminActionReason: reason,
          updatedAt: now,
        });
        await logAuditAction('ORDER_REFUNDED', 'ORDER', orderId, `Refund of ₹${refundAmount} processed. Reason: ${reason}`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const adminProcessPayout = useCallback(
    async (paymentId: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'payments', paymentId), {
          payoutStatus: 'PAID',
          payoutProcessedAt: now,
        });
        await logAuditAction('PAYOUT_PROCESSED', 'PAYMENT', paymentId, `Payout marked as processed.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const createCategory = useCallback(
    async (category: Omit<Category, 'id'>): Promise<string | null> => {
      try {
        const docRef = await addDoc(collection(db, 'categories'), category);
        await logAuditAction('CATEGORY_CREATED', 'CATEGORY', docRef.id, `Created category: ${category.name}`);
        return docRef.id;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    [logAuditAction]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>): Promise<boolean> => {
      try {
        await updateDoc(doc(db, 'categories', id), data);
        await logAuditAction('CATEGORY_UPDATED', 'CATEGORY', id, `Updated category details.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await updateDoc(doc(db, 'categories', id), { isActive: false });
        await logAuditAction('CATEGORY_DEACTIVATED', 'CATEGORY', id, `Deactivated category.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const createDispute = useCallback(
    async (dispute: Omit<Dispute, 'id' | 'disputeId' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
      try {
        const dispNumber = 'DSP-' + Math.floor(100 + Math.random() * 900);
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'disputes'), {
          ...dispute,
          disputeId: dispNumber,
          createdAt: now,
          updatedAt: now,
        });
        return docRef.id;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    []
  );

  const resolveDispute = useCallback(
    async (disputeId: string, resolution: string, refundAmount = 0): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        const dispute = disputes.find((d) => d.id === disputeId);

        await updateDoc(doc(db, 'disputes', disputeId), {
          status: 'RESOLVED',
          resolution,
          refundAmount,
          resolvedBy: 'admin_sys',
          resolvedAt: now,
          updatedAt: now,
        });

        if (dispute && refundAmount > 0) {
          const ord = orders.find((o) => o.orderId === dispute.orderNumber || o.id === dispute.orderId);
          if (ord) {
            await adminRefundOrder(ord.id, refundAmount, `Dispute resolution: ${resolution}`);
          }
        }

        await logAuditAction('DISPUTE_RESOLVED', 'DISPUTE', disputeId, `Resolved dispute: ${resolution}`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [disputes, orders, adminRefundOrder, logAuditAction]
  );

  const rejectDispute = useCallback(
    async (disputeId: string, reason: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'disputes', disputeId), {
          status: 'REJECTED',
          resolution: reason,
          resolvedBy: 'admin_sys',
          resolvedAt: now,
          updatedAt: now,
        });
        await logAuditAction('DISPUTE_REJECTED', 'DISPUTE', disputeId, `Rejected dispute. Reason: ${reason}`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const updatePlatformSettings = useCallback(
    async (settings: Partial<PlatformSettings>): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await setDoc(
          doc(db, 'platformSettings', 'main'),
          {
            ...settings,
            updatedAt: now,
          },
          { merge: true }
        );
        await logAuditAction('SETTINGS_UPDATED', 'SETTINGS', 'main', `Platform settings updated.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  const updateCustomerStatus = useCallback(
    async (cId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED', reason?: string): Promise<boolean> => {
      try {
        await updateDoc(doc(db, 'users', cId), {
          status,
          updatedAt: new Date().toISOString(),
        });
        await logAuditAction('CUSTOMER_STATUS_CHANGED', 'MERCHANT', cId, `Customer status: ${status} ${reason || ''}`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [logAuditAction]
  );

  return (
    <AppContext.Provider
      value={{
        userLocation,
        updateLocation,
        detectCurrentLocation,
        isDetectingLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        logout,
        shops,
        nearbyShops,
        products,
        isLoadingData,
        getProductsForShop,
        activeShop,
        setActiveShopId,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        conflictModal,
        closeConflictModal,
        resolveConflictClearAndAdd,
        cartItemCount,
        cartSubtotal,
        currentTab,
        setCurrentTab,
        activeOrderId,
        setActiveOrderId,
        isCheckingOut,
        setIsCheckingOut,
        searchQuery,
        setSearchQuery,
        customerOrders,
        activeOrder,
        createOrder,
        currentUser,
        currentUserId,
        updateCustomerProfile,
        isVerifiedAdmin,
        canAccessSellerDashboard,
        isAuthorizedDelivery,
        detailedUserRole,
        authorizedWorkspaces,
        switchWorkspace,
        accessDeniedNotice,
        clearAccessDeniedNotice,
        verifyAndLoginAdmin,
        logoutAdmin,
        loginDemoAccount,
        sellerApplication,
        submitSellerApplication,
        isBecomeSellerModalOpen,
        setIsBecomeSellerModalOpen,
        isSellerDetailsModalOpen,
        setIsSellerDetailsModalOpen,
        userRole,
        setUserRole,
        adminRole,
        setAdminRole,
        shopOwnerShop,
        shopOwnerOrders,
        updateOrderStatus,
        toggleShopOpenStatus,
        setManualShopOverride,
        updateBusinessHours,
        updateDeliveryConfig,
        updateShopProfile,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        merchantAccount,
        updateMerchantAccount,
        merchantPayments,
        markCodPaymentCollected,
        merchantCustomers,
        customerNotes,
        saveCustomerNote,
        merchantNotifications,
        markNotificationAsRead,
        clearAllNotifications,
        shopMembers,
        assignDeliveryStaff,
        addShopDeliveryStaff,
        seedDemoData,
        // Admin
        allOrders: orders,
        allPayments: payments,
        merchantAccountsList: merchantAccounts,
        categories,
        disputes,
        auditLogs,
        platformSettings,
        usersList,
        approveMerchant,
        rejectMerchant,
        suspendShop,
        activateShop,
        adminCancelOrder,
        adminRefundOrder,
        adminProcessPayout,
        createCategory,
        updateCategory,
        deleteCategory,
        createDispute,
        resolveDispute,
        rejectDispute,
        updatePlatformSettings,
        updateCustomerStatus,
        logAuditAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
