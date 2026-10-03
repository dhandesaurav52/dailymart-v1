import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  Search,
  Phone,
  Calendar,
  CreditCard,
  ShoppingBag,
  Clock,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { MerchantCustomer, CustomerSegment, Order } from '../../../types';

export const MerchantCrmView: React.FC = () => {
  const { merchantCustomers, shopOwnerOrders, saveCustomerNote } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('All');
  const [activeCustomer, setActiveCustomer] = useState<MerchantCustomer | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  // Retention metrics calculation
  const totalCustomers = merchantCustomers.length;
  const repeatCustomers = merchantCustomers.filter((c) => c.totalOrders >= 2).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const totalShopRevenue = merchantCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = shopOwnerOrders.length > 0 ? Math.round(totalShopRevenue / shopOwnerOrders.length) : 0;
  const avgOrdersPerCustomer = totalCustomers > 0 ? (shopOwnerOrders.length / totalCustomers).toFixed(1) : '0';

  // Filter customers
  const filteredCustomers = merchantCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());

    const matchesSegment = selectedSegment === 'All' || c.segment === selectedSegment;

    return matchesSearch && matchesSegment;
  });

  const openCustomerModal = (c: MerchantCustomer) => {
    setActiveCustomer(c);
    setEditingNote(c.internalNotes || '');
    setIsNoteSaved(false);
  };

  const handleSaveNote = () => {
    if (activeCustomer) {
      saveCustomerNote(activeCustomer.customerId, editingNote);
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000);
    }
  };

  // Get customer's orders at this shop
  const customerOrdersList: Order[] = activeCustomer
    ? shopOwnerOrders.filter(
        (o) => o.customerId === activeCustomer.customerId || o.customerPhone === activeCustomer.phone
      )
    : [];

  const getSegmentBadge = (segment: CustomerSegment) => {
    switch (segment) {
      case 'New':
        return <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">New (1 order)</span>;
      case 'Repeat':
        return <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">Repeat Customer</span>;
      case 'High Value':
        return <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">★ High Value</span>;
      case 'Frequent':
        return <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Frequent Buyer</span>;
      case 'Inactive':
        return <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">Inactive (&gt;30d)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">
          Customer Relationship Management (CRM)
        </h2>
        <p className="text-xs text-stone-500">
          Track customer loyalty, order frequencies, spending history, and private merchant notes
        </p>
      </div>

      {/* Retention Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Total Customers
          </span>
          <div className="text-xl font-black text-stone-900 mt-1">{totalCustomers}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Unique buyers</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Repeat Purchase Rate
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1">{repeatRate}%</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">{repeatCustomers} repeat buyers</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Average Order Value
          </span>
          <div className="text-xl font-black text-stone-900 mt-1">₹{avgOrderValue}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Per transaction</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Orders per Customer
          </span>
          <div className="text-xl font-black text-amber-700 mt-1">{avgOrdersPerCustomer}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Store frequency</span>
        </div>
      </div>

      {/* Search & Segments Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone number..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Segment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', 'New', 'Repeat', 'High Value', 'Frequent', 'Inactive'].map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedSegment === seg
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-1">
          <Users className="w-8 h-8 text-stone-400 mx-auto mb-1" />
          <p className="font-bold text-stone-700">No customer records found</p>
          <p>Customer profiles are compiled dynamically from your incoming store orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCustomers.map((c) => (
            <div
              key={c.customerId}
              onClick={() => openCustomerModal(c)}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">{c.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{c.phone || 'No phone provided'}</p>
                </div>
                {getSegmentBadge(c.segment)}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-center">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Orders</span>
                  <span className="font-black text-stone-900">{c.totalOrders}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Spent</span>
                  <span className="font-black text-emerald-700">₹{c.totalSpent}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Avg Order</span>
                  <span className="font-black text-stone-900">₹{c.averageOrderValue}</span>
                </div>
              </div>

              {/* Last Order & Notes Snippet */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                <span>
                  Last ordered:{' '}
                  <strong className="text-stone-700">
                    {new Date(c.lastOrderDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </strong>
                </span>

                <span className="text-amber-700 font-bold hover:underline">
                  View Profile &amp; Notes →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer CRM Profile Modal */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-stone-900">{activeCustomer.name}</h3>
                  {getSegmentBadge(activeCustomer.segment)}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{activeCustomer.phone}</p>
              </div>
              <button
                onClick={() => setActiveCustomer(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Orders</span>
                <span className="text-sm font-black text-stone-900">{activeCustomer.totalOrders}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Revenue</span>
                <span className="text-sm font-black text-emerald-700">₹{activeCustomer.totalSpent}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Average Order</span>
                <span className="text-sm font-black text-stone-900">₹{activeCustomer.averageOrderValue}</span>
              </div>
            </div>

            {/* Delivery Addresses */}
            {activeCustomer.addresses && activeCustomer.addresses.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivery Locations Used</span>
                </span>
                <div className="space-y-1">
                  {activeCustomer.addresses.map((addr, idx) => (
                    <p key={idx} className="bg-stone-50 p-2 rounded-lg text-stone-600 text-[11px]">
                      {addr}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Private Merchant Internal Notes */}
            <div className="space-y-1.5 text-xs bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Merchant Internal Notes (Private)</span>
                </span>
                {isNoteSaved && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-800">
                Visible only to you. Use for delivery preferences, favorite staples, or customer notes.
              </p>
              <textarea
                rows={2}
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder="e.g. Prefers morning delivery between 9-11 AM, usually orders 5kg rice."
                className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>

            {/* Order History at this store */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                Order History at Your Shop ({customerOrdersList.length})
              </span>

              <div className="divide-y divide-stone-100 border rounded-xl overflow-hidden text-xs">
                {customerOrdersList.map((o) => (
                  <div key={o.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-stone-900">Order #{o.orderId}</span>
                      <p className="text-[11px] text-stone-400">
                        {new Date(o.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        · {o.items.length} items
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-stone-900">₹{o.totalAmount}</span>
                      <span className="block text-[10px] font-bold text-emerald-700">
                        {o.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveCustomer(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
