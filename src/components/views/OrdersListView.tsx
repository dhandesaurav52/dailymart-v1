import React from 'react';
import { useApp } from '../../context/AppContext';
import { Package, Clock, ChevronRight, Store, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../../types';

export const OrdersListView: React.FC = () => {
  const { customerOrders, setActiveOrderId, setCurrentTab } = useApp();

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Pending Acceptance</span>;
      case 'SHOP_ACCEPTED':
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Accepted</span>;
      case 'PREPARING':
        return <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">Packing Groceries</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">Delivered</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">Cancelled</span>;
      default:
        return null;
    }
  };

  if (customerOrders.length === 0) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-stone-900">No Orders Yet</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
            When you place an order with a nearby grocery store, you can track it live here.
          </p>
        </div>
        <button
          onClick={() => setCurrentTab('home')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
        >
          Find Nearby Shops
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-3">
      <div>
        <h2 className="text-lg font-black text-stone-900">Your Orders</h2>
        <p className="text-xs text-stone-500">Live tracking and order history</p>
      </div>

      <div className="space-y-3">
        {customerOrders.map((order) => {
          const isActive =
            order.orderStatus !== 'DELIVERED' &&
            order.orderStatus !== 'CANCELLED' &&
            order.orderStatus !== 'REJECTED';

          return (
            <div
              key={order.id}
              onClick={() => setActiveOrderId(order.id)}
              className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 ${
                isActive ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      {order.shopName}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Order #{order.orderId} ·{' '}
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {getStatusBadge(order.orderStatus)}
              </div>

              {/* Items summary */}
              <div className="text-xs text-stone-600 line-clamp-1 bg-stone-50 px-2.5 py-1.5 rounded-lg">
                {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                <div>
                  <span className="text-stone-400 text-[11px]">Total: </span>
                  <span className="font-extrabold text-stone-900">₹{order.totalAmount}</span>
                </div>

                <div className="flex items-center gap-1 font-bold text-emerald-700">
                  <span>{isActive ? 'Track Live' : 'View Details'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
