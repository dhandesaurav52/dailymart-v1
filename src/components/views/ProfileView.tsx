import React from 'react';
import { useApp } from '../../context/AppContext';
import { BecomeSellerModal } from './BecomeSellerModal';
import {
  User,
  MapPin,
  Store,
  Phone,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    userLocation,
    setIsLocationModalOpen,
    canAccessSellerDashboard,
    isAuthorizedDelivery,
    isVerifiedAdmin,
    switchWorkspace,
    detailedUserRole,
    authorizedWorkspaces,
    isBecomeSellerModalOpen,
    setIsBecomeSellerModalOpen,
  } = useApp();

  const displayName = currentUser?.name || 'Customer';
  const displayContact = currentUser?.phone || currentUser?.email || 'Guest Visitor';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border-2 border-emerald-200 shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-stone-900 truncate">{displayName}</h2>
            <p className="text-xs text-stone-500 truncate">{displayContact}</p>
            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {detailedUserRole}
            </span>
          </div>
        </div>

        {!isAuthenticated && (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Multi-role Workspace Switcher (Only visible when user has multiple authorized roles) */}
      {authorizedWorkspaces.length > 1 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Available Workspaces
          </h3>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {canAccessSellerDashboard && (
              <button
                onClick={() => switchWorkspace('shop_owner')}
                className="w-full text-left p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Merchant Portal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500" />
              </button>
            )}

            {isAuthorizedDelivery && (
              <button
                onClick={() => switchWorkspace('delivery_staff')}
                className="w-full text-left p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Delivery Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </button>
            )}

            {isVerifiedAdmin && (
              <button
                onClick={() => switchWorkspace('admin')}
                className="w-full text-left p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-900 font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Admin Control Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seller onboarding / authorized portal switcher */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-100" />
          <h3 className="font-extrabold text-sm tracking-tight">Sell on DailyMart</h3>
        </div>
        <p className="text-xs text-amber-100 leading-relaxed">
          {canAccessSellerDashboard
            ? 'Your approved shop is active. Manage inventory, pricing, and live orders.'
            : 'Apply to list your local storefront. Submissions undergo verification by DailyMart compliance.'}
        </p>
        <button
          onClick={() => (canAccessSellerDashboard ? switchWorkspace('shop_owner') : setIsBecomeSellerModalOpen(true))}
          className="w-full py-2.5 px-4 bg-white text-amber-900 rounded-xl font-bold text-xs hover:bg-amber-50 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{canAccessSellerDashboard ? 'Open Merchant Dashboard' : 'Become a Seller'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <BecomeSellerModal isOpen={isBecomeSellerModalOpen} onClose={() => setIsBecomeSellerModalOpen(false)} onApplicationSubmitted={() => setIsBecomeSellerModalOpen(false)} />

      {/* Saved Delivery Addresses */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Delivery Address
        </h3>

        <div className="p-3 bg-stone-50 rounded-xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-stone-900">{userLocation.area}</p>
              <p className="text-xs text-stone-500 mt-0.5">{userLocation.address}, {userLocation.city}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="text-xs font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      {/* App Info & Policies */}
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-xs overflow-hidden">
        <div className="p-3.5 flex items-center justify-between text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-stone-400" />
            <span>12 km Hyper-Local Policy</span>
          </div>
          <span className="text-[11px] text-stone-400">Active</span>
        </div>

        <div className="p-3.5 flex items-center justify-between text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-stone-400" />
            <span>Help & Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </div>

        <div className="p-3.5 flex items-center justify-between text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-stone-400" />
            <span>Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </div>
      </div>

      <div className="text-center text-[11px] text-stone-400 pt-2">
        DailyMart v2.4 · Hyper-Local Grocery Marketplace
      </div>
    </div>
  );
};
