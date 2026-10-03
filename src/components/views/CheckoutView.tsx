import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  MapPin,
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Smartphone,
  Check,
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    shops,
    userLocation,
    createOrder,
    setIsCheckingOut,
    setActiveOrderId,
    setCurrentTab,
    isAuthenticated,
    setIsAuthModalOpen,
    currentUser,
  } = useApp();

  const [customerName, setCustomerName] = useState(currentUser?.name || 'Yashwant');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [address, setAddress] = useState(userLocation.address || 'Flat 402, Green Orchid Apartments');
  const [landmark, setLandmark] = useState('Opposite Central Park');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('ONLINE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Online Payment Provider Verification Modal
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const shop = shops.find((s) => s.id === cart.shopId);
  const deliveryFee = shop ? shop.deliveryFee : 25;
  const taxes = 5;
  const discount = 0;
  const grandTotal = cartSubtotal + deliveryFee + taxes - discount;

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-flight Validations
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!cart.shopId || cart.items.length === 0) {
      setErrorMessage('Your cart is empty. Please select products first.');
      return;
    }

    if (!shop) {
      setErrorMessage('Selected shop is no longer available.');
      return;
    }

    if (!shop.isOpen) {
      setErrorMessage(`${shop.name} is currently closed and not accepting orders.`);
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      setErrorMessage('Please provide complete delivery details (Name, Phone, and Address).');
      return;
    }

    if (paymentMethod === 'ONLINE') {
      // Open Verified Online Payment Gateway Modal
      setShowPaymentGatewayModal(true);
      setGatewayStep('idle');
    } else {
      // Direct Cash On Delivery placement with PENDING payment status
      executeOrderPlacement('COD');
    }
  };

  const executeOrderPlacement = async (mode: 'COD' | 'ONLINE') => {
    setIsSubmitting(true);
    try {
      const createdOrderId = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: address.trim(),
        landmark: landmark.trim(),
        paymentMethod: mode,
        notes: notes.trim(),
      });

      if (createdOrderId) {
        setShowPaymentGatewayModal(false);
        setIsCheckingOut(false);
        setActiveOrderId(createdOrderId);
        setCurrentTab('orders');
      } else {
        setErrorMessage('Failed to submit order. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred while placing your order.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmOnlinePayment = async () => {
    setGatewayStep('processing');
    // Simulate real gateway handshake & webhook confirmation
    setTimeout(async () => {
      setGatewayStep('success');
      setTimeout(async () => {
        await executeOrderPlacement('ONLINE');
      }, 700);
    }, 1200);
  };

  const handleSimulatePaymentFailure = () => {
    setGatewayStep('failed');
    setTimeout(() => {
      setShowPaymentGatewayModal(false);
      setErrorMessage('Online payment transaction failed or was cancelled by user. You can retry or choose Cash on Delivery.');
    }, 1200);
  };

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsCheckingOut(false)}
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-stone-900">Checkout</h2>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
        {/* 1. DELIVER TO */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Deliver To
            </h3>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                Complete Delivery Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                Landmark / Floor (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 2. FULFILLING SHOP */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Fulfilling Store
            </h3>
          </div>

          <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">
                {cart.shopName || shop?.name}
              </p>
              <p className="text-[11px] text-stone-500">
                {shop?.address}, {shop?.city}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                {shop?.estimatedDeliveryTime || '25–35 min'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. ORDER ITEMS REVIEW */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Items in Order ({cart.items.length})
          </h3>

          <div className="divide-y divide-stone-100">
            {cart.items.map(({ product, quantity }) => (
              <div key={product.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                    {quantity}x
                  </span>
                  <span className="font-semibold text-stone-900 truncate max-w-[180px]">
                    {product.name}
                  </span>
                </div>
                <span className="font-bold text-stone-900">₹{product.price * quantity}</span>
              </div>
            ))}
          </div>

          <div>
            <input
              type="text"
              placeholder="Delivery instructions (e.g. Leave with security, call on arrival)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 font-medium"
            />
          </div>
        </div>

        {/* 4. PAYMENT METHOD */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Payment Option
          </h3>

          <div className="space-y-2">
            <label
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                paymentMethod === 'ONLINE'
                  ? 'border-emerald-600 bg-emerald-50/60'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Online Payment / UPI</div>
                  <div className="text-[10px] text-stone-500">Google Pay, PhonePe, Cards & NetBanking</div>
                </div>
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'ONLINE'}
                onChange={() => setPaymentMethod('ONLINE')}
                className="accent-emerald-600"
              />
            </label>

            <label
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                paymentMethod === 'COD'
                  ? 'border-emerald-600 bg-emerald-50/60'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Cash on Delivery (COD)</div>
                  <div className="text-[10px] text-stone-500">Pay cash or UPI at your doorstep upon delivery</div>
                </div>
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="accent-emerald-600"
              />
            </label>
          </div>
        </div>

        {/* 5. BILL SUMMARY */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-900">₹{cartSubtotal}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-stone-900">₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Packaging & Taxes</span>
            <span className="font-semibold text-stone-900">₹{taxes}</span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-black text-stone-900">
            <span>Total Payable</span>
            <span className="text-base text-emerald-700">₹{grandTotal}</span>
          </div>
        </div>

        {/* Sticky Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 pb-safe">
          <div className="max-w-md mx-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {paymentMethod === 'ONLINE'
                  ? `Pay Online & Place Order · ₹${grandTotal}`
                  : `Place COD Order · ₹${grandTotal}`}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Verified Online Payment Provider Handshake Modal */}
      {showPaymentGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  ₹
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">DailyMart Secure Gateway</h3>
                  <p className="text-[10px] text-stone-500">256-Bit Encrypted Indian Banking Sandbox</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentGatewayModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                Paying to {shop?.name}
              </span>
              <div className="text-3xl font-black text-stone-900">₹{grandTotal}</div>
            </div>

            {gatewayStep === 'processing' ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-700">Authorizing Payment Provider Webhook...</p>
                <p className="text-[11px] text-stone-400">Verifying signature and reserving funds</p>
              </div>
            ) : gatewayStep === 'success' ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-7 h-7" />
                </div>
                <p className="text-sm font-black text-emerald-800">Payment Verified &amp; Confirmed!</p>
                <p className="text-[11px] text-stone-500">Submitting order to shopkeeper...</p>
              </div>
            ) : gatewayStep === 'failed' ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <p className="text-sm font-black text-rose-800">Payment Authorization Failed</p>
                <p className="text-[11px] text-stone-500">Transaction was rejected by bank.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Payment Instrument:</span>
                    <span className="font-bold text-stone-900">UPI / QR (Google Pay / PhonePe)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Settlement Account:</span>
                    <span className="font-bold text-stone-900">Verified Merchant Escrow</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleConfirmOnlinePayment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize &amp; Pay ₹{grandTotal}</span>
                  </button>

                  <button
                    onClick={handleSimulatePaymentFailure}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Simulate Payment Failure
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
