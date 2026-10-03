import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  Phone,
  Package,
  Bike,
  Home,
  XCircle,
  ShieldCheck,
  Check,
  User,
} from 'lucide-react';
import { OrderStatus } from '../../types';

export const OrderTrackingView: React.FC = () => {
  const { activeOrder, setActiveOrderId, setCurrentTab, shops } = useApp();

  if (!activeOrder) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center space-y-3">
        <p className="text-stone-500 text-sm">No active order selected for tracking.</p>
        <button
          onClick={() => setCurrentTab('orders')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          View All Orders
        </button>
      </div>
    );
  }

  const shop = shops.find((s) => s.id === activeOrder.shopId);

  // Status Step Index
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'ORDER_PLACED':
        return 0;
      case 'SHOP_ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'ASSIGNED_TO_DELIVERY':
      case 'ACCEPTED':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 4;
      case 'DELIVERED':
        return 5;
      case 'REJECTED':
      case 'CANCELLED':
      case 'DELIVERY_FAILED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(activeOrder.orderStatus);
  const isRejected = activeOrder.orderStatus === 'REJECTED';
  const isCancelled = activeOrder.orderStatus === 'CANCELLED';
  const isFailed = activeOrder.orderStatus === 'DELIVERY_FAILED';

  const steps = [
    { title: 'Order Placed', desc: 'Received by DailyMart', icon: Package },
    { title: 'Shop Accepted', desc: 'Store confirmed order', icon: Store },
    { title: 'Packing Groceries', desc: 'Items bagged fresh at counter', icon: Clock },
    { title: 'Ready for Pickup', desc: 'Waiting for rider pickup', icon: Check },
    { title: 'Out for Delivery', desc: 'Rider on two-wheeler towards you', icon: Bike },
    { title: 'Delivered', desc: 'Delivered to your doorstep', icon: Home },
  ];

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveOrderId(null)}
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Orders</span>
        </button>
        <span className="text-xs font-extrabold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md">
          #{activeOrder.orderId}
        </span>
      </div>

      {/* Live Order ETA Banner */}
      {!isRejected && !isCancelled && !isFailed && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
              {activeOrder.orderStatus === 'DELIVERED' ? 'Order Completed' : 'Estimated Arrival'}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live Tracking
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black tracking-tight">
              {activeOrder.orderStatus === 'DELIVERED'
                ? 'Delivered!'
                : activeOrder.estimatedDeliveryTime || '20–30 mins'}
            </h2>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed">
            {activeOrder.orderStatus === 'ORDER_PLACED' && 'Waiting for storekeeper to accept...'}
            {activeOrder.orderStatus === 'PENDING' && 'Waiting for storekeeper to accept...'}
            {activeOrder.orderStatus === 'SHOP_ACCEPTED' && 'Store confirmed order! Preparing bag.'}
            {activeOrder.orderStatus === 'PREPARING' && 'Store is currently bagging your fresh items.'}
            {activeOrder.orderStatus === 'READY_FOR_PICKUP' && 'Bagged and waiting for delivery partner pickup.'}
            {activeOrder.orderStatus === 'ASSIGNED_TO_DELIVERY' && 'Rider assigned to pick up your order.'}
            {activeOrder.orderStatus === 'ACCEPTED' && 'Rider heading to store for pickup.'}
            {activeOrder.orderStatus === 'PICKED_UP' && 'Rider collected package from store.'}
            {activeOrder.orderStatus === 'OUT_FOR_DELIVERY' && 'Delivery partner is on the way to your address!'}
            {activeOrder.orderStatus === 'DELIVERED' && 'Thank you for shopping locally on DailyMart!'}
          </p>
        </div>
      )}

      {/* Rejection / Cancellation / Failure Banner */}
      {(isRejected || isCancelled || isFailed) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Order {activeOrder.orderStatus.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-xs text-rose-700">
            {activeOrder.rejectionReason ||
              activeOrder.cancellationReason ||
              activeOrder.failureReason ||
              'This order could not be completed.'}
          </p>
        </div>
      )}

      {/* Progress Stepper */}
      {!isRejected && !isCancelled && !isFailed && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
            Delivery Status
          </h3>

          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
            {steps.map((step, idx) => {
              const isDone = currentStep >= idx;
              const isCurrent = currentStep === idx;

              return (
                <div key={step.title} className="flex items-start gap-3.5 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-100 font-black'
                        : 'bg-stone-100 text-stone-400 border border-stone-200'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-xs font-bold ${
                        isDone || isCurrent ? 'text-stone-900' : 'text-stone-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-stone-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned Delivery Partner Card (when assigned) */}
      {activeOrder.deliveryStaffName && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Assigned Delivery Partner
              </h3>
            </div>
            {activeOrder.deliveryStaffPhone && (
              <a
                href={`tel:${activeOrder.deliveryStaffPhone}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-100"
              >
                <Phone className="w-3 h-3" />
                <span>Call Partner</span>
              </a>
            )}
          </div>

          <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">{activeOrder.deliveryStaffName}</p>
              <p className="text-[11px] text-stone-500">Dedicated Store Delivery Rider</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              On Route
            </span>
          </div>
        </div>
      )}

      {/* Fulfilling Merchant Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Fulfilling Merchant
            </h3>
          </div>
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-100"
            >
              <Phone className="w-3 h-3" />
              <span>Call Shop</span>
            </a>
          )}
        </div>

        <div className="p-3 bg-stone-50 rounded-xl space-y-1">
          <p className="text-xs font-bold text-stone-900">{activeOrder.shopName}</p>
          {shop && (
            <p className="text-[11px] text-stone-500">{shop.address}, {shop.city}</p>
          )}
          {shop?.gstin && (
            <p className="text-[10px] text-stone-400 font-mono">GSTIN: {shop.gstin}</p>
          )}
        </div>
      </div>

      {/* Full Order Status Timeline History */}
      {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Order Status History
          </h3>

          <div className="space-y-2.5 text-xs">
            {activeOrder.statusHistory.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-stone-50 rounded-xl space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  By: {item.updatedBy} ({item.actorRole})
                </p>
                {item.reason && (
                  <p className="text-[11px] text-stone-600 italic">"{item.reason}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ordered Items List */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Ordered Items ({activeOrder.items?.length || 0})
        </h3>

        <div className="divide-y divide-stone-100">
          {activeOrder.items?.map((item, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                  {item.quantity}x
                </span>
                <span className="font-semibold text-stone-900">{item.name}</span>
                <span className="text-[10px] text-stone-400">({item.unit})</span>
              </div>
              <span className="font-bold text-stone-900">₹{item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
          <span className="font-bold text-stone-600">Total ({activeOrder.paymentMethod})</span>
          <span className="text-sm font-black text-emerald-700">₹{activeOrder.totalAmount}</span>
        </div>
      </div>
    </div>
  );
};
