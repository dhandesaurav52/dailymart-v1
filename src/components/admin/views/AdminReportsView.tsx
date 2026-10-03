import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const { allOrders, allPayments, shops, usersList } = useApp();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportOrders = () => {
    const headers = [
      'Order ID',
      'Date',
      'Shop Name',
      'Customer Name',
      'Phone',
      'Items Count',
      'Subtotal',
      'Delivery Fee',
      'Total Amount',
      'Payment Method',
      'Order Status',
    ];

    const rows = allOrders.map((o) => [
      `"${o.orderId || o.id}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.shopName}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      o.items?.length || 0,
      o.subtotal,
      o.deliveryFee,
      o.totalAmount,
      o.paymentMethod,
      o.orderStatus,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`DailyMart_Orders_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportPayouts = () => {
    const headers = [
      'Transaction ID',
      'Order ID',
      'Date',
      'Shop ID',
      'Total Amount',
      'Platform Fee (5%)',
      'Merchant Payable',
      'Payout Status',
    ];

    const rows = allPayments.map((p) => [
      `"${p.id}"`,
      `"${p.orderId}"`,
      `"${new Date(p.createdAt).toLocaleString()}"`,
      `"${p.shopId}"`,
      p.amount,
      p.platformFee,
      p.merchantAmount,
      p.payoutStatus,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`DailyMart_Payouts_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportShops = () => {
    const headers = [
      'Shop ID',
      'Name',
      'Category',
      'Phone',
      'Address',
      'City',
      'Delivery Radius Km',
      'Rating',
      'Status',
      'Open Status',
    ];

    const rows = shops.map((s) => [
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.category}"`,
      `"${s.phone}"`,
      `"${s.address}"`,
      `"${s.city}"`,
      s.deliveryRadius || 12,
      s.rating,
      s.verificationStatus || 'VERIFIED',
      s.isOpen ? 'OPEN' : 'CLOSED',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`DailyMart_Shops_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          Financial & Marketplace Reports
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Generate structured CSV data exports for tax auditing, merchant accounting, and reconciliation
        </p>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Successfully downloaded {downloadSuccess}!</span>
        </div>
      )}

      {/* Reports Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders Report */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              📦
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Complete Orders Register
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Itemized export of all {allOrders.length} customer orders including customer addresses, pricing breakdown, and fulfillment statuses.
            </p>
          </div>

          <button
            onClick={handleExportOrders}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Orders CSV</span>
          </button>
        </div>

        {/* Payouts Report */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              💳
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Settlements & Payout Ledger
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Financial breakdown of merchant gross revenue, 5% platform commission fees, and disbursement timestamps.
            </p>
          </div>

          <button
            onClick={handleExportPayouts}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Payouts CSV</span>
          </button>
        </div>

        {/* Merchant Directory */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              🏪
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Merchant Partner Directory
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Directory of all registered neighborhood grocery shops, delivery radius configurations, and KYC verification records.
            </p>
          </div>

          <button
            onClick={handleExportShops}
            className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Stores CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
