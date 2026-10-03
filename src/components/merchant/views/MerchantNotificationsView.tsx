import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Package,
  Power,
  Trash2,
  Clock,
} from 'lucide-react';
import { MerchantNotification } from '../../../types';

interface MerchantNotificationsViewProps {
  onSelectOrder?: (orderId: string) => void;
}

export const MerchantNotificationsView: React.FC<MerchantNotificationsViewProps> = ({
  onSelectOrder,
}) => {
  const {
    merchantNotifications,
    markNotificationAsRead,
    clearAllNotifications,
  } = useApp();

  const getIcon = (type: MerchantNotification['type']) => {
    switch (type) {
      case 'NEW_ORDER':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SHOP_CLOSED':
        return <Power className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            Notifications Center
          </h2>
          <p className="text-xs text-stone-500">
            Real-time alerts for incoming orders, payments, and stock shortages
          </p>
        </div>

        {merchantNotifications.length > 0 && (
          <button
            onClick={() => clearAllNotifications()}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {merchantNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-1">
          <Bell className="w-8 h-8 text-stone-400 mx-auto mb-1" />
          <p className="font-bold text-stone-700">No new notifications</p>
          <p>You will be notified immediately when customers place orders or items run low on stock.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
          {merchantNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                if (n.orderId && onSelectOrder) {
                  onSelectOrder(n.orderId);
                }
              }}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                !n.isRead ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-stone-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-900">{n.title}</h4>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
