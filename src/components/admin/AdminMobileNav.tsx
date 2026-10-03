import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from './AdminSidebar';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Briefcase,
  Users,
  Package,
  Grid,
  Boxes,
  CreditCard,
  WalletCards,
  BarChart3,
  AlertOctagon,
  Bell,
  FileSpreadsheet,
  Settings,
  X,
  Shield,
  User,
} from 'lucide-react';

interface AdminMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
}) => {
  const {
    shops,
    allOrders,
    disputes,
    allPayments,
    adminRole,
    setUserRole,
  } = useApp();

  if (!isOpen) return null;

  const pendingShopsCount = shops.filter(
    (s) => s.verificationStatus === 'PENDING'
  ).length;
  const pendingOrdersCount = allOrders.filter(
    (o) => o.orderStatus === 'PENDING'
  ).length;
  const openDisputesCount = disputes.filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount,
    },
    {
      id: 'shops',
      label: 'Shops & Approvals',
      icon: Store,
      badge: pendingShopsCount,
    },
    { id: 'merchants', label: 'Merchants', icon: Briefcase },
    { id: 'customers', label: 'Customers (CRM)', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'payouts', label: 'Payouts', icon: WalletCards },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: AlertOctagon,
      badge: openDisputesCount,
    },
    { id: 'notifications', label: 'System Logs', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-stone-900 text-stone-200 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base">
              DM
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">DailyMart Admin</p>
              <p className="text-[10px] text-stone-400">
                {adminRole.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer with Persona Switchers */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 space-y-2">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
            Quick Persona Switch
          </div>
          <button
            onClick={() => setUserRole('customer')}
            className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Switch to Customer App</span>
          </button>
          <button
            onClick={() => setUserRole('shop_owner')}
            className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to Merchant Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
