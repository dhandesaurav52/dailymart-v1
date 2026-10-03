import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

export const ShopConflictModal: React.FC = () => {
  const {
    conflictModal,
    closeConflictModal,
    resolveConflictClearAndAdd,
    setCurrentTab,
    setActiveShopId,
  } = useApp();

  if (!conflictModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-stone-900 text-center">
          Replace cart items?
        </h3>

        <div className="mt-2 text-center text-xs text-stone-600 space-y-1">
          <p>
            Your cart contains items from{' '}
            <strong className="text-stone-900">{conflictModal.currentShopName}</strong>.
          </p>
          <p className="text-stone-500">
            You can only order from one shop at a time to ensure fast, fresh delivery.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {/* Option 1: Clear Cart & Shop at Shop B */}
          <button
            onClick={resolveConflictClearAndAdd}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart & Shop at {conflictModal.pendingShopName}</span>
          </button>

          {/* Option 2: Continue with Shop A */}
          <button
            onClick={() => {
              closeConflictModal();
              // Navigate back to current cart or shop A
              setCurrentTab('cart');
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Continue with {conflictModal.currentShopName}
          </button>
        </div>
      </div>
    </div>
  );
};
