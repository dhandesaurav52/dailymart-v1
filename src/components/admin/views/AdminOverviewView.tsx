import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { AdminTab } from '../AdminSidebar';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Percent,
  Calendar,
  Layers,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { formatDistance } from '../../../lib/geo';

interface AdminOverviewViewProps {
  onNavigateTab: (tab: AdminTab) => void;
  onInspectOrder?: (orderId: string) => void;
}

type TimeFilter = 'today' | '7d' | '30d' | 'month' | 'year' | 'all';

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  onNavigateTab,
  onInspectOrder,
}) => {
  const {
    shops,
    allOrders,
    allPayments,
    disputes,
    usersList,
    platformSettings,
  } = useApp();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  // Filter orders according to selected time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    return allOrders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      if (isNaN(orderTime)) return true;

      switch (timeFilter) {
        case 'today':
          return orderTime >= startOfToday;
        case '7d':
          return now.getTime() - orderTime <= 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return now.getTime() - orderTime <= 30 * 24 * 60 * 60 * 1000;
        case 'month':
          return (
            new Date(orderTime).getMonth() === now.getMonth() &&
            new Date(orderTime).getFullYear() === now.getFullYear()
          );
        case 'year':
          return new Date(orderTime).getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
  }, [allOrders, timeFilter]);

  // Real KPI calculations from Firestore
  const kpis = useMemo(() => {
    const nonCancelledOrders = filteredOrders.filter(
      (o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED'
    );

    const gmv = nonCancelledOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    // Platform revenue calculation based on payments or default commission
    const commissionRate = platformSettings.defaultCommissionRate || 5;
    const platformRev = nonCancelledOrders.reduce((sum, o) => {
      // Find matching payment record if available
      const pay = allPayments.find(
        (p) => p.orderId === o.orderId || p.orderId === o.id
      );
      if (pay && pay.platformFee !== undefined) {
        return sum + pay.platformFee;
      }
      return sum + Math.round((o.totalAmount * commissionRate) / 100);
    }, 0);

    const merchantRev = gmv - platformRev;
    const totalOrdersCount = filteredOrders.length;
    const completedOrdersCount = filteredOrders.filter(
      (o) => o.orderStatus === 'DELIVERED'
    ).length;
    const pendingOrdersCount = filteredOrders.filter(
      (o) => o.orderStatus === 'PENDING'
    ).length;

    const aov =
      nonCancelledOrders.length > 0
        ? Math.round(gmv / nonCancelledOrders.length)
        : 0;

    // Customer counts
    const activeCustomerIds = new Set(filteredOrders.map((o) => o.customerId));
    const activeCustomersCount = Math.max(
      activeCustomerIds.size,
      usersList.filter((u) => u.role === 'customer').length
    );

    // Active shops count
    const activeShopsCount = shops.filter(
      (s) => s.verificationStatus === 'VERIFIED' && s.isActive !== false
    ).length;
    const pendingMerchantApprovals = shops.filter(
      (s) => s.verificationStatus === 'PENDING'
    ).length;

    // Payment method breakdown
    const codCount = filteredOrders.filter(
      (o) => o.paymentMethod === 'COD'
    ).length;
    const onlineCount = filteredOrders.filter(
      (o) => o.paymentMethod === 'ONLINE'
    ).length;

    return {
      gmv,
      platformRev,
      merchantRev,
      totalOrdersCount,
      completedOrdersCount,
      pendingOrdersCount,
      aov,
      activeCustomersCount,
      activeShopsCount,
      pendingMerchantApprovals,
      codCount,
      onlineCount,
    };
  }, [
    filteredOrders,
    shops,
    allPayments,
    usersList,
    platformSettings.defaultCommissionRate,
  ]);

  // Urgent attention items
  const openDisputesCount = disputes.filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;
  const pendingPayoutsCount = allPayments.filter(
    (p) => p.payoutStatus === 'PENDING' || p.payoutStatus === 'PROCESSING'
  ).length;

  // Top shops ranked by GMV
  const topShops = useMemo(() => {
    const shopSalesMap: Record<
      string,
      { shopName: string; orders: number; revenue: number }
    > = {};

    filteredOrders.forEach((o) => {
      if (o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED') return;
      if (!shopSalesMap[o.shopId]) {
        shopSalesMap[o.shopId] = {
          shopName: o.shopName || 'Shop',
          orders: 0,
          revenue: 0,
        };
      }
      shopSalesMap[o.shopId].orders += 1;
      shopSalesMap[o.shopId].revenue += o.totalAmount || 0;
    });

    return Object.entries(shopSalesMap)
      .map(([shopId, data]) => ({ shopId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Marketplace Command Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time aggregate activity across local stores within 12 km
          </p>
        </div>

        {/* Time Filters */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ] as { id: TimeFilter; label: string }[]
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                timeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action / Alert Banners if any urgent item exists */}
      <div className="space-y-2">
        {kpis.pendingMerchantApprovals > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-amber-950">
                  {kpis.pendingMerchantApprovals} Merchant Onboarding Application
                  {kpis.pendingMerchantApprovals > 1 ? 's' : ''} Pending
                </p>
                <p className="text-[11px] text-amber-800">
                  Review shop details, location, and KYC documents to grant
                  marketplace access.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('shops')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>Review Shops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {openDisputesCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-rose-950">
                  {openDisputesCount} Active Order Dispute
                  {openDisputesCount > 1 ? 's' : ''} Requires Attention
                </p>
                <p className="text-[11px] text-rose-800">
                  Customer reported issues with delivery or items. Review and
                  resolve.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('disputes')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>View Disputes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Primary KPI Metric Cards (Calculated directly from Firestore) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total GMV Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total GMV
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            ₹{kpis.gmv.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Gross merchandise value ({timeFilter})
          </p>
        </div>

        {/* Platform Revenue Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Platform Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">
            ₹{kpis.platformRev.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Avg {platformSettings.defaultCommissionRate}% commission
          </p>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            {kpis.totalOrdersCount}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-emerald-600 font-bold">
              {kpis.completedOrdersCount} Delivered
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-amber-600 font-bold">
              {kpis.pendingOrdersCount} Pending
            </span>
          </div>
        </div>

        {/* Active Stores Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Active Shops
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            {kpis.activeShopsCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Serving 12 km radius delivery
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-3">
          <p className="text-[11px] font-bold text-stone-500">Merchant Net Payout</p>
          <p className="text-base sm:text-lg font-black text-stone-800 mt-0.5">
            ₹{kpis.merchantRev.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-stone-400">Total payable</span>
        </div>

        <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-3">
          <p className="text-[11px] font-bold text-stone-500">Average Order Value</p>
          <p className="text-base sm:text-lg font-black text-stone-800 mt-0.5">
            ₹{kpis.aov}
          </p>
          <span className="text-[10px] text-stone-400">Per cart checkout</span>
        </div>

        <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-3">
          <p className="text-[11px] font-bold text-stone-500">Active Customers</p>
          <p className="text-base sm:text-lg font-black text-stone-800 mt-0.5">
            {kpis.activeCustomersCount}
          </p>
          <span className="text-[10px] text-stone-400">Placed orders</span>
        </div>

        <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-3">
          <p className="text-[11px] font-bold text-stone-500">Pending Approvals</p>
          <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
            {kpis.pendingMerchantApprovals}
          </p>
          <span className="text-[10px] text-stone-400">New shops</span>
        </div>
      </div>

      {/* Grid: Live Orders Feed & Top Performing Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Orders Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                Recent Marketplace Orders
              </h2>
              <p className="text-xs text-stone-400">
                Live stream of local deliveries
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-500">
                No orders found for this time period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredOrders.slice(0, 6).map((order) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'DELIVERED':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'OUT_FOR_DELIVERY':
                    case 'PREPARING':
                    case 'SHOP_ACCEPTED':
                      return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'PENDING':
                      return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'CANCELLED':
                    case 'REJECTED':
                      return 'bg-rose-50 text-rose-700 border-rose-200';
                    default:
                      return 'bg-stone-50 text-stone-700 border-stone-200';
                  }
                };

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (onInspectOrder) onInspectOrder(order.id);
                      else onNavigateTab('orders');
                    }}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700 shrink-0">
                        📦
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">
                            #{order.orderId || order.id.slice(0, 6)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                              order.orderStatus
                            )}`}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 truncate mt-0.5">
                          {order.shopName} · {order.customerName}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {order.items?.length || 0} items · {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-stone-900">
                        ₹{order.totalAmount}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Top Shops Leaderboard & Payment Split */}
        <div className="space-y-6">
          {/* Top Stores Leaderboard */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                Top Shops by GMV
              </h2>
              <button
                onClick={() => onNavigateTab('shops')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                All Shops
              </button>
            </div>

            {topShops.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">
                No store sales recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topShops.map((shop, idx) => (
                  <div
                    key={shop.shopId}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {shop.shopName}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {shop.orders} orders
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-stone-900 shrink-0">
                      ₹{shop.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-extrabold text-stone-900">
              Payment Method Mix
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-600">Cash on Delivery (COD)</span>
                <span className="text-stone-900">
                  {kpis.codCount} ({kpis.totalOrdersCount > 0 ? Math.round((kpis.codCount / kpis.totalOrdersCount) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      kpis.totalOrdersCount > 0
                        ? (kpis.codCount / kpis.totalOrdersCount) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className="text-stone-600">Online UPI / Card</span>
                <span className="text-stone-900">
                  {kpis.onlineCount} ({kpis.totalOrdersCount > 0 ? Math.round((kpis.onlineCount / kpis.totalOrdersCount) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      kpis.totalOrdersCount > 0
                        ? (kpis.onlineCount / kpis.totalOrdersCount) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
