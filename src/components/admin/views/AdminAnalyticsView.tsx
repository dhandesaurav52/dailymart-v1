import React, { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Percent,
  ShoppingBag,
  Users,
  Store,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const AdminAnalyticsView: React.FC = () => {
  const { allOrders, shops, products, platformSettings } = useApp();

  const analytics = useMemo(() => {
    const validOrders = allOrders.filter(
      (o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED'
    );
    const totalGmv = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPlatformFee = Math.round(
      (totalGmv * (platformSettings.defaultCommissionRate || 5)) / 100
    );
    const aov = validOrders.length > 0 ? Math.round(totalGmv / validOrders.length) : 0;

    // Delivery success rate
    const deliveredCount = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const cancelledCount = allOrders.filter(
      (o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED'
    ).length;
    const successRate =
      allOrders.length > 0 ? Math.round((deliveredCount / allOrders.length) * 100) : 100;

    // Category breakdown
    const categoryVolumeMap: Record<string, number> = {};
    validOrders.forEach((o) => {
      o.items?.forEach((item) => {
        // Try to find product category
        const prod = products.find((p) => p.name === item.name);
        const cat = prod?.category || 'Grocery';
        categoryVolumeMap[cat] = (categoryVolumeMap[cat] || 0) + (item.subtotal || item.price * item.quantity);
      });
    });

    const categoryBreakdown = Object.entries(categoryVolumeMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalGmv,
      totalPlatformFee,
      aov,
      totalOrders: allOrders.length,
      deliveredCount,
      cancelledCount,
      successRate,
      categoryBreakdown,
    };
  }, [allOrders, products, platformSettings.defaultCommissionRate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          Marketplace Platform Analytics
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Macro metrics, operational fulfillment rates, and demand breakdown
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            All-Time GMV
          </p>
          <div className="text-2xl font-black text-stone-900 mt-1">
            ₹{analytics.totalGmv.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">
            Gross merchandise value
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Platform Take
          </p>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{analytics.totalPlatformFee.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-stone-400">
            5% marketplace cut
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Average Order Value
          </p>
          <div className="text-2xl font-black text-stone-900 mt-1">
            ₹{analytics.aov}
          </div>
          <span className="text-[11px] text-stone-400">
            Per fulfilled basket
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Fulfillment Rate
          </p>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {analytics.successRate}%
          </div>
          <span className="text-[11px] text-stone-400">
            {analytics.deliveredCount} delivered / {analytics.totalOrders} total
          </span>
        </div>
      </div>

      {/* Charts and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Demand Share */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
            Category GMV Contribution
          </h2>
          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No product purchase data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.categoryBreakdown.map((cat) => {
                const pct =
                  analytics.totalGmv > 0
                    ? Math.round((cat.amount / analytics.totalGmv) * 100)
                    : 0;

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-stone-700">{cat.name}</span>
                      <span className="text-stone-900">
                        ₹{cat.amount.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Health */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
            Order Fulfillment Pipeline
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800">
                Delivered Successfully
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {analytics.deliveredCount}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xs font-bold text-rose-800">
                Cancelled / Rejected
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {analytics.cancelledCount}
              </p>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 space-y-1">
            <p className="font-bold text-stone-800">12 km Radius Benchmark:</p>
            <p>
              Target average delivery time: 25–35 minutes across local neighborhood clusters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
