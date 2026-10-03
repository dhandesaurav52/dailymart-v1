import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  CreditCard,
  Banknote,
  Users,
  Package,
  Award,
} from 'lucide-react';
import { Order } from '../../../types';

export const MerchantAnalyticsView: React.FC = () => {
  const { shopOwnerOrders, shopOwnerShop } = useApp();

  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date().getTime();
    return shopOwnerOrders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      if (timeRange === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return orderTime >= todayStart.getTime();
      }
      if (timeRange === '7days') {
        return now - orderTime <= 7 * 24 * 3600 * 1000;
      }
      if (timeRange === '30days') {
        return now - orderTime <= 30 * 24 * 3600 * 1000;
      }
      return true;
    });
  }, [shopOwnerOrders, timeRange]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;
  const completedOrders = filteredOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = filteredOrders.filter(
    (o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED'
  ).length;

  const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / Math.max(1, totalOrdersCount - cancelledOrders)) : 0;

  const onlineOrders = filteredOrders.filter((o) => o.paymentMethod === 'ONLINE');
  const codOrders = filteredOrders.filter((o) => o.paymentMethod === 'COD');

  const onlineRevenue = onlineOrders
    .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const codRevenue = codOrders
    .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const productStats: Record<string, { name: string; quantity: number; revenue: number; unit: string }> = {};

    filteredOrders
      .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED')
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
              unit: item.unit,
            };
          }
          productStats[item.productId].quantity += item.quantity;
          productStats[item.productId].revenue += item.subtotal;
        });
      });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Daily Trend Data for Chart (last 7 days)
  const dailyTrends = useMemo(() => {
    const days: { label: string; dateKey: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({ label, dateKey, revenue: 0, orders: 0 });
    }

    filteredOrders.forEach((o) => {
      const oDateKey = o.createdAt.split('T')[0];
      const found = days.find((d) => d.dateKey === oDateKey);
      if (found) {
        found.orders += 1;
        if (o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED') {
          found.revenue += o.totalAmount;
        }
      }
    });

    const maxRev = Math.max(...days.map((d) => d.revenue), 100);
    return { days, maxRev };
  }, [filteredOrders]);

  return (
    <div className="space-y-5 pb-24">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            Sales & Order Analytics
          </h2>
          <p className="text-xs text-stone-500">
            Real performance calculated from live store transactions
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto border border-stone-200">
          {(['today', '7days', '30days', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                timeRange === r
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Net Revenue
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Selected window</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Total Orders
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {totalOrdersCount}
          </div>
          <span className="text-[10px] text-stone-500 mt-1 block">
            {completedOrders} delivered · {cancelledOrders} cancelled
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Avg Order Value
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            ₹{aov}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Per successful cart</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Fulfillment Rate
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {totalOrdersCount > 0
              ? `${Math.round((completedOrders / totalOrdersCount) * 100)}%`
              : '100%'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Successful dispatch</span>
        </div>
      </div>

      {/* SVG Trend Bar Chart (Clean, responsive, anti-slop) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Daily Revenue Trend (Past 7 Days)</span>
          </h3>
          <span className="text-[11px] text-stone-500">Live order values</span>
        </div>

        <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-stone-100">
          {dailyTrends.days.map((d) => {
            const heightPercent = Math.max(8, Math.round((d.revenue / dailyTrends.maxRev) * 100));

            return (
              <div key={d.dateKey} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-bold text-stone-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{d.revenue}
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[40px] bg-emerald-600 rounded-t-lg group-hover:bg-emerald-500 transition-all shadow-xs"
                />
                <span className="text-[10px] font-bold text-stone-500 mt-2 block">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Split & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Payment Method Distribution
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Online Payments</p>
                  <p className="text-[11px] text-stone-500">{onlineOrders.length} orders settled</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-700">₹{onlineRevenue}</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-stone-500">{codOrders.length} orders</p>
                </div>
              </div>
              <span className="text-sm font-black text-amber-700">₹{codRevenue}</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Selling Products</span>
            </h3>
            <span className="text-[11px] text-stone-400">By quantity</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              No product sales recorded in this period.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-extrabold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-stone-900">{p.name}</p>
                      <p className="text-[11px] text-stone-400">{p.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="font-black text-stone-900">₹{p.revenue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
