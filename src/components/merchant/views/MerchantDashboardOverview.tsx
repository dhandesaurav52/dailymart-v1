import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ShoppingBag,
  Power,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  ArrowRight,
  MapPin,
  Banknote,
} from 'lucide-react';
import { MerchantTab } from '../MerchantBottomNav';
import { isShopCurrentlyOpen } from '../../../lib/seedData';

interface MerchantDashboardOverviewProps {
  onNavigateTab: (tab: MerchantTab) => void;
  onOpenAddProduct: () => void;
  onViewOrderDetails: (orderId: string) => void;
}

export const MerchantDashboardOverview: React.FC<MerchantDashboardOverviewProps> = ({
  onNavigateTab,
  onOpenAddProduct,
  onViewOrderDetails,
}) => {
  const {
    shopOwnerShop,
    shopOwnerOrders,
    updateOrderStatus,
    toggleShopOpenStatus,
    setManualShopOverride,
  } = useApp();

  if (!shopOwnerShop) return null;

  const isOpen = isShopCurrentlyOpen(shopOwnerShop);

  // Compute Today's metrics from actual Firestore orders
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = shopOwnerOrders.filter((o) => {
    return new Date(o.createdAt).getTime() >= todayStart.getTime();
  });

  const todaySales = todayOrders
    .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = shopOwnerOrders.filter((o) => o.orderStatus === 'PENDING').length;
  const preparingCount = shopOwnerOrders.filter((o) => o.orderStatus === 'PREPARING' || o.orderStatus === 'SHOP_ACCEPTED').length;
  const completedCount = shopOwnerOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledCount = shopOwnerOrders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED').length;

  const newOrders = shopOwnerOrders.filter((o) => o.orderStatus === 'PENDING');

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Shop Status Banner */}
      <div
        className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
          isOpen
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
              isOpen ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold">
                {isOpen ? 'Your Shop is Active & Accepting Orders' : 'Shop is Currently Closed'}
              </h2>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {isOpen
                ? 'Nearby customers within 12 km can discover and order from your store.'
                : 'Customers cannot place new orders until you open the shop.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setManualShopOverride(shopOwnerShop.id, isOpen ? 'CLOSED' : 'OPEN')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
            isOpen
              ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
          }`}
        >
          {isOpen ? 'Turn Off Store' : 'Open Store Now'}
        </button>
      </div>

      {/* 2. TODAY'S SALES & ORDERS METRICS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Today's Business Summary
          </h2>
          <span className="text-[11px] text-stone-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Today's Sales */}
          <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Today's Sales
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              ₹{todaySales.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time settled</span>
            </span>
          </div>

          {/* Today's Orders */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Today's Orders
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {todayOrders.length}
            </div>
            <span className="text-[10px] text-stone-500 mt-1">Received today</span>
          </div>

          {/* Pending Orders */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Pending
            </span>
            <div className="text-2xl font-black text-amber-800 mt-1">
              {pendingCount}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold mt-1">Needs acceptance</span>
          </div>

          {/* Completed Orders */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {completedCount}
            </div>
            <span className="text-[10px] text-stone-500 mt-1">Delivered</span>
          </div>

          {/* Cancelled / Rejected */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Cancelled
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {cancelledCount}
            </div>
            <span className="text-[10px] text-stone-500 mt-1">Rejected/Cancelled</span>
          </div>
        </div>
      </div>

      {/* 3. NEW ORDERS ALERT SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>New Orders ({newOrders.length})</span>
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {newOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-700">No new pending orders right now.</p>
            <p>Customer orders from within 12 km will pop up here in real-time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {newOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-amber-400 p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-stone-900">
                        Order #{order.orderId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {order.paymentMethod === 'ONLINE' ? '🟢 ONLINE PAID' : '🟠 COD'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Customer: <strong className="text-stone-800">{order.customerName}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700">
                      ₹{order.totalAmount}
                    </span>
                    <p className="text-[11px] text-stone-400">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Delivery address snippet */}
                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{order.deliveryAddress}</span>
                </div>

                {/* Direct Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'SHOP_ACCEPTED')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACCEPT</span>
                  </button>

                  <button
                    onClick={() => onViewOrderDetails(order.id)}
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'REJECTED', 'Store busy')}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. QUICK ACTIONS GRID */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          Quick Merchant Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* + Add Product */}
          <button
            onClick={onOpenAddProduct}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">+ Add Product</p>
              <p className="text-[11px] text-stone-500 mt-0.5">List new grocery item</p>
            </div>
          </button>

          {/* Manage Products */}
          <button
            onClick={() => onNavigateTab('products')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Manage Products</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Prices, stock, & photos</p>
            </div>
          </button>

          {/* Orders */}
          <button
            onClick={() => onNavigateTab('orders')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Fulfill Orders</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Accept, pack & deliver</p>
            </div>
          </button>

          {/* CRM / Customers */}
          <button
            onClick={() => onNavigateTab('crm')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Customers (CRM)</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Retention & profiles</p>
            </div>
          </button>

          {/* Payments & Payouts */}
          <button
            onClick={() => onNavigateTab('payments')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Payments & Payouts</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Bank settlements & COD</p>
            </div>
          </button>

          {/* Analytics */}
          <button
            onClick={() => onNavigateTab('analytics')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Sales Analytics</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Top products & trends</p>
            </div>
          </button>

          {/* Shop Settings */}
          <button
            onClick={() => onNavigateTab('settings')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 group-hover:bg-stone-800 group-hover:text-white transition-colors">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Hours & Settings</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Business timings & radius</p>
            </div>
          </button>

          {/* Inventory */}
          <button
            onClick={() => onNavigateTab('inventory')}
            className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Stock & Inventory</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Low stock warnings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
