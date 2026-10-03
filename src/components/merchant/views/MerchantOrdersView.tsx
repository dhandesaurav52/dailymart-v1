import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Package,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Bike,
  Store,
  Banknote,
  Eye,
  Check,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types';

interface MerchantOrdersViewProps {
  selectedOrderId?: string | null;
  onClearSelectedOrder?: () => void;
}

export const MerchantOrdersView: React.FC<MerchantOrdersViewProps> = ({
  selectedOrderId,
  onClearSelectedOrder,
}) => {
  const {
    shopOwnerShop,
    shopOwnerOrders,
    shopMembers,
    assignDeliveryStaff,
    updateOrderStatus,
    markCodPaymentCollected,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'ALL' | 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  >('ALL');

  const [detailModalOrder, setDetailModalOrder] = useState<Order | null>(() => {
    if (selectedOrderId) {
      return shopOwnerOrders.find((o) => o.id === selectedOrderId) || null;
    }
    return null;
  });

  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Out of stock or high store volume');

  // Dynamic available delivery fleet
  const availableStaff = useMemo(() => {
    const list = shopMembers
      .filter(
        (m) =>
          m.role === 'DELIVERY_STAFF' &&
          (m.shopId === shopOwnerShop?.id ||
            (shopOwnerShop?.id === 'demo-shop-shree-krishna' && m.email === 'delivery@dailymart.com'))
      )
      .map((m) => ({
        id: m.userId || m.id,
        name: m.name,
        phone: m.phone,
        vehicle: m.vehicleType || 'Bike',
      }));

    if (list.length === 0) {
      return [
        { id: 'demo_user_delivery', name: 'Sunil Kumar (DailyMart Express)', phone: '+91 99000 00003', vehicle: 'Motorcycle' },
      ];
    }
    return list;
  }, [shopMembers, shopOwnerShop]);

  // Assign delivery partner modal
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState(() => availableStaff[0]?.id || 'demo_user_delivery');
  const [selectedStaffName, setSelectedStaffName] = useState(() => availableStaff[0]?.name || 'Sunil Kumar');

  // Filter orders by tab
  const filteredOrders = shopOwnerOrders.filter((order) => {
    if (activeTab === 'NEW') return order.orderStatus === 'PENDING' || order.orderStatus === 'ORDER_PLACED';
    if (activeTab === 'ACCEPTED') return order.orderStatus === 'SHOP_ACCEPTED';
    if (activeTab === 'PREPARING') return order.orderStatus === 'PREPARING';
    if (activeTab === 'READY_FOR_PICKUP') return order.orderStatus === 'READY_FOR_PICKUP';
    if (activeTab === 'DISPATCHED') return ['ASSIGNED_TO_DELIVERY', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.orderStatus);
    if (activeTab === 'COMPLETED') return order.orderStatus === 'DELIVERED';
    if (activeTab === 'CANCELLED') return ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(order.orderStatus);
    return true;
  });

  const counts = {
    all: shopOwnerOrders.length,
    new: shopOwnerOrders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'ORDER_PLACED').length,
    accepted: shopOwnerOrders.filter((o) => o.orderStatus === 'SHOP_ACCEPTED').length,
    preparing: shopOwnerOrders.filter((o) => o.orderStatus === 'PREPARING').length,
    ready: shopOwnerOrders.filter((o) => o.orderStatus === 'READY_FOR_PICKUP').length,
    dispatched: shopOwnerOrders.filter((o) => ['ASSIGNED_TO_DELIVERY', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length,
    completed: shopOwnerOrders.filter((o) => o.orderStatus === 'DELIVERED').length,
    cancelled: shopOwnerOrders.filter((o) => ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(o.orderStatus)).length,
  };

  const handleConfirmReject = async () => {
    if (rejectModalOrder) {
      await updateOrderStatus(rejectModalOrder.id, 'REJECTED', rejectReason);
      setRejectModalOrder(null);
    }
  };

  const handleConfirmAssign = async () => {
    if (assignModalOrder) {
      const selected = availableStaff.find((s: { id: string }) => s.id === selectedStaffId) || availableStaff[0];
      await assignDeliveryStaff(assignModalOrder.id, {
        id: selected?.id || selectedStaffId,
        name: selected?.name || selectedStaffName,
        phone: selected?.phone,
      });
      setAssignModalOrder(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">
          Merchant Order Fulfillment
        </h2>
        <p className="text-xs text-stone-500">
          Accept, pack, ready, assign delivery staff and track customer orders
        </p>
      </div>

      {/* Tabs Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'ALL'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          All ({counts.all})
        </button>

        <button
          onClick={() => setActiveTab('NEW')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'NEW'
              ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          New ({counts.new})
        </button>

        <button
          onClick={() => setActiveTab('ACCEPTED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'ACCEPTED'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Accepted ({counts.accepted})
        </button>

        <button
          onClick={() => setActiveTab('PREPARING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'PREPARING'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Packing ({counts.preparing})
        </button>

        <button
          onClick={() => setActiveTab('READY_FOR_PICKUP')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'READY_FOR_PICKUP'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Ready to Assign ({counts.ready})
        </button>

        <button
          onClick={() => setActiveTab('DISPATCHED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'DISPATCHED'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Dispatched ({counts.dispatched})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Delivered ({counts.completed})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
            activeTab === 'CANCELLED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Issues / Cancelled ({counts.cancelled})
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-1">
          <p className="font-bold text-stone-700">No orders in this tab</p>
          <p>Orders will show here as customers place and update orders.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isPending = order.orderStatus === 'PENDING' || order.orderStatus === 'ORDER_PLACED';
            const isAccepted = order.orderStatus === 'SHOP_ACCEPTED';
            const isPreparing = order.orderStatus === 'PREPARING';
            const isReady = order.orderStatus === 'READY_FOR_PICKUP';
            const isAssigned = order.orderStatus === 'ASSIGNED_TO_DELIVERY';
            const isOut = order.orderStatus === 'OUT_FOR_DELIVERY';
            const isDelivered = order.orderStatus === 'DELIVERED';
            const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED' || order.orderStatus === 'DELIVERY_FAILED';

            const isOnlinePaid = order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID';
            const isCodPending = order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING';
            const isCodCollected = order.paymentMethod === 'COD' && order.paymentStatus === 'COLLECTED';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all space-y-3 ${
                  isPending ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'
                }`}
              >
                {/* Header: ID, Time, Payment Pill, Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-stone-900">
                        Order #{order.orderId}
                      </span>
                      {isOnlinePaid ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>ONLINE — PAID</span>
                        </span>
                      ) : isCodCollected ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          COD — CASH COLLECTED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          COD — COLLECT ON DELIVERY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-stone-900">
                      ₹{order.totalAmount}
                    </span>
                    <p className="text-[10px] text-stone-400">
                      {order.items.length} items
                    </p>
                  </div>
                </div>

                {/* Customer Information & Address */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">
                        {order.customerName}
                        {order.customerPhone && (
                          <span className="text-stone-500 font-normal"> ({order.customerPhone})</span>
                        )}
                      </p>
                      <p className="text-stone-600 mt-0.5">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-[11px] flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>

                {/* Items preview list */}
                <div className="text-xs text-stone-700 space-y-1 py-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        <strong className="text-stone-900">{item.quantity}x</strong> {item.name}{' '}
                        <span className="text-stone-400">({item.unit})</span>
                      </span>
                      <span className="font-semibold text-stone-900">₹{item.subtotal}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg mt-1">
                      Note from customer: {order.notes}
                    </p>
                  )}
                </div>

                {/* Assigned delivery staff info if assigned */}
                {order.deliveryStaffName && (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-stone-500 text-[11px]">Rider Assigned: </span>
                        <strong className="text-stone-900">{order.deliveryStaffName}</strong>
                      </div>
                    </div>
                    {order.deliveryStaffPhone && (
                      <span className="text-stone-600 font-mono text-[11px]">
                        {order.deliveryStaffPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Order Workflow Progression Actions */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={() => setDetailModalOrder(order)}
                    className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>

                  {/* Dynamic Workflow Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status 1: NEW / PENDING -> ACCEPT / REJECT */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => setRejectModalOrder(order)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                        >
                          REJECT
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'SHOP_ACCEPTED', 'Store accepted order.')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ACCEPT ORDER</span>
                        </button>
                      </>
                    )}

                    {/* Status 2: SHOP_ACCEPTED -> START PREPARING */}
                    {isAccepted && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING', 'Shop started bagging and packing items.')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Package className="w-4 h-4" />
                        <span>START PACKING</span>
                      </button>
                    )}

                    {/* Status 3: PREPARING -> MARK READY FOR PICKUP */}
                    {isPreparing && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP', 'Groceries packed and ready at counter.')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>MARK READY FOR PICKUP</span>
                      </button>
                    )}

                    {/* Status 4: READY_FOR_PICKUP -> ASSIGN DELIVERY PARTNER */}
                    {isReady && (
                      <button
                        onClick={() => setAssignModalOrder(order)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Bike className="w-4 h-4" />
                        <span>ASSIGN DELIVERY RIDER</span>
                      </button>
                    )}

                    {/* Status 5: ASSIGNED -> SHOW WAITING */}
                    {isAssigned && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waiting for rider pickup</span>
                      </span>
                    )}

                    {/* Status 6: OUT FOR DELIVERY */}
                    {isOut && (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5" />
                        <span>Rider on route to customer</span>
                      </span>
                    )}

                    {/* COD Payment collection button */}
                    {order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => markCodPaymentCollected(order.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Mark cash received from customer upon delivery"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Mark Cash Collected</span>
                      </button>
                    )}

                    {/* Completed / Cancelled Badge */}
                    {isDelivered && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        ✓ Delivered
                      </span>
                    )}
                    {isCancelled && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                        ✕ {order.orderStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Delivery Partner Modal */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Assign Delivery Staff
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Order #{assignModalOrder.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Select Delivery Rider:
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    const s = availableStaff.find((x: { id: string }) => x.id === e.target.value);
                    if (s) setSelectedStaffName(s.name);
                  }}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {availableStaff.map((staff: { id: string; name: string; phone?: string; vehicle?: string }) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.vehicle}) · {staff.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-stone-600">
                <p className="font-bold text-stone-900">Delivery Address:</p>
                <p>{assignModalOrder.deliveryAddress}</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Payment: {assignModalOrder.paymentMethod} (₹{assignModalOrder.totalAmount})
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAssignModalOrder(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
                ✕
              </div>
              <h3 className="text-base font-extrabold text-stone-900">
                Reject Order #{rejectModalOrder.orderId}
              </h3>
              <p className="text-stone-500">
                Customer will be notified and any online payment will be refunded.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-stone-700 font-bold">Reason for Rejection:</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
              >
                <option value="Out of stock or high store volume">Out of stock or high store volume</option>
                <option value="Store closing early today">Store closing early today</option>
                <option value="Delivery address outside operational coverage">Delivery address outside operational coverage</option>
                <option value="Price/catalog discrepancy">Price/catalog discrepancy</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Inspection Modal */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Order Status Timeline
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  #{detailModalOrder.orderId}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {detailModalOrder.statusHistory && detailModalOrder.statusHistory.length > 0 ? (
                detailModalOrder.statusHistory.map((item, idx) => (
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
                <p className="text-stone-400 italic">No timeline entries recorded for this order.</p>
              )}
            </div>

            <button
              onClick={() => setDetailModalOrder(null)}
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
