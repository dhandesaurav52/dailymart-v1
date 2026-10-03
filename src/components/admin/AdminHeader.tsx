import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Bell,
  Menu,
  X,
  ExternalLink,
  Store,
  User,
  Shield,
  Layers,
  Search,
} from 'lucide-react';
import { AdminRole } from '../../types';

interface AdminHeaderProps {
  onToggleMobileNav: () => void;
  onOpenNotifications: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobileNav,
  onOpenNotifications,
}) => {
  const {
    userRole,
    setUserRole,
    adminRole,
    setAdminRole,
    disputes,
    shops,
    allOrders,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const pendingShopsCount = shops.filter(
    (s) => s.verificationStatus === 'PENDING'
  ).length;
  const openDisputesCount = disputes.filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;
  const pendingOrdersCount = allOrders.filter(
    (o) => o.orderStatus === 'PENDING'
  ).length;

  const totalAlerts = pendingShopsCount + openDisputesCount;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile menu button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  DailyMart
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  Admin Panel
                </span>
              </div>
              <p className="text-[10px] text-stone-400 hidden xs:block">
                Marketplace Central Control Center
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Persona Switcher & Admin Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Persona Switcher */}
          <div className="hidden sm:flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
            <button
              onClick={() => setUserRole('customer')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold text-stone-300 hover:text-white hover:bg-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Customer App"
            >
              <User className="w-3 h-3 text-emerald-400" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => setUserRole('shop_owner')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold text-stone-300 hover:text-white hover:bg-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Merchant Portal"
            >
              <Store className="w-3 h-3 text-amber-400" />
              <span>Merchant</span>
            </button>
            <div className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-1">
              <Shield className="w-3 h-3 text-indigo-200" />
              <span>Admin</span>
            </div>
          </div>

          {/* Admin Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Select Admin Privilege Role"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">
                {adminRole.replace('_', ' ')}
              </span>
              <span className="md:hidden">Role</span>
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 border-b border-stone-800 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Admin Permission Level
                </div>
                {(
                  [
                    'SUPER_ADMIN',
                    'OPERATIONS_ADMIN',
                    'FINANCE_ADMIN',
                    'SUPPORT_ADMIN',
                  ] as AdminRole[]
                ).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setAdminRole(role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-800 transition-colors cursor-pointer ${
                      adminRole === role
                        ? 'text-indigo-400 font-bold bg-stone-800/60'
                        : 'text-stone-300'
                    }`}
                  >
                    <span>{role.replace('_', ' ')}</span>
                    {adminRole === role && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>
                ))}

                <div className="pt-1 mt-1 border-t border-stone-800 sm:hidden">
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase">
                    Switch App Mode
                  </div>
                  <button
                    onClick={() => {
                      setUserRole('customer');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-300 hover:bg-stone-800 cursor-pointer flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Customer App
                  </button>
                  <button
                    onClick={() => {
                      setUserRole('shop_owner');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-300 hover:bg-stone-800 cursor-pointer flex items-center gap-2"
                  >
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    Shop Owner App
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="System alerts & disputes"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-stone-900">
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
