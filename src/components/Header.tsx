import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Search,
  ShoppingBag,
  Store,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  Bike,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    userLocation,
    setIsLocationModalOpen,
    cartItemCount,
    setCurrentTab,
    currentTab,
    userRole,
    setUserRole,
    setActiveShopId,
    setActiveOrderId,
    setIsCheckingOut,
    isAuthenticated,
    setIsAuthModalOpen,
    currentUser,
    logout,
    canAccessSellerDashboard,
    isVerifiedAdmin,
    isAuthorizedDelivery,
    switchWorkspace,
    detailedUserRole,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogoClick = () => {
    setActiveShopId(null);
    setActiveOrderId(null);
    setIsCheckingOut(false);
    setCurrentTab('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand & Delivery Location */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 focus:outline-none group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-emerald-200">
              D
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-stone-900 text-lg tracking-tight">Daily</span>
              <span className="font-extrabold text-emerald-600 text-lg tracking-tight">Mart</span>
            </div>
          </button>

          {/* Location Selector */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-start gap-1 text-left min-w-0 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            title="Change Delivery Location"
          >
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  Deliver to
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[130px] sm:max-w-[200px]">
                {userLocation.area || userLocation.address}
              </p>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={() => {
              setActiveShopId(null);
              setIsCheckingOut(false);
              setCurrentTab('home');
              const searchInput = document.getElementById('marketplace-search-input');
              if (searchInput) searchInput.focus();
            }}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => {
              setActiveShopId(null);
              setIsCheckingOut(false);
              setCurrentTab('cart');
            }}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'cart'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>

          {/* Login / User Status */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer text-xs font-bold text-stone-800"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 space-y-1 z-50 text-xs">
                  <div className="p-2 border-b border-stone-100">
                    <p className="font-bold text-stone-900 truncate">
                      {currentUser?.name || 'Customer'}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {currentUser?.email || 'Logged in'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      {detailedUserRole}
                    </span>
                  </div>

                  {canAccessSellerDashboard && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchWorkspace('shop_owner');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-amber-50 text-stone-700 font-bold flex items-center gap-2 cursor-pointer text-amber-800"
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Merchant Dashboard</span>
                    </button>
                  )}

                  {isAuthorizedDelivery && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchWorkspace('delivery_staff');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-blue-50 text-stone-700 font-bold flex items-center gap-2 cursor-pointer text-blue-800"
                    >
                      <Bike className="w-4 h-4 text-blue-600" />
                      <span>Delivery Dashboard</span>
                    </button>
                  )}

                  {isVerifiedAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchWorkspace('admin');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-purple-50 text-stone-700 font-bold flex items-center gap-2 cursor-pointer text-purple-800"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Admin Control Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setCurrentTab('profile');
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-stone-50 text-stone-700 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-rose-50 text-rose-700 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
