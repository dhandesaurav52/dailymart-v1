import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Bike,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Store,
  CreditCard,
  DollarSign,
  ChevronDown,
  X,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types';

interface AdminOrdersViewProps {
  initialSelectedOrderId?: string | null;
  onClearInitialOrder?: () => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  initialSelectedOrderId,
  onClearInitialOrder,
}) => {
  const {
    allOrders,
    shops,
    adminCancelOrder,
    adminRefundOrder,
    updateOrderStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [inspectOrder, setInspectOrder] = useState<Order | null>(() => {
    if (initialSelectedOrderId) {
      return allOrders.find((o) => o.id === initialSelectedOrderId) || null;
    }
    return null;
  });

  // Action Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (order.orderId && order.orderId.toLowerCase().includes(q)) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.customerPhone && order.customerPhone.includes(q)) ||
        (order.shopName && order.shopName.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        selectedStatus === 'ALL' || order.orderStatus === selectedStatus;

      // Shop
      const matchesShop =
        selectedShopId === 'ALL' || order.shopId === selectedShopId;

      // Payment
      const matchesPayment =
        selectedPaymentMethod === 'ALL' ||
        order.paymentMethod === selectedPaymentMethod;

      return matchesSearch && matchesStatus && matchesShop && matchesPayment;
    });
  }, [allOrders, searchQuery, selectedStatus, selectedShopId, selectedPaymentMethod]);

  const handleCancelOrder = async () => {
    if (!inspectOrder || !cancelReason.trim()) return;
    setIsProcessing(true);
    await adminCancelOrder(inspectOrder.id, cancelReason);
    setIsProcessing(false);
    setShowCancelModal(false);
    setCancelReason('');
    // refresh inspected order
    const updated = allOrders.find((o) => o.id === inspectOrder.id);
    if (updated) setInspectOrder(updated);
  };

  const handleRefundOrder = async () => {
    if (!inspectOrder || refundAmount <= 0 || !refundReason.trim()) return;
    setIsProcessing(true);
    await adminRefundOrder(inspectOrder.id, refundAmount, refundReason);
    setIsProcessing(false);
    setShowRefundModal(false);
    setRefundReason('');
    const updated = allOrders.find((o) => o.id === inspectOrder.id);
    if (updated) setInspectOrder(updated);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OUT_FOR_DELIVERY':
      case 'PREPARING':
      case 'SHOP_ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Monitor and manage customer orders across all marketplace merchants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
            Total: {allOrders.length} Orders
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Acceptance</option>
            <option value="SHOP_ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected by Shop</option>
          </select>

          {/* Shop Filter */}
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Shops ({shops.length})</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="ONLINE">Online UPI / Card</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-600">No orders found.</p>
            <p className="text-xs text-stone-400">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Shop</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredOrders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">
                          #{order.orderId || order.id.slice(0, 6)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {new Date(order.createdAt).toLocaleDateString()}{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-800 truncate max-w-[150px]">
                          {order.shopName}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          ID: {order.shopId?.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-800">
                          {order.customerName}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {order.customerPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) > 1 ? 's' : ''}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">
                          ₹{order.totalAmount}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Fee: ₹{order.deliveryFee}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            order.paymentMethod === 'ONLINE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectOrder(order)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Top */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  📦
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Order #{inspectOrder.orderId || inspectOrder.id}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Placed on {new Date(inspectOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectOrder(null);
                  if (onClearInitialOrder) onClearInitialOrder();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Payment Header Banner */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getStatusBadge(
                    inspectOrder.orderStatus
                  )}`}
                >
                  {inspectOrder.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Payment:</span>
                <span className="text-xs font-black text-stone-900">
                  {inspectOrder.paymentMethod} ({inspectOrder.paymentStatus})
                </span>
              </div>
            </div>

            {/* Shop & Customer details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>Merchant Shop</span>
                </div>
                <p className="font-extrabold text-stone-900">
                  {inspectOrder.shopName}
                </p>
                <p className="text-[11px] text-stone-500">
                  Shop ID: {inspectOrder.shopId}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Info</span>
                </div>
                <p className="font-extrabold text-stone-900">
                  {inspectOrder.customerName}
                </p>
                <p className="text-[11px] text-stone-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" />
                  {inspectOrder.customerPhone}
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-2">
                  <MapPin className="w-3 h-3 inline text-stone-400 mr-0.5" />
                  {inspectOrder.deliveryAddress}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                Order Items ({inspectOrder.items?.length || 0})
              </h4>
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-44 overflow-y-auto">
                {inspectOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-[10px]">
                        🥗
                      </div>
                      <div>
                        <span className="font-bold text-stone-900">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-1.5">
                          × {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">
                      ₹{item.subtotal || item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>₹{inspectOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Delivery Fee</span>
                <span>₹{inspectOrder.deliveryFee}</span>
              </div>
              {inspectOrder.discount ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{inspectOrder.discount}</span>
                </div>
              ) : null}
              <div className="border-t border-stone-200 pt-1.5 flex justify-between font-black text-stone-900 text-sm">
                <span>Total Amount</span>
                <span>₹{inspectOrder.totalAmount}</span>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {inspectOrder.orderStatus !== 'CANCELLED' &&
                  inspectOrder.orderStatus !== 'DELIVERED' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Admin Cancel
                    </button>
                  )}

                <button
                  onClick={() => {
                    setRefundAmount(inspectOrder.totalAmount);
                    setShowRefundModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Issue Refund
                </button>
              </div>

              <button
                onClick={() => setInspectOrder(null)}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Cancel Order Modal */}
      {showCancelModal && inspectOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900">
                Cancel Order #{inspectOrder.orderId || inspectOrder.id}?
              </h3>
              <p className="text-xs text-stone-500">
                This will terminate the delivery flow and notify both customer
                and merchant.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Shop unable to fulfill, customer requested cancellation, unreachable delivery address..."
                rows={3}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isProcessing || !cancelReason.trim()}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Refund Modal */}
      {showRefundModal && inspectOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900">
                Process Customer Refund
              </h3>
              <p className="text-xs text-stone-500">
                Order Total: ₹{inspectOrder.totalAmount}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={inspectOrder.totalAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Reason for Refund *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Missing items, customer dispute settled, damaged items during transit..."
                  rows={2}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundOrder}
                disabled={isProcessing || refundAmount <= 0 || !refundReason.trim()}
                className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Refunding...' : `Refund ₹${refundAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
