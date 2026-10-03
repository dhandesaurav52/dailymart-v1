import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LocationModal } from './components/LocationModal';
import { ShopConflictModal } from './components/ShopConflictModal';
import { HomeView } from './components/views/HomeView';
import { ShopsView } from './components/views/ShopsView';
import { ShopDetailView } from './components/views/ShopDetailView';
import { CartView } from './components/views/CartView';
import { CheckoutView } from './components/views/CheckoutView';
import { OrderTrackingView } from './components/views/OrderTrackingView';
import { OrdersListView } from './components/views/OrdersListView';
import { ProfileView } from './components/views/ProfileView';
import { ShopOwnerDashboard } from './components/views/ShopOwnerDashboard';
import { DeliveryDashboard } from './components/views/DeliveryDashboard';
import { AdminDashboard } from './components/views/AdminDashboard';
import { AuthenticationScreen } from './components/auth/AuthenticationScreen';
import { AlertCircle, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    userRole,
    activeOrderId,
    isCheckingOut,
    activeShop,
    currentTab,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isVerifiedAdmin,
    canAccessSellerDashboard,
    isAuthorizedDelivery,
    switchWorkspace,
    accessDeniedNotice,
    clearAccessDeniedNotice,
    isAuthenticated,
  } = useApp();

  // Strict route protection guard against unauthorized access
  useEffect(() => {
    if (userRole === 'admin' && !isVerifiedAdmin) {
      switchWorkspace('customer');
    } else if (userRole === 'shop_owner' && !canAccessSellerDashboard) {
      switchWorkspace('customer');
    } else if (userRole === 'delivery_staff' && !isAuthorizedDelivery) {
      switchWorkspace('customer');
    } else if (!isAuthenticated && userRole !== 'customer') {
      switchWorkspace('customer');
      setIsAuthModalOpen(true);
    }
  }, [
    userRole,
    isVerifiedAdmin,
    canAccessSellerDashboard,
    isAuthorizedDelivery,
    isAuthenticated,
    switchWorkspace,
    setIsAuthModalOpen,
  ]);

  // Auto-dismiss access denied notice after 5 seconds
  useEffect(() => {
    if (accessDeniedNotice) {
      const timer = setTimeout(() => {
        clearAccessDeniedNotice();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [accessDeniedNotice, clearAccessDeniedNotice]);

  // 1. Role: Platform Admin Control Center
  if (userRole === 'admin' && isVerifiedAdmin) {
    return (
      <>
        {accessDeniedNotice && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-rose-900/95 text-white border border-rose-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{accessDeniedNotice}</span>
              </div>
              <button
                onClick={clearAccessDeniedNotice}
                className="p-1 hover:bg-rose-800 rounded-full cursor-pointer text-rose-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <AdminDashboard />
        {isAuthModalOpen && (
          <AuthenticationScreen isModal onClose={() => setIsAuthModalOpen(false)} />
        )}
      </>
    );
  }

  // 2. Role: Shop Owner / Merchant Order Management Portal
  if (userRole === 'shop_owner' && canAccessSellerDashboard) {
    return (
      <>
        {accessDeniedNotice && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-rose-900/95 text-white border border-rose-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{accessDeniedNotice}</span>
              </div>
              <button
                onClick={clearAccessDeniedNotice}
                className="p-1 hover:bg-rose-800 rounded-full cursor-pointer text-rose-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <ShopOwnerDashboard />
        {isAuthModalOpen && (
          <AuthenticationScreen isModal onClose={() => setIsAuthModalOpen(false)} />
        )}
      </>
    );
  }

  // 3. Role: Delivery Staff Partner Dashboard
  if (userRole === 'delivery_staff' && isAuthorizedDelivery) {
    return (
      <>
        {accessDeniedNotice && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-rose-900/95 text-white border border-rose-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{accessDeniedNotice}</span>
              </div>
              <button
                onClick={clearAccessDeniedNotice}
                className="p-1 hover:bg-rose-800 rounded-full cursor-pointer text-rose-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <DeliveryDashboard />
        {isAuthModalOpen && (
          <AuthenticationScreen isModal onClose={() => setIsAuthModalOpen(false)} />
        )}
      </>
    );
  }

  // 4. Role: Customer Mode (Supports anonymous browsing & authenticated actions)
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {accessDeniedNotice && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-rose-900/95 text-white border border-rose-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{accessDeniedNotice}</span>
            </div>
            <button
              onClick={clearAccessDeniedNotice}
              className="p-1 hover:bg-rose-800 rounded-full cursor-pointer text-rose-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Header />

      <main className="w-full">
        {activeOrderId ? (
          <OrderTrackingView />
        ) : isCheckingOut ? (
          <CheckoutView />
        ) : activeShop ? (
          <ShopDetailView />
        ) : currentTab === 'cart' ? (
          <CartView />
        ) : currentTab === 'orders' ? (
          <OrdersListView />
        ) : currentTab === 'shops' ? (
          <ShopsView />
        ) : currentTab === 'profile' ? (
          <ProfileView />
        ) : (
          <HomeView />
        )}
      </main>

      <BottomNav />
      <LocationModal />
      <ShopConflictModal />

      {isAuthModalOpen && (
        <AuthenticationScreen isModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
