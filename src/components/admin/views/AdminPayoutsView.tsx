import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  WalletCards,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  ArrowRight,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { PaymentRecord, Shop } from '../../../types';

export const AdminPayoutsView: React.FC = () => {
  const { allPayments, shops, adminProcessPayout } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // Payout modal state
  const [selectedPaymentForPayout, setSelectedPaymentForPayout] = useState<PaymentRecord | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Derive consolidated payout list
  const payouts = useMemo(() => {
    return allPayments.map((pay) => {
      const shop = shops.find((s) => s.id === pay.shopId);
      return {
        ...pay,
        shopName: shop ? shop.name : `Shop ${pay.shopId.slice(0, 6)}`,
        shopBank: 'HDFC Bank',
        maskedAccount: '****' + pay.shopId.slice(-4),
        ifsc: 'HDFC0001234',
      };
    });
  }, [allPayments, shops]);

  const filtered = useMemo(() => {
    return payouts.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.shopName.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q);

      const matchesShop =
        selectedShopId === 'ALL' || item.shopId === selectedShopId;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' &&
          (item.payoutStatus === 'PENDING' || item.payoutStatus === 'PROCESSING')) ||
        (statusFilter === 'PAID' && item.payoutStatus === 'PAID');

      return matchesSearch && matchesShop && matchesStatus;
    });
  }, [payouts, searchQuery, selectedShopId, statusFilter]);

  const pendingTotal = payouts
    .filter((p) => p.payoutStatus === 'PENDING' || p.payoutStatus === 'PROCESSING')
    .reduce((sum, p) => sum + (p.merchantAmount || 0), 0);

  const settledTotal = payouts
    .filter((p) => p.payoutStatus === 'PAID')
    .reduce((sum, p) => sum + (p.merchantAmount || 0), 0);

  const handleOpenPayoutModal = (pay: PaymentRecord) => {
    setSelectedPaymentForPayout(pay);
    setUtrNumber('UTR' + Math.floor(10000000 + Math.random() * 90000000));
  };

  const handleConfirmDisburse = async () => {
    if (!selectedPaymentForPayout) return;
    setIsProcessing(true);
    await adminProcessPayout(selectedPaymentForPayout.id);
    setIsProcessing(false);
    setSelectedPaymentForPayout(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Merchant Settlements & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Disburse earnings to merchant bank accounts after deducting 5% platform commission
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingTotal > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              Pending: ₹{pendingTotal.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Pending Payouts
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            ₹{pendingTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Awaiting bank disbursement
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Settled to Merchants
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{settledTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Disbursed via IMPS/NEFT
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Settlement Cycle
            </span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            T+2 Days
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Direct bank transfer to merchant accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'All Payouts' },
              { id: 'PENDING', label: 'Pending Processing' },
              { id: 'PAID', label: 'Settled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
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
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Stores</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Merchant Store</th>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Gross Sale</th>
                <th className="py-3 px-4">Platform Fee (5%)</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((item) => {
                const isPaid = item.payoutStatus === 'PAID';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-stone-900">
                        {item.shopName}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        ID: {item.shopId.slice(0, 8)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-800">
                        #{item.orderId}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-stone-800 font-mono font-bold">
                        {item.maskedAccount}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {item.shopBank} · {item.ifsc}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-800">
                      ₹{item.amount}
                    </td>

                    <td className="py-3 px-4 text-indigo-700 font-bold">
                      ₹{item.platformFee}
                    </td>

                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      ₹{item.merchantAmount}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isPaid ? 'SETTLED' : 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handleOpenPayoutModal(item)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-400 font-mono">
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Payout Modal */}
      {selectedPaymentForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                Disburse Merchant Payout
              </h3>
              <button
                onClick={() => setSelectedPaymentForPayout(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Beneficiary:</span>
                  <span className="font-bold text-stone-900">
                    Store #{selectedPaymentForPayout.shopId.slice(0, 6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Net Amount:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    ₹{selectedPaymentForPayout.merchantAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Order:</span>
                  <span className="font-mono text-stone-700">
                    #{selectedPaymentForPayout.orderId}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedPaymentForPayout(null)}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisburse}
                disabled={isProcessing || !utrNumber.trim()}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Processing...' : 'Mark as Settled'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
