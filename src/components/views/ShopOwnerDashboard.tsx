import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MerchantHeader } from '../merchant/MerchantHeader';
import { MerchantBottomNav, MerchantTab } from '../merchant/MerchantBottomNav';
import { MerchantSidebar } from '../merchant/MerchantSidebar';
import { MerchantDashboardOverview } from '../merchant/views/MerchantDashboardOverview';
import { MerchantOrdersView } from '../merchant/views/MerchantOrdersView';
import { MerchantProductsView } from '../merchant/views/MerchantProductsView';
import { MerchantInventoryView } from '../merchant/views/MerchantInventoryView';
import { MerchantDeliveryStaffView } from '../merchant/views/MerchantDeliveryStaffView';
import { MerchantCrmView } from '../merchant/views/MerchantCrmView';
import { MerchantAnalyticsView } from '../merchant/views/MerchantAnalyticsView';
import { MerchantPaymentsView } from '../merchant/views/MerchantPaymentsView';
import { MerchantSettingsView } from '../merchant/views/MerchantSettingsView';
import { MerchantNotificationsView } from '../merchant/views/MerchantNotificationsView';
import {
  Boxes,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  ArrowLeft,
  X,
  Bike,
} from 'lucide-react';

export const ShopOwnerDashboard: React.FC = () => {
  const { shopOwnerShop, setUserRole } = useApp();

  const [currentTab, setCurrentTab] = useState<MerchantTab>('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [selectedOrderIdForInspection, setSelectedOrderIdForInspection] = useState<string | null>(null);

  if (!shopOwnerShop) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-stone-500">No shop found for merchant management.</p>
        <button
          onClick={() => setUserRole('customer')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Customer Mode
        </button>
      </div>
    );
  }

  const handleSelectTab = (tab: MerchantTab) => {
    setCurrentTab(tab);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderIdForInspection(orderId);
    setCurrentTab('orders');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row text-stone-900 font-sans antialiased">
      {/* Desktop Sidebar (visible on lg+) */}
      <MerchantSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Merchant Header */}
        <MerchantHeader
          onOpenNotifications={() => handleSelectTab('notifications')}
        />

        {/* Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4 pb-20 lg:pb-8">
          {currentTab === 'dashboard' && (
            <MerchantDashboardOverview
              onNavigateTab={handleSelectTab}
              onOpenAddProduct={() => handleSelectTab('products')}
              onViewOrderDetails={handleViewOrder}
            />
          )}

          {currentTab === 'orders' && (
            <MerchantOrdersView
              selectedOrderId={selectedOrderIdForInspection}
              onClearSelectedOrder={() => setSelectedOrderIdForInspection(null)}
            />
          )}

          {currentTab === 'products' && (
            <MerchantProductsView />
          )}

          {currentTab === 'inventory' && (
            <MerchantInventoryView />
          )}

          {currentTab === 'deliveryStaff' && (
            <MerchantDeliveryStaffView />
          )}

          {currentTab === 'crm' && (
            <MerchantCrmView />
          )}

          {currentTab === 'analytics' && (
            <MerchantAnalyticsView />
          )}

          {currentTab === 'payments' && (
            <MerchantPaymentsView />
          )}

          {currentTab === 'settings' && (
            <MerchantSettingsView />
          )}

          {currentTab === 'notifications' && (
            <MerchantNotificationsView
              onSelectOrder={(orderId) => handleViewOrder(orderId)}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation (hidden on lg+) */}
        <MerchantBottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
        />
      </div>

      {/* Mobile "More" Drawer / Modal */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="bg-stone-900 text-white w-full rounded-t-3xl p-5 space-y-4 shadow-2xl border-t border-stone-800 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-extrabold text-stone-200 uppercase tracking-wider">
                Merchant Tools
              </h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => handleSelectTab('deliveryStaff')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left col-span-2 text-amber-300"
              >
                <Bike className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Delivery Staff Fleet</span>
              </button>

              <button
                onClick={() => handleSelectTab('inventory')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Inventory &amp; Stock</span>
              </button>

              <button
                onClick={() => handleSelectTab('analytics')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sales Analytics</span>
              </button>

              <button
                onClick={() => handleSelectTab('payments')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Payments &amp; Payouts</span>
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Shop Settings &amp; Hours</span>
              </button>

              <button
                onClick={() => handleSelectTab('notifications')}
                className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left col-span-2"
              >
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notifications Center</span>
              </button>
            </div>

            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setUserRole('customer');
                }}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit to Customer App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
