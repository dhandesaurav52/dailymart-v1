import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminHeader } from '../admin/AdminHeader';
import { AdminSidebar, AdminTab } from '../admin/AdminSidebar';
import { AdminMobileNav } from '../admin/AdminMobileNav';
import { AdminOverviewView } from '../admin/views/AdminOverviewView';
import { AdminOrdersView } from '../admin/views/AdminOrdersView';
import { AdminShopsView } from '../admin/views/AdminShopsView';
import { AdminMerchantsView } from '../admin/views/AdminMerchantsView';
import { AdminCustomersView } from '../admin/views/AdminCustomersView';
import { AdminProductsView } from '../admin/views/AdminProductsView';
import { AdminCategoriesView } from '../admin/views/AdminCategoriesView';
import { AdminInventoryView } from '../admin/views/AdminInventoryView';
import { AdminPaymentsView } from '../admin/views/AdminPaymentsView';
import { AdminPayoutsView } from '../admin/views/AdminPayoutsView';
import { AdminAnalyticsView } from '../admin/views/AdminAnalyticsView';
import { AdminDisputesView } from '../admin/views/AdminDisputesView';
import { AdminNotificationsView } from '../admin/views/AdminNotificationsView';
import { AdminReportsView } from '../admin/views/AdminReportsView';
import { AdminSettingsView } from '../admin/views/AdminSettingsView';

export const AdminDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedOrderIdForInspection, setSelectedOrderIdForInspection] = useState<string | null>(null);

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectOrder = (orderId: string) => {
    setSelectedOrderIdForInspection(orderId);
    setCurrentTab('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row text-stone-900 font-sans antialiased">
      {/* Desktop Sidebar (lg+) */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Mobile Drawer */}
      <AdminMobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onOpenNotifications={() => handleSelectTab('notifications')}
        />

        {/* Dynamic View Tab */}
        <main className="flex-1 pb-16">
          {currentTab === 'overview' && (
            <AdminOverviewView
              onNavigateTab={handleSelectTab}
              onInspectOrder={handleInspectOrder}
            />
          )}

          {currentTab === 'orders' && (
            <AdminOrdersView
              initialSelectedOrderId={selectedOrderIdForInspection}
              onClearInitialOrder={() => setSelectedOrderIdForInspection(null)}
            />
          )}

          {currentTab === 'shops' && <AdminShopsView />}

          {currentTab === 'merchants' && <AdminMerchantsView />}

          {currentTab === 'customers' && <AdminCustomersView />}

          {currentTab === 'products' && <AdminProductsView />}

          {currentTab === 'categories' && <AdminCategoriesView />}

          {currentTab === 'inventory' && <AdminInventoryView />}

          {currentTab === 'payments' && <AdminPaymentsView />}

          {currentTab === 'payouts' && <AdminPayoutsView />}

          {currentTab === 'analytics' && <AdminAnalyticsView />}

          {currentTab === 'disputes' && <AdminDisputesView />}

          {currentTab === 'notifications' && <AdminNotificationsView />}

          {currentTab === 'reports' && <AdminReportsView />}

          {currentTab === 'settings' && <AdminSettingsView />}
        </main>
      </div>
    </div>
  );
};
