import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Banknote,
  DollarSign,
  Download,
  Settings,
} from 'lucide-react';
import { MerchantAccount } from '../../../types';

export const MerchantPaymentsView: React.FC = () => {
  const {
    shopOwnerShop,
    merchantAccount,
    updateMerchantAccount,
    merchantPayments,
    markCodPaymentCollected,
  } = useApp();

  const [showAccountModal, setShowAccountModal] = useState(false);

  // Form states for Payment Account Onboarding
  const [businessName, setBusinessName] = useState(merchantAccount?.businessName || shopOwnerShop?.name || '');
  const [ownerName, setOwnerName] = useState(merchantAccount?.ownerName || 'Rahul Sharma');
  const [phone, setPhone] = useState(merchantAccount?.phone || shopOwnerShop?.phone || '+91 98450 12345');
  const [email, setEmail] = useState(merchantAccount?.email || 'merchant@dailymart.in');
  const [address, setAddress] = useState(merchantAccount?.businessAddress || shopOwnerShop?.address || '');
  const [gstin, setGstin] = useState(merchantAccount?.gstin || '29ABCDE1234F1Z5');
  const [pan, setPan] = useState(merchantAccount?.pan || 'ABCDE1234F');
  const [bankHolder, setBankHolder] = useState(merchantAccount?.bankAccountHolder || shopOwnerShop?.name || '');
  const [bankName, setBankName] = useState(merchantAccount?.bankName || 'HDFC Bank');
  const [ifsc, setIfsc] = useState(merchantAccount?.ifsc || 'HDFC0001234');
  const [rawAccNumber, setRawAccNumber] = useState('50100482194821');

  if (!shopOwnerShop) return null;

  const isConnected = !!merchantAccount && merchantAccount.status === 'VERIFIED';

  // Aggregate payout stats
  const totalSettled = merchantPayments
    .filter((p) => p.payoutStatus === 'PAID')
    .reduce((sum, p) => sum + p.merchantAmount, 0);

  const pendingPayouts = merchantPayments
    .filter((p) => p.payoutStatus === 'PROCESSING')
    .reduce((sum, p) => sum + p.merchantAmount, 0);

  const pendingCod = merchantPayments
    .filter((p) => p.paymentMethod === 'COD' && p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mask account number for security (never store raw in plain text!)
    const masked = rawAccNumber.length >= 4 ? `****${rawAccNumber.slice(-4)}` : '****4821';

    const accountData: Partial<MerchantAccount> = {
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      businessAddress: address.trim(),
      gstin: gstin.trim(),
      pan: pan.trim(),
      bankAccountHolder: bankHolder.trim(),
      bankName: bankName.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      accountNumberMasked: masked,
      status: 'VERIFIED',
      payoutStatus: 'ACTIVE',
      platformCommissionRate: 2,
    };

    await updateMerchantAccount(shopOwnerShop.id, accountData);
    setShowAccountModal(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">
          Billing, Payments &amp; Reconciliation
        </h2>
        <p className="text-xs text-stone-500">
          Manage payout bank accounts, platform commission reconciliation, and cash collections
        </p>
      </div>

      {/* 1. Payment Account Status Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">Connected Payout Account</span>
              {isConnected ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  🟢 Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  🟠 Setup Required
                </span>
              )}
            </div>

            {isConnected ? (
              <p className="text-xs text-stone-500 mt-0.5">
                Bank: <strong className="text-stone-700">{merchantAccount.bankName}</strong> · Account:{' '}
                <strong className="text-stone-700">{merchantAccount.accountNumberMasked}</strong> · Payouts:{' '}
                <span className="text-emerald-700 font-bold">{merchantAccount.payoutStatus}</span>
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-0.5">
                Connect your business bank account to receive automatic daily settlements.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAccountModal(true)}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          {isConnected ? 'Manage Payment Account' : 'Connect Account'}
        </button>
      </div>

      {/* 2. Settlement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Settled Payouts
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalSettled.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Disbursed to bank</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Processing Payouts
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1">
            ₹{pendingPayouts.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Online orders in transit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Pending COD to Collect
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            ₹{pendingCod.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Doorstep cash orders</span>
        </div>
      </div>

      {/* 3. Payment Reconciliation Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Payment Reconciliation History ({merchantPayments.length})
          </h3>
          <span className="text-[11px] text-stone-400">Platform fee: 2%</span>
        </div>

        {merchantPayments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            No payment transaction records yet. Orders will automatically register settlements here.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
            {merchantPayments.map((p) => (
              <div key={p.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900">Order #{p.orderId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.paymentMethod === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {p.paymentMethod} ({p.paymentStatus})
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Customer: {p.customerName} ·{' '}
                    {new Date(p.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto text-right">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Total: ₹{p.amount}</span>
                    <span className="text-[10px] text-stone-400 block">Fee: -₹{p.platformFee}</span>
                    <span className="font-black text-stone-900 text-sm">
                      Net: ₹{p.merchantAmount}
                    </span>
                  </div>

                  <div className="min-w-[90px] text-right">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.payoutStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.payoutStatus === 'PROCESSING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.payoutStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Account Configuration Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Merchant Payout Account
                </h3>
                <p className="text-xs text-stone-500">Secure Indian banking & GST details</p>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Registered Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Owner / Signatory Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-2 border-t border-stone-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                  Payout Bank Details
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Bank Account Number</label>
                    <input
                      type="password"
                      required
                      value={rawAccNumber}
                      onChange={(e) => setRawAccNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      Account numbers are securely encrypted; customers never see banking details.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="flex-1 py-2.5 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Verify &amp; Save Payout Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
