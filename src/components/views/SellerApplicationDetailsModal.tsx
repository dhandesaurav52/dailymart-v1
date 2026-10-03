import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react';
import { SellerApplication } from '../../types';

interface SellerApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplication | null;
  onOpenDashboard?: () => void;
}

export const SellerApplicationDetailsModal: React.FC<SellerApplicationDetailsModalProps> = ({
  isOpen,
  onClose,
  application,
  onOpenDashboard,
}) => {
  if (!isOpen || !application) return null;

  const isUnderReview = application.status === 'UNDER_REVIEW';
  const isApproved = application.status === 'APPROVED';
  const isRejected = application.status === 'REJECTED';
  const isActionRequired = application.status === 'ADDITIONAL_INFO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto text-stone-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold text-sm">
              🏪
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                Seller Application
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                #{application.applicationId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isUnderReview
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : isApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : isRejected
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-orange-50 border-orange-200 text-orange-950'
          }`}
        >
          {isUnderReview && <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
          {isApproved && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {isRejected && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {isActionRequired && <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />}

          <div className="text-xs space-y-1">
            <p className="font-extrabold text-sm">
              {isUnderReview && 'Application Under Review'}
              {isApproved && 'Approved — Partner Store'}
              {isRejected && 'Application Not Approved'}
              {isActionRequired && 'Additional Information Required'}
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {isUnderReview &&
                'Our merchant operations team is reviewing your physical store address and local delivery parameters. Verification typically takes 24 hours.'}
              {isApproved &&
                'Your shop is approved for the DailyMart marketplace. You can now access your Seller Dashboard to add products and fulfill orders.'}
              {isRejected &&
                (application.reviewNotes ||
                  'The application could not be verified with the provided details. Contact merchant support for assistance.')}
              {isActionRequired &&
                (application.reviewNotes ||
                  'Please provide trade license or updated phone contact.')}
            </p>
          </div>
        </div>

        {/* Application Summary */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-500">Shop Name:</span>
            <span className="font-bold text-stone-900">{application.shopName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Category:</span>
            <span className="font-medium text-stone-800">{application.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Contact:</span>
            <span className="font-medium text-stone-800">{application.applicantPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Location:</span>
            <span className="font-medium text-stone-800 truncate max-w-[200px]">
              {application.address}, {application.city}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Delivery Radius:</span>
            <span className="font-medium text-stone-800">{application.deliveryRadius || 12} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Submitted:</span>
            <span className="text-stone-400">
              {new Date(application.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          {isApproved && onOpenDashboard ? (
            <button
              onClick={() => {
                onClose();
                onOpenDashboard();
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
            >
              Open Seller Dashboard
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
