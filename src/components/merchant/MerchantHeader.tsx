import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Power,
  Bell,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { isShopCurrentlyOpen } from '../../lib/seedData';

interface MerchantHeaderProps {
  onOpenNotifications: () => void;
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({ onOpenNotifications }) => {
  const {
    shopOwnerShop,
    toggleShopOpenStatus,
    setManualShopOverride,
    setUserRole,
    merchantNotifications,
  } = useApp();

  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  if (!shopOwnerShop) return null;

  const isOpen = isShopCurrentlyOpen(shopOwnerShop);
  const unreadCount = merchantNotifications.filter((n) => !n.isRead).length;

  const handleToggleClick = () => {
    if (isOpen) {
      setShowCloseConfirmModal(true);
    } else {
      setManualShopOverride(shopOwnerShop.id, 'OPEN');
    }
  };

  const confirmCloseShop = () => {
    setManualShopOverride(shopOwnerShop.id, 'CLOSED');
    setShowCloseConfirmModal(false);
  };

  return (
    <>
      <header className="bg-stone-900 text-white sticky top-0 z-40 border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Return to Customer App & Shop Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setUserRole('customer')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Return to Customer App"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Customer App</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center font-black text-sm shrink-0">
                🏪
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[150px] sm:max-w-[280px]">
                    {shopOwnerShop.name}
                  </h1>
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded uppercase shrink-0">
                    Merchant
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate hidden xs:block">
                  {shopOwnerShop.address}, {shopOwnerShop.city}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Online/Offline Toggle & Notifications */}
          <div className="flex items-center gap-2">
            {/* Prominent Shop Open / Closed Toggle Button */}
            <button
              onClick={handleToggleClick}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                isOpen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-300 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOpen ? 'SHOP OPEN' : 'SHOP CLOSED'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-stone-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Closing Shop */}
      {showCloseConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Power className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-stone-900">Close your shop?</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Customers will not be able to place new orders while your shop is closed. Existing orders will continue normally.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCloseConfirmModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Keep Shop Open
              </button>
              <button
                onClick={confirmCloseShop}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
