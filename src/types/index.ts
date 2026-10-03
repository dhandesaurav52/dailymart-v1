export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation {
  address: string;
  area: string;
  city: string;
  pincode?: string;
  lat: number;
  lng: number;
  isCustom?: boolean;
}

export interface DaySchedule {
  open: string;  // e.g. "08:00"
  close: string; // e.g. "21:00"
  isClosed: boolean;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DeliveryConfig {
  isDeliveryAvailable: boolean;
  deliveryRadius: number; // in km
  deliveryFee: number; // in INR
  freeDeliveryAbove: number; // in INR
  estimatedDeliveryTime: string; // e.g. "25–35 min"
  deliveryModel: 'SELF' | 'DAILYMART' | 'THIRD_PARTY';
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  manualOverride?: 'OPEN' | 'CLOSED' | null;
  businessHours?: BusinessHours;
  deliveryConfig?: DeliveryConfig;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  isActive?: boolean;
  rating: number;
  totalRatings: number;
  deliveryRadius: number; // in km, defaults to 12
  deliveryFee: number;
  freeDeliveryAbove?: number;
  minOrder: number;
  estimatedDeliveryTime: string;
  image: string;
  coverImage?: string;
  tags: string[];
  gstin?: string;
  pan?: string;
  distanceKm?: number;
  isDemoData?: boolean;
  environment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description: string;
  category: string;
  price: number; // Selling Price
  mrp: number;   // MRP
  unit: string;
  image: string;
  stockQuantity: number;
  reservedQuantity?: number;
  lowStockThreshold: number; // Defaults to 10
  inStock: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isDemoData?: boolean;
  environment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  shopId: string | null;
  shopName: string | null;
  items: CartItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'ORDER_PLACED'
  | 'SHOP_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED_TO_DELIVERY'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DELIVERY_FAILED';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  subtotal: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: string;
  updatedBy: string; // Actor UID or Display Name
  actorRole: 'CUSTOMER' | 'SHOP_OWNER' | 'DELIVERY_STAFF' | 'ADMIN' | 'SYSTEM';
  reason?: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  landmark?: string;
  customerLatitude: number;
  customerLongitude: number;
  shopId: string;
  shopName: string;
  shopOwnerId: string;
  deliveryStaffId?: string | null;
  deliveryStaffName?: string | null;
  deliveryStaffPhone?: string | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'COLLECTED' | 'FAILED' | 'REFUNDED';
  orderStatus: OrderStatus;
  estimatedDeliveryTime: string;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  failureReason?: string;
  statusHistory?: OrderStatusHistoryItem[];
  financials?: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    platformFee: number;
    totalAmount: number;
    merchantAmount: number;
    currency: string;
    refundAmount: number;
  };
  inventoryDeducted?: boolean;
  adminActionReason?: string;
  refundedAmount?: number;
  isDemoData?: boolean;
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantAccount {
  shopId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessAddress: string;
  gstin?: string;
  pan?: string;
  bankAccountHolder: string;
  bankName: string;
  ifsc: string;
  accountNumberMasked: string; // e.g. "****4821" - raw account never stored
  status: 'NOT_CONNECTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
  payoutStatus: 'ACTIVE' | 'INACTIVE';
  platformCommissionRate: number; // e.g. 5 for 5%
  connectedAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  shopId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'COLLECTED' | 'FAILED' | 'REFUNDED';
  platformFee: number;
  merchantAmount: number;
  payoutStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD' | 'PENDING_COLLECTION';
  payoutProcessedAt?: string;
  createdAt: string;
}

export type CustomerSegment = 'New' | 'Repeat' | 'High Value' | 'Frequent' | 'Inactive';

export interface MerchantCustomer {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  segment: CustomerSegment;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  internalNotes?: string;
  addresses?: string[];
}

export interface MerchantNotification {
  id: string;
  shopId: string;
  type: 'NEW_ORDER' | 'ORDER_CANCELLED' | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'LOW_STOCK' | 'SHOP_CLOSED';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  isRead: boolean;
  createdAt: string;
}

export type UserRole = 'customer' | 'shop_owner' | 'delivery_staff' | 'admin';

export type WorkspaceType = 'customer' | 'shop_owner' | 'delivery_staff' | 'admin';

export type DetailedUserRole =
  | 'CUSTOMER'
  | 'SHOP_OWNER'
  | 'SHOP_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'DELIVERY_STAFF'
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN';

export interface ResolvedAccess {
  adminRole: AdminRole | null;
  shopRole: 'SHOP_OWNER' | 'SHOP_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER' | null;
  deliveryRole: 'DELIVERY_STAFF' | null;
  ownedShopIds: string[];
  staffShopIds: string[];
  deliveryShopIds: string[];
  isCustomer: boolean;
  detailedRole: DetailedUserRole;
  authorizedWorkspaces: WorkspaceType[];
  primaryWorkspace: WorkspaceType;
}

export interface UserRoles {
  customer: boolean;
  merchant: boolean;
  delivery: boolean;
  admin: boolean;
}

export interface SellerApplication {
  id: string;
  applicationId: string; // e.g. "DM-REG-1048"
  applicantUid: string;
  applicantUserId?: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  shopName: string;
  category: string;
  address: string;
  city: string;
  pincode: string;
  deliveryRadius: number;
  gstin: string; // MANDATORY & VALIDATED
  pan?: string;
  latitude?: number;
  longitude?: number;
  documents?: string[];
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO' | 'SUSPENDED';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  shopId?: string;
  isDemoData?: boolean;
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopMember {
  id: string;
  shopId: string;
  shopOwnerId?: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: 'SHOP_OWNER' | 'SHOP_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER' | 'DELIVERY_STAFF';
  vehicleType?: 'BIKE' | 'SCOOTER' | 'EV' | 'CYCLE' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: string[];
  isDemoData?: boolean;
  environment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  shopId: string;
  shopName?: string;
  deliveryStaffId: string;
  deliveryStaffName?: string;
  deliveryStaffPhone?: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_DELIVERY';
  failureReason?: string;
  assignedAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  detailedRole?: DetailedUserRole;
  roles: UserRoles;
  sellerApplication?: SellerApplication;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  address: string;
  latitude: number;
  longitude: number;
  shopId?: string; // For shop owners or delivery staff
  createdAt?: string;
}

/* ==================== ADMIN SPECIFIC TYPES ==================== */

export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Dispute {
  id: string;
  disputeId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  shopId: string;
  shopName: string;
  issueType: 'MISSING_ITEM' | 'WRONG_ITEM' | 'DAMAGED_ITEM' | 'NOT_DELIVERED' | 'PAYMENT_ISSUE' | 'OTHER';
  description: string;
  amount: number;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  refundAmount?: number;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole | string;
  action: string;
  resourceType: 'ORDER' | 'SHOP' | 'MERCHANT' | 'PRODUCT' | 'PAYMENT' | 'DISPUTE' | 'SETTINGS' | 'CATEGORY' | 'SELLER_APPLICATION' | 'SHOP_MEMBER';
  resourceId: string;
  details: string;
  reason?: string;
  timestamp: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultDeliveryRadiusKm: number; // 12
  defaultCommissionRate: number;   // 5%
  defaultDeliveryFee: number;      // 25
  minOrderAmount: number;          // 99
  isCodEnabled: boolean;
  autoCancelTimeoutMins: number;
  updatedAt: string;
}
