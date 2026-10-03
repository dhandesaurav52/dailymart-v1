import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  RotateCcw,
} from 'lucide-react';
import { PaymentRecord } from '../../../types';

export const AdminPaymentsView: React.FC = () => {
  const { allPayments, allOrders, shops } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'COD' | 'ONLINE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'COLLECTED' | 'PENDING' | 'REFUNDED'>('ALL');

  // Derive consolidated payments list: uses allPayments, fallback to allOrders
  const payments = useMemo(() => {
    const list: PaymentRecord[] = [...allPayments];

    // If any orders don't have a direct payment record yet, generate synthetic view for real-time completeness
    allOrders.forEach((order) => {
      const exists = list.some((p) => p.orderId === order.orderId || p.orderId === order.id);
      if (!exists) {
        const fee = Math.round((order.totalAmount * 5) / 100);
        list.push({
          id: 'pay-' + order.id,
          orderId: order.orderId || order.id,
          shopId: order.shopId,
          customerId: order.customerId,
          customerName: order.customerName,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus:
            order.orderStatus === 'DELIVERED'
              ? order.paymentMethod === 'COD'
                ? 'COLLECTED'
                : 'PAID'
              : order.orderStatus === 'CANCELLED'
              ? 'FAILED'
              : 'PENDING',
          platformFee: fee,
          merchantAmount: order.totalAmount - fee,
          payoutStatus: order.orderStatus === 'DELIVERED' ? 'PENDING' : 'ON_HOLD',
          createdAt: order.createdAt,
        });
      }
    });

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allPayments, allOrders]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.orderId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchesMethod =
        methodFilter === 'ALL' || p.paymentMethod === methodFilter;

      const matchesStatus =
        statusFilter === 'ALL' || p.paymentStatus === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, searchQuery, methodFilter, statusFilter]);

  // Aggregate stats
  const totalVolume = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCommission = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0);
  const totalMerchantAmount = totalVolume - totalCommission;

  const codTotal = payments
    .filter((p) => p.paymentMethod === 'COD')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const onlineTotal = payments
    .filter((p) => p.paymentMethod === 'ONLINE')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Payments & Transactions Feed
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time ledger of online gateway transactions and Cash on Delivery
          </p>
        </div>

        <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
          Total: {payments.length} Transactions
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Transaction Volume
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            ₹{totalVolume.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            All order settlements
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Platform Commission Cut
            </span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{totalCommission.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Net marketplace platform revenue
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Merchant Net Share
            </span>
            <DollarSign className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            ₹{totalMerchantAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Payable to local merchants
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'All Methods' },
              { id: 'COD', label: `COD (₹${codTotal.toLocaleString('en-IN')})` },
              { id: 'ONLINE', label: `Online (₹${onlineTotal.toLocaleString('en-IN')})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                methodFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid (Online)</option>
            <option value="COLLECTED">Collected (COD)</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order or tx ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Transaction ID & Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Platform Cut (5%)</th>
                <th className="py-3 px-4">Merchant Share</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((tx) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'PAID':
                    case 'COLLECTED':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'REFUNDED':
                      return 'bg-rose-50 text-rose-700 border-rose-200';
                    default:
                      return 'bg-amber-50 text-amber-700 border-amber-200';
                  }
                };

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-900 font-bold">
                        {tx.id}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Order #{tx.orderId} ·{' '}
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-800">
                      {tx.customerName}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${
                          tx.paymentMethod === 'ONLINE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-black text-stone-900">
                      ₹{tx.amount}
                    </td>

                    <td className="py-3 px-4 text-indigo-700 font-bold">
                      ₹{tx.platformFee}
                    </td>

                    <td className="py-3 px-4 text-stone-800 font-bold">
                      ₹{tx.merchantAmount}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusColor(
                          tx.paymentStatus
                        )}`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
