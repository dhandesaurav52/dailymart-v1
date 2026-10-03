import React from 'react';
import {
  LayoutDashboard,
  PackageCheck,
  ShoppingBag,
  Boxes,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Settings,
  ArrowLeft,
  Bike,
} from 'lucide-react';
import { MerchantTab } from './MerchantBottomNav';
import { useApp } from '../../context/AppContext';

interface MerchantSidebarProps {
  currentTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
}

export const MerchantSidebar: React.FC<MerchantSidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { shopOwnerOrders, merchantNotifications, shopOwnerShop, setUserRole } = useApp();

  const pendingOrdersCount = shopOwnerOrders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'ORDER_PLACED').length;
  const unreadNotifsCount = merchantNotifications.filter((n) => !n.isRead).length;

  const navItems = [
    { id: 'dashboard' as MerchantTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as MerchantTab, label: 'Orders', icon: PackageCheck, badge: pendingOrdersCount },
    { id: 'products' as MerchantTab, label: 'Products', icon: ShoppingBag },
    { id: 'inventory' as MerchantTab, label: 'Inventory', icon: Boxes },
    { id: 'deliveryStaff' as MerchantTab, label: 'Delivery Staff', icon: Bike },
    { id: 'crm' as MerchantTab, label: 'Customers / CRM', icon: Users },
    { id: 'analytics' as MerchantTab, label: 'Analytics', icon: BarChart3 },
    { id: 'payments' as MerchantTab, label: 'Payments & Payouts', icon: CreditCard },
    { id: 'notifications' as MerchantTab, label: 'Notifications', icon: Bell, badge: unreadNotifsCount },
    { id: 'settings' as MerchantTab, label: 'Shop Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-stone-900 border-r border-stone-800 text-stone-300 min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
      {/* Brand & Store header */}
      <div className="p-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-amber-950 font-black flex items-center justify-center text-base shadow-sm">
            🏪
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate">
              {shopOwnerShop?.name || 'My Store'}
            </h2>
            <p className="text-[11px] text-amber-400 font-semibold">Merchant Portal</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-stone-950 text-amber-400' : 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Switch back to Customer */}
      <div className="p-3 border-t border-stone-800">
        <button
          onClick={() => setUserRole('customer')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Customer App</span>
        </button>
      </div>
    </aside>
  );
};
