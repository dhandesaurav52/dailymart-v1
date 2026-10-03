import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
  FileText,
  RotateCw,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import { Shop, SellerApplication } from '../../../types';
import { isValidGstin } from '../../../lib/gstin';

export const AdminShopsView: React.FC = () => {
  const {
    shops,
    approveMerchant,
    rejectMerchant,
    suspendShop,
    activateShop,
    updateShopProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'APPLICATIONS' | 'VERIFIED' | 'SUSPENDED'
  >('APPLICATIONS');
  const [searchQuery, setSearchQuery] = useState('');

  // Seller applications list
  const [sellerApps, setSellerApps] = useState<SellerApplication[]>([
    {
      id: 'demo-app-green-garden',
      applicationId: 'DM-REG-2041',
      applicantUid: 'demo_user_applicant',
      applicantUserId: 'demo_user_applicant',
      applicantName: 'Vikrant Deshmukh',
      applicantPhone: '+91 99000 00050',
      applicantEmail: 'vikrant.spices@example.com',
      shopName: 'Green Garden Fresh & Spices',
      category: 'Groceries & Daily Staples',
      address: 'Near Old Cotton Market, Main Road',
      city: 'Chandrapur',
      pincode: '442401',
      deliveryRadius: 12,
      gstin: '27AAACE1234F1Z9',
      pan: 'AAACE1234F',
      documents: [
        'GST Registration Certificate (Form REG-06)',
        'Shop & Establishment License (Gumasta)',
        'FSSAI Food Safety License',
      ],
      status: 'PENDING',
      isDemoData: true,
      environment: 'demo',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ]);

  // Selected shop for action modals
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'SUSPEND' | 'EDIT' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [editRadius, setEditRadius] = useState<number>(12);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered shops
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.category.toLowerCase().includes(q) ||
        (shop.city && shop.city.toLowerCase().includes(q)) ||
        (shop.phone && shop.phone.includes(q)) ||
        (shop.gstin && shop.gstin.toLowerCase().includes(q));

      const status = shop.verificationStatus || 'VERIFIED';
      const matchesTab = activeTab === 'ALL' || status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [shops, searchQuery, activeTab]);

  const pendingApps = sellerApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW');

  const handleOpenAction = (shop: Shop, type: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'EDIT') => {
    setSelectedShop(shop);
    setActionType(type);
    setActionReason('');
    setEditRadius(shop.deliveryRadius || 12);
  };

  const handleApproveApplication = async (app: SellerApplication) => {
    setIsProcessing(true);
    try {
      // 1. Mark application approved
      setSellerApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'APPROVED', reviewNotes: 'Approved by Platform Administrator' } : a))
      );

      // 2. Add approved shop to shops collection via approveMerchant
      await approveMerchant(app.id, 'Statutory verification completed with GSTIN ' + app.gstin);
      setSelectedApplication(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async (app: SellerApplication) => {
    setIsProcessing(true);
    try {
      setSellerApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'REJECTED', reviewNotes: actionReason || 'Verification rejected by administrator.' } : a))
      );
      setSelectedApplication(null);
      setActionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedShop || !actionType) return;
    setIsProcessing(true);

    if (actionType === 'APPROVE') {
      await approveMerchant(selectedShop.id, actionReason || 'Approved by Admin');
    } else if (actionType === 'REJECT') {
      await rejectMerchant(selectedShop.id, actionReason || 'Application rejected');
    } else if (actionType === 'SUSPEND') {
      await suspendShop(selectedShop.id, actionReason || 'Policy violation');
    } else if (actionType === 'EDIT') {
      await updateShopProfile(selectedShop.id, {
        deliveryRadius: editRadius,
      });
    }

    setIsProcessing(false);
    setSelectedShop(null);
    setActionType(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Merchant Stores &amp; Seller Approvals
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Verify mandatory GSTIN statutory filings, approve applications, and enforce 12 km radius limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingApps.length > 0 && (
            <button
              onClick={() => setActiveTab('APPLICATIONS')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black border border-amber-600 shadow-sm cursor-pointer"
            >
              ⚠️ {pendingApps.length} Pending Seller Application{pendingApps.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status Tabs */}
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto max-w-full">
          {(
            [
              { id: 'APPLICATIONS', label: `Seller Applications (${sellerApps.length})` },
              { id: 'ALL', label: `All Stores (${shops.length})` },
              {
                id: 'VERIFIED',
                label: `Active Stores (${
                  shops.filter((s) => s.verificationStatus === 'VERIFIED' || !s.verificationStatus).length
                })`,
              },
              {
                id: 'SUSPENDED',
                label: `Suspended (${
                  shops.filter((s) => s.verificationStatus === 'SUSPENDED').length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores, GSTIN, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
          />
        </div>
      </div>

      {/* VIEW 1: Seller Applications Queue */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>DailyMart Compliance Policy:</strong> Every new merchant must provide a validated Indian GSTIN.
              Approving an application automatically provisions the shop, grants <code>SHOP_OWNER</code> membership to the applicant, and enables their merchant management portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellerApps.map((app) => {
              const gstinCheck = isValidGstin(app.gstin);
              const isPending = app.status === 'PENDING' || app.status === 'UNDER_REVIEW';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400">
                        Application #{app.applicationId}
                      </span>
                      <h3 className="font-extrabold text-base text-stone-900">
                        {app.shopName}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">
                        {app.category} · {app.city}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  {/* GSTIN & Statutory Verification Box */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Mandatory GSTIN:</span>
                      <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {app.gstin}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Extracted PAN:</span>
                      <span className="font-mono font-bold text-stone-800">
                        {app.pan || gstinCheck.pan || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">State Code:</span>
                      <span className="font-bold text-emerald-700">
                        {gstinCheck.stateName || 'Maharashtra (27)'}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <p className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Proprietor: <strong>{app.applicantName}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{app.applicantPhone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{app.address}, {app.city} ({app.pincode})</span>
                    </p>
                  </div>

                  {/* Documents Attached */}
                  {app.documents && app.documents.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
                      <p className="font-bold text-stone-700">Documents Submitted:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {app.documents.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify &amp; Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedApplication(app);
                          setActionType('REJECT');
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Registered Active Shops Grid */}
      {activeTab !== 'APPLICATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShops.map((shop) => {
            const status = shop.verificationStatus || 'VERIFIED';
            const isSuspended = status === 'SUSPENDED';

            return (
              <div
                key={shop.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-11 h-11 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-stone-900 truncate">
                          {shop.name}
                        </h3>
                        <span className="text-[11px] font-bold text-stone-400">
                          {shop.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                        status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{shop.address}, {shop.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{shop.phone}</span>
                    </p>
                    {shop.gstin && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-stone-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>GSTIN: {shop.gstin}</span>
                      </p>
                    )}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100">
                      <span>Delivery Radius: {shop.deliveryRadius || 12} km</span>
                      <span className="font-bold text-stone-700">
                        {shop.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  {isSuspended ? (
                    <button
                      onClick={() => activateShop(shop.id)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Reactivate Store</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenAction(shop, 'EDIT')}
                        className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleOpenAction(shop, 'SUSPEND')}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Suspend
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Verification & Approval Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-xs text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  {actionType === 'REJECT' ? 'Reject Application' : 'Approve Seller & Launch Store'}
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  #{selectedApplication.applicationId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApplication(null);
                  setActionType(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl space-y-2">
              <p><strong>Store Name:</strong> {selectedApplication.shopName}</p>
              <p><strong>Proprietor:</strong> {selectedApplication.applicantName} ({selectedApplication.applicantPhone})</p>
              <p className="font-mono text-emerald-800">
                <strong>GSTIN:</strong> {selectedApplication.gstin} (PAN: {selectedApplication.pan})
              </p>
              <p><strong>Location:</strong> {selectedApplication.address}, {selectedApplication.city}</p>
            </div>

            {actionType === 'REJECT' ? (
              <div className="space-y-2">
                <label className="block text-stone-700 font-bold">
                  Rejection Reason (Mandatory):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Explain why the application cannot be accepted..."
                  rows={3}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Upon approval, this storefront will be activated on DailyMart. The proprietor ({selectedApplication.applicantName}) will automatically receive <code>SHOP_OWNER</code> portal access.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedApplication(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>

              {actionType === 'REJECT' ? (
                <button
                  disabled={isProcessing || !actionReason.trim()}
                  onClick={() => handleRejectApplication(selectedApplication)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              ) : (
                <button
                  disabled={isProcessing}
                  onClick={() => handleApproveApplication(selectedApplication)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isProcessing ? 'Provisioning...' : 'Approve & Create Shop'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
