import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bike,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  LogOut,
  Navigation,
  Check,
  Banknote,
  Store,
  Eye,
  Calendar,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

export const DeliveryDashboard: React.FC = () => {
  const {
    currentUser,
    customerOrders,
    allOrders,
    updateOrderStatus,
    markCodPaymentCollected,
    logoutAdmin,
    setUserRole,
    shops,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DELIVERED' | 'FAILED'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Failure modal state
  const [failureModalOrder, setFailureModalOrder] = useState<Order | null>(null);
  const [failureReason, setFailureReason] = useState('Customer phone unreachable after multiple attempts');
  const [isUpdating, setIsUpdating] = useState(false);

  // Cash on delivery collected confirmation
  const [codCollectedChecked, setCodCollectedChecked] = useState(false);

  // Find shop assigned to this delivery partner
  const staffShopId = currentUser?.shopId || 'demo-shop-shree-krishna';
  const assignedShop = shops.find((s) => s.id === staffShopId);

  // Filter orders assigned to this delivery staff
  // Either by deliveryStaffId matching current user's UID or matching the demo delivery partner ID
  const staffAssignedOrders = useMemo(() => {
    const uid = currentUser?.uid || currentUser?.id;
    return allOrders.filter((order) => {
      if (order.deliveryStaffId) {
        return (
          order.deliveryStaffId === uid ||
          order.deliveryStaffId === 'demo_user_delivery' ||
          (currentUser?.email === 'delivery@dailymart.com' && order.deliveryStaffId.includes('delivery'))
        );
      }
      return false;
    });
  }, [allOrders, currentUser]);

  const activeOrders = useMemo(() => {
    return staffAssignedOrders.filter((o) =>
      ['ASSIGNED_TO_DELIVERY', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
    );
  }, [staffAssignedOrders]);

  const completedOrders = useMemo(() => {
    return staffAssignedOrders.filter((o) => o.orderStatus === 'DELIVERED');
  }, [staffAssignedOrders]);

  const failedOrders = useMemo(() => {
    return staffAssignedOrders.filter((o) =>
      ['DELIVERY_FAILED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)
    );
  }, [staffAssignedOrders]);

  const displayedOrders = useMemo(() => {
    if (activeTab === 'ACTIVE') return activeOrders;
    if (activeTab === 'DELIVERED') return completedOrders;
    return failedOrders;
  }, [activeTab, activeOrders, completedOrders, failedOrders]);

  // Handle Workflow Status Transitions
  const handleTransition = async (order: Order, nextStatus: OrderStatus, reason?: string) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(order.id, nextStatus, reason);
      if (nextStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
        await markCodPaymentCollected(order.id);
      }
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: nextStatus } : null));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmFailed = async () => {
    if (!failureModalOrder) return;
    setIsUpdating(true);
    try {
      await updateOrderStatus(failureModalOrder.id, 'DELIVERY_FAILED', failureReason);
      setFailureModalOrder(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setUserRole('customer');
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-stone-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  DailyMart Partner
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate max-w-[200px] sm:max-w-xs">
                {assignedShop?.name || 'Local Grocery Store'} · {currentUser?.name || 'Sunil Kumar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserRole('customer')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 font-bold transition-colors cursor-pointer"
              title="View Customer App"
            >
              Customer App
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="bg-stone-800/80 border-t border-stone-800 px-4 py-2 text-xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-stone-300">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium truncate max-w-[240px]">
                Base: {assignedShop?.address || 'Tukum, Chandrapur'}
              </span>
            </div>
            <span className="font-bold text-emerald-400">
              {activeOrders.length} Active Run{activeOrders.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Navigation Filter Tabs */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Active Deliveries ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DELIVERED')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'DELIVERED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FAILED')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'FAILED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Issues ({failedOrders.length})</span>
          </button>
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <p className="font-extrabold text-sm text-stone-700">No deliveries in this section</p>
            <p className="text-xs text-stone-400">
              {activeTab === 'ACTIVE'
                ? 'When a shop owner assigns an order for dispatch, it will appear here instantly.'
                : 'Delivered orders will be archived here for your records.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayedOrders.map((order) => {
              const isAssigned = order.orderStatus === 'ASSIGNED_TO_DELIVERY';
              const isAccepted = order.orderStatus === 'ACCEPTED';
              const isPickedUp = order.orderStatus === 'PICKED_UP';
              const isOut = order.orderStatus === 'OUT_FOR_DELIVERY';
              const isDelivered = order.orderStatus === 'DELIVERED';
              const isFailed = order.orderStatus === 'DELIVERY_FAILED';

              const isCod = order.paymentMethod === 'COD';
              const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COLLECTED';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs transition-all space-y-3.5 ${
                    isOut
                      ? 'border-amber-400 ring-2 ring-amber-100'
                      : isAssigned
                      ? 'border-blue-400 ring-2 ring-blue-50'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Top Bar: Order ID, Amount, Payment Method */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-stone-900 tracking-tight">
                          #{order.orderId}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isAssigned
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : isAccepted
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : isPickedUp
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : isOut
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {order.items.length} items
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-stone-900">
                        ₹{order.totalAmount}
                      </span>
                      <div className="mt-0.5">
                        {isCod ? (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            COD: Collect Cash
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Prepaid (Online)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pickup & Drop Addresses */}
                  <div className="space-y-2 bg-stone-50 rounded-2xl p-3 border border-stone-100 text-xs">
                    {/* Pickup Shop */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-900">
                          Pickup: {order.shopName || assignedShop?.name}
                        </p>
                        <p className="text-stone-500 text-[11px] truncate">
                          {assignedShop?.address || 'Shop Counter, Tukum'}
                        </p>
                      </div>
                    </div>

                    {/* Divider dotted */}
                    <div className="border-t border-stone-200/80 my-1" />

                    {/* Customer Drop-off */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900">
                            Deliver to: {order.customerName}
                          </p>
                          <p className="text-stone-600 text-[11px] leading-relaxed">
                            {order.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="px-2.5 py-1 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 font-bold text-[11px] rounded-lg shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Package Items Snippet */}
                  <div className="text-xs text-stone-600 space-y-1">
                    <p className="font-bold text-stone-700 text-[11px]">Items to Deliver:</p>
                    <div className="bg-stone-50/60 rounded-xl p-2 text-[11px] space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            <strong className="text-stone-800">{item.quantity}x</strong> {item.name}{' '}
                            <span className="text-stone-400">({item.unit})</span>
                          </span>
                          <span className="font-semibold text-stone-800">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                        Customer instruction: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Delivery Workflow Action Controls */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Timeline</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Step 1: ASSIGNED -> ACCEPT */}
                      {isAssigned && (
                        <>
                          <button
                            onClick={() => setFailureModalOrder(order)}
                            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleTransition(order, 'ACCEPTED', 'Delivery partner accepted assignment.')}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Assignment</span>
                          </button>
                        </>
                      )}

                      {/* Step 2: ACCEPTED -> PICKED_UP */}
                      {isAccepted && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleTransition(order, 'PICKED_UP', 'Package collected from shop counter.')}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Package className="w-4 h-4" />
                          <span>At Store: Pick Up Order</span>
                        </button>
                      )}

                      {/* Step 3: PICKED_UP -> OUT_FOR_DELIVERY */}
                      {isPickedUp && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleTransition(order, 'OUT_FOR_DELIVERY', 'Rider heading to customer location.')}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Start Ride / Out for Delivery</span>
                        </button>
                      )}

                      {/* Step 4: OUT_FOR_DELIVERY -> DELIVERED & FAILED */}
                      {isOut && (
                        <>
                          <button
                            onClick={() => setFailureModalOrder(order)}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                          >
                            Failed / Issue
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() =>
                              handleTransition(
                                order,
                                'DELIVERED',
                                isCod
                                  ? `Delivered to customer. ₹${order.totalAmount} cash collected.`
                                  : 'Delivered in hand to customer.'
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isCod ? `Collect ₹${order.totalAmount} & Deliver` : 'Mark Delivered'}
                            </span>
                          </button>
                        </>
                      )}

                      {isDelivered && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      )}

                      {isFailed && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{order.orderStatus}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Failure / Issue Modal */}
      {failureModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900">
                Report Delivery Issue / Failure
              </h3>
              <p className="text-xs text-stone-500">
                Order #{failureModalOrder.orderId} · {failureModalOrder.customerName}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-stone-700 font-bold">Select Reason:</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="Customer phone unreachable after multiple attempts">
                  Customer phone unreachable after multiple attempts
                </option>
                <option value="Customer refused order at doorstep">
                  Customer refused order at doorstep
                </option>
                <option value="Incorrect or incomplete delivery address">
                  Incorrect or incomplete delivery address
                </option>
                <option value="Premises locked / nobody at home">
                  Premises locked / nobody at home
                </option>
                <option value="Vehicle breakdown / emergency">
                  Vehicle breakdown / emergency
                </option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFailureModalOrder(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                disabled={isUpdating}
                onClick={handleConfirmFailed}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                {isUpdating ? 'Updating...' : 'Submit Failure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Timeline Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Order History &amp; Status
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  #{selectedOrder.orderId}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                selectedOrder.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative pl-5 pb-3 border-l-2 border-stone-200 last:border-l-0">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-stone-900">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      By: <strong className="text-stone-700">{item.updatedBy}</strong> ({item.actorRole})
                    </p>
                    {item.reason && (
                      <p className="text-[11px] text-stone-600 bg-stone-50 p-1.5 rounded-lg mt-1 italic">
                        "{item.reason}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-stone-400 italic">No historical timeline recorded for this order.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
