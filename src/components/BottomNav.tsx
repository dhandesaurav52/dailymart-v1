import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Store, PackageCheck, ShoppingBag, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    cartItemCount,
    customerOrders,
    setActiveShopId,
    setActiveOrderId,
    setIsCheckingOut,
    userRole,
  } = useApp();

  // Hide bottom nav if in merchant portal
  if (userRole === 'shop_owner') {
    return null;
  }

  const handleTabClick = (tab: 'home' | 'shops' | 'orders' | 'cart' | 'profile') => {
    setActiveShopId(null);
    setActiveOrderId(null);
    setIsCheckingOut(false);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if any order is active (not DELIVERED or CANCELLED)
  const hasActiveOrders = customerOrders.some(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED'
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe">
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-between">
        {/* 1. Home */}
        <button
          onClick={() => handleTabClick('home')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'home' ? 'text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Shops */}
        <button
          onClick={() => handleTabClick('shops')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'shops' ? 'text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Store className={`w-5 h-5 ${currentTab === 'shops' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Shops</span>
        </button>

        {/* 3. Orders */}
        <button
          onClick={() => handleTabClick('orders')}
          className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'orders' ? 'text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <PackageCheck className={`w-5 h-5 ${currentTab === 'orders' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Orders</span>
          {hasActiveOrders && (
            <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* 4. Cart */}
        <button
          onClick={() => handleTabClick('cart')}
          className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'cart' ? 'text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${currentTab === 'cart' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Cart</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
};
