import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Briefcase,
  Search,
  Building2,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Store,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { MerchantAccount } from '../../../types';

export const AdminMerchantsView: React.FC = () => {
  const {
    shops,
    allOrders,
    merchantAccountsList,
    updateMerchantAccount,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantAccount | null>(null);

  // Group stats by shop/merchant
  const merchantStats = useMemo(() => {
    return shops.map((shop) => {
      const orders = allOrders.filter(
        (o) =>
          o.shopId === shop.id &&
          o.orderStatus !== 'CANCELLED' &&
          o.orderStatus !== 'REJECTED'
      );
      const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalOrdersCount = orders.length;

      // Find matching merchant account record if created
      const account = merchantAccountsList.find((m) => m.shopId === shop.id) || {
        shopId: shop.id,
        businessName: shop.name,
        ownerName: 'Store Partner',
        phone: shop.phone,
        email: `${shop.id}@merchant.dailymart.in`,
        businessAddress: `${shop.address}, ${shop.city}`,
        bankAccountHolder: shop.name,
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0001234',
        accountNumberMasked: '****' + shop.id.slice(-4),
        status: shop.verificationStatus === 'SUSPENDED' ? 'SUSPENDED' : 'VERIFIED',
        payoutStatus: 'ACTIVE',
        platformCommissionRate: 5,
      };

      return {
        shop,
        account,
        totalSales,
        totalOrdersCount,
      };
    });
  }, [shops, allOrders, merchantAccountsList]);

  const filtered = useMemo(() => {
    return merchantStats.filter(({ shop, account }) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        shop.name.toLowerCase().includes(q) ||
        account.phone.includes(q) ||
        account.bankName.toLowerCase().includes(q)
      );
    });
  }, [merchantStats, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Merchant Partners & Bank Accounts
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Overview of seller profiles, settlement accounts, and volume
          </p>
        </div>

        <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
          Total: {shops.length} Registered Merchants
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by store name, phone, bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Merchant & Store</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Bank & Settlement</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Payout Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map(({ shop, account, totalSales, totalOrdersCount }) => (
                <tr
                  key={shop.id}
                  className="hover:bg-stone-50/70 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-stone-900">
                      {shop.name}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {account.ownerName || 'Proprietor'} · {shop.category}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-stone-600">
                    <div>{shop.phone}</div>
                    <div className="text-[10px] text-stone-400 truncate max-w-[140px]">
                      {shop.address}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-800">
                      {account.bankName}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {account.accountNumberMasked} · {account.ifsc}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-stone-800">
                    {totalOrdersCount}
                  </td>

                  <td className="py-3.5 px-4 font-black text-stone-900">
                    ₹{totalSales.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        account.payoutStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {account.payoutStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedMerchant(account as MerchantAccount)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Details Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  🏢
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    {selectedMerchant.businessName}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Merchant Account Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold uppercase text-stone-400">
                  Bank Settlement Profile
                </p>
                <p className="font-bold text-stone-900">
                  Beneficiary: {selectedMerchant.bankAccountHolder}
                </p>
                <p className="text-stone-600">Bank: {selectedMerchant.bankName}</p>
                <p className="text-stone-600 font-mono">
                  Account: {selectedMerchant.accountNumberMasked}
                </p>
                <p className="text-stone-600 font-mono">
                  IFSC: {selectedMerchant.ifsc}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold uppercase text-stone-400">
                  Commission Agreement
                </p>
                <p className="text-stone-700 font-bold">
                  Standard Marketplace Fee: 5% of order subtotal
                </p>
                <p className="text-[11px] text-stone-500">
                  Settlements processed weekly via direct NEFT/IMPS.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMerchant(null)}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
