import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Building,
  User,
  Mail,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import { isValidGstin, normalizeGstin, extractPanFromGstin } from '../../lib/gstin';

interface BecomeSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted: () => void;
}

export const BecomeSellerModal: React.FC<BecomeSellerModalProps> = ({
  isOpen,
  onClose,
  onApplicationSubmitted,
}) => {
  const {
    currentUser,
    userLocation,
    submitSellerApplication,
    updateCustomerProfile,
    shops,
  } = useApp();

  // Multi-step: 1 = Value prop, 2 = Contact info, 3 = Shop Registration & GSTIN
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Contact info
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantPhone, setApplicantPhone] = useState(currentUser?.phone || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');

  // Shop info
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('Groceries & Daily Staples');
  const [shopAddress, setShopAddress] = useState(userLocation.address || '');
  const [shopCity, setShopCity] = useState(userLocation.city || 'Chandrapur');
  const [shopPincode, setShopPincode] = useState(userLocation.pincode || '442401');
  const [deliveryRadius, setDeliveryRadius] = useState<number>(12);

  // Mandatory GSTIN & Statutory details
  const [rawGstin, setRawGstin] = useState('');
  const [gstinTouched, setGstinTouched] = useState(false);
  const [pan, setPan] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([
    'GST Registration Certificate (REG-06)',
    'Shop & Establishment Act (Gumasta)',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Computed GSTIN Validation
  const gstinValidation = isValidGstin(rawGstin);

  useEffect(() => {
    if (gstinValidation.isValid && gstinValidation.pan) {
      setPan(gstinValidation.pan);
    }
  }, [gstinValidation.isValid, gstinValidation.pan]);

  if (!isOpen) return null;

  const handleStartApplication = () => {
    if (!currentUser?.name || !currentUser?.phone || currentUser.name === 'Guest Shopper' || currentUser.name === 'Customer') {
      setStep(2);
    } else {
      setApplicantName(currentUser.name);
      setApplicantPhone(currentUser.phone);
      setApplicantEmail(currentUser.email || '');
      setStep(3);
    }
  };

  const handleSaveContactAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim()) {
      setErrorMsg('Please enter your full legal name and phone number.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    await updateCustomerProfile({
      name: applicantName.trim(),
      phone: applicantPhone.trim(),
      email: applicantEmail.trim() || `${applicantPhone.trim().replace(/\D/g, '')}@customer.dailymart.in`,
    });
    setIsSubmitting(false);
    setStep(3);
  };

  const handleToggleDoc = (docName: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docName) ? prev.filter((d) => d !== docName) : [...prev, docName]
    );
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Mandatory GSTIN check
    if (!gstinValidation.isValid) {
      setErrorMsg(gstinValidation.error || 'A valid 15-character GSTIN is required by DailyMart statutory policy.');
      setGstinTouched(true);
      return;
    }

    const normalizedGstin = gstinValidation.normalized;

    // 2. Prevent duplicate GSTIN registrations
    const duplicateShop = shops.find(
      (s) => s.gstin && normalizeGstin(s.gstin) === normalizedGstin
    );
    if (duplicateShop) {
      setErrorMsg(`A registered shop ("${duplicateShop.name}") is already active with GSTIN ${normalizedGstin}. Duplicate GSTIN registrations are not permitted.`);
      return;
    }

    if (!shopName.trim() || !shopAddress.trim()) {
      setErrorMsg('Please enter your shop name and complete physical storefront address.');
      return;
    }

    if (selectedDocuments.length === 0) {
      setErrorMsg('Please select at least one statutory business document.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitSellerApplication({
        applicantName: applicantName || currentUser?.name || 'Shop Partner',
        applicantPhone: applicantPhone || currentUser?.phone || '+91 99000 00000',
        applicantEmail: applicantEmail || currentUser?.email || '',
        shopName: shopName.trim(),
        category: shopCategory,
        address: shopAddress.trim(),
        city: shopCity.trim(),
        pincode: shopPincode.trim(),
        deliveryRadius,
        gstin: normalizedGstin,
      });

      if (res) {
        onApplicationSubmitted();
        onClose();
      } else {
        setErrorMsg('Failed to submit application. Please review details and retry.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto text-stone-900 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm">
              🏪
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Partner with DailyMart
              </h2>
              <p className="text-[11px] text-stone-500">
                Register your verified local grocery storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Overview & Statutory Value Props */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/70 space-y-2">
              <h3 className="text-sm font-extrabold text-amber-950">
                Hyper-local grocery deliveries within 12 km
              </h3>
              <p className="text-amber-900/80 leading-relaxed text-[11px]">
                DailyMart connects registered local merchants with neighborhood customers. To protect customers and maintain marketplace trust, verified GSTIN and business details are mandatory for all sellers.
              </p>
            </div>

            <div className="space-y-2.5 text-stone-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Dedicated Merchant Portal:</strong> Manage catalog, stock, and orders</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Assign Your Own Delivery Staff:</strong> Dedicated delivery staff fleet tools</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>GSTIN Verified:</strong> Trust badge and automated settlement reports</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Instant UPI &amp; COD:</strong> Full payment reconciliation</span>
              </div>
            </div>

            <button
              onClick={handleStartApplication}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-extrabold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Begin Seller Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Identity & Contact info */}
        {step === 2 && (
          <form onSubmit={handleSaveContactAndContinue} className="space-y-3.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-600 space-y-1">
              <p className="font-bold text-stone-900">
                Store Owner Identity
              </p>
              <p className="text-[11px] text-stone-500">
                Provide the primary proprietor contact. This account will have administrative rights to manage the store.
              </p>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Proprietor / Owner Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Primary Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Business Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="shop@example.com"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !applicantName.trim() || !applicantPhone.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Continue to Store Details'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Shop Registration & Mandatory GSTIN Form */}
        {step === 3 && (
          <form onSubmit={handleSubmitRegistration} className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Registered Store / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shree Krishna General Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* GSTIN Field with Live Validation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-700 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>GSTIN (Mandatory) *</span>
                </label>
                <span className="text-[10px] text-stone-400 uppercase font-mono">15 Characters</span>
              </div>

              <input
                type="text"
                required
                maxLength={15}
                placeholder="27AABCS1429B1ZB"
                value={rawGstin}
                onChange={(e) => {
                  setRawGstin(e.target.value.toUpperCase());
                  setGstinTouched(true);
                }}
                className={`w-full p-2.5 bg-stone-50 border rounded-xl font-mono text-xs tracking-wider uppercase font-bold focus:outline-none focus:ring-2 ${
                  gstinTouched && !gstinValidation.isValid
                    ? 'border-rose-400 focus:ring-rose-400 text-rose-900 bg-rose-50/40'
                    : gstinValidation.isValid
                    ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-900 bg-emerald-50/30'
                    : 'border-stone-200 focus:ring-amber-500'
                }`}
              />

              {/* Live GSTIN Status Feedback */}
              {rawGstin && (
                <div className="mt-1.5">
                  {gstinValidation.isValid ? (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid GSTIN Format ({gstinValidation.stateName})</span>
                      </div>
                      <p className="text-stone-600">
                        Extracted Business PAN: <strong className="font-mono">{gstinValidation.pan}</strong>
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-600 font-medium">
                      ⚠️ {gstinValidation.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Primary Category *
                </label>
                <select
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                >
                  <option value="Groceries & Daily Staples">Groceries & Daily Staples</option>
                  <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                  <option value="Dairy, Bread & Bakery">Dairy, Bread & Bakery</option>
                  <option value="Organic & Health Foods">Organic & Health Foods</option>
                  <option value="General Supermarket">General Supermarket</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Delivery Radius Limit
                </label>
                <select
                  value={deliveryRadius}
                  onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                >
                  <option value={5}>Within 5 km</option>
                  <option value={8}>Within 8 km</option>
                  <option value={12}>Within 12 km (DailyMart Standard)</option>
                  <option value={15}>Within 15 km</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Storefront Physical Address *
              </label>
              <input
                type="text"
                required
                placeholder="Shop number, building, street, neighborhood..."
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={shopCity}
                  onChange={(e) => setShopCity(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  placeholder="442401"
                  value={shopPincode}
                  onChange={(e) => setShopPincode(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Required Business Documents */}
            <div className="space-y-2">
              <label className="block text-stone-700 font-bold">
                Required Business Documents *
              </label>
              <div className="space-y-1.5">
                {[
                  'GST Registration Certificate (REG-06)',
                  'Shop & Establishment Act (Gumasta)',
                  'FSSAI Food Safety License',
                  'Proprietor Aadhar / PAN Card Copy',
                ].map((docName) => (
                  <label
                    key={docName}
                    className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-stone-100/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(docName)}
                      onChange={() => handleToggleDoc(docName)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-stone-700 font-medium">{docName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !gstinValidation.isValid || !shopName.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit for Admin Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
