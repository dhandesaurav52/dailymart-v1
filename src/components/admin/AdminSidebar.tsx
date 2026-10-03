import React from 'react';
import { useApp } from '../../context/AppContext';
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
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'shops'
  | 'merchants'
  | 'customers'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'payments'
  | 'payouts'
  | 'analytics'
  | 'disputes'
  | 'notifications'
  | 'reports'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
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

  // Calculate live badge counts
  const pendingShopsCount = shops.filter(
    (s) => s.verificationStatus === 'PENDING'
  ).length;
  const pendingOrdersCount = allOrders.filter(
    (o) => o.orderStatus === 'PENDING'
  ).length;
  const openDisputesCount = disputes.filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;
  const pendingPayoutsCount = allPayments.filter(
    (p) => p.payoutStatus === 'PENDING' || p.payoutStatus === 'PROCESSING'
  ).length;

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount,
      badgeColor: 'bg-amber-500 text-amber-950',
    },
    {
      id: 'shops',
      label: 'Shops & Approvals',
      icon: Store,
      badge: pendingShopsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'merchants', label: 'Merchants', icon: Briefcase },
    { id: 'customers', label: 'Customers (CRM)', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    {
      id: 'payouts',
      label: 'Payouts',
      icon: WalletCards,
      badge: pendingPayoutsCount,
      badgeColor: 'bg-indigo-500 text-white',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: AlertOctagon,
      badge: openDisputesCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'notifications', label: 'System Logs', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-stone-900 text-stone-300 flex-col shrink-0 border-r border-stone-800 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm shadow-indigo-500/30">
            DM
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>DailyMart</span>
              <span className="text-[9px] uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded font-black">
                HQ
              </span>
            </div>
            <p className="text-[10px] text-stone-400">Marketplace Control</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-xs">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Core Marketplace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'hover:bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-stone-400 group-hover:text-stone-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white text-indigo-900'
                      : item.badgeColor || 'bg-stone-700 text-white'
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer Card */}
      <div className="p-3 border-t border-stone-800 bg-stone-900/60">
        <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Admin User</p>
              <p className="text-[10px] text-stone-400 truncate">
                {adminRole.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUserRole('customer')}
            className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Exit Admin to Customer App"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
