import React from 'react';
import { LayoutDashboard, PackageCheck, ShoppingBag, Users, MoreHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type MerchantTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'crm'
  | 'deliveryStaff'
  | 'more'
  | 'inventory'
  | 'analytics'
  | 'payments'
  | 'settings'
  | 'notifications';

interface MerchantBottomNavProps {
  currentTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
  onOpenMoreMenu: () => void;
}

export const MerchantBottomNav: React.FC<MerchantBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMoreMenu,
}) => {
  const { shopOwnerOrders } = useApp();

  const pendingOrdersCount = shopOwnerOrders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'ORDER_PLACED').length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900 text-stone-300 border-t border-stone-800 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-between">
        {/* 1. Home / Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Orders */}
        <button
          onClick={() => onSelectTab('orders')}
          className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'orders' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <PackageCheck className="w-5 h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border-2 border-stone-900 animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
        </button>

        {/* 3. Products */}
        <button
          onClick={() => onSelectTab('products')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'products' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Products</span>
        </button>

        {/* 4. CRM */}
        <button
          onClick={() => onSelectTab('crm')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'crm' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">CRM</span>
        </button>

        {/* 5. More */}
        <button
          onClick={onOpenMoreMenu}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'more' ||
            currentTab === 'deliveryStaff' ||
            currentTab === 'inventory' ||
            currentTab === 'analytics' ||
            currentTab === 'payments' ||
            currentTab === 'settings'
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
