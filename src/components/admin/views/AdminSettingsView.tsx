import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Percent,
  MapPin,
  Clock,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { PlatformSettings } from '../../../types';

export const AdminSettingsView: React.FC = () => {
  const { platformSettings, updatePlatformSettings } = useApp();

  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: platformSettings.platformName || 'DailyMart',
    supportEmail: platformSettings.supportEmail || 'support@dailymart.in',
    supportPhone: platformSettings.supportPhone || '+91 80 4567 8900',
    defaultDeliveryRadiusKm: platformSettings.defaultDeliveryRadiusKm || 12,
    defaultCommissionRate: platformSettings.defaultCommissionRate || 5,
    defaultDeliveryFee: platformSettings.defaultDeliveryFee || 25,
    minOrderAmount: platformSettings.minOrderAmount || 99,
    isCodEnabled: platformSettings.isCodEnabled !== false,
    autoCancelTimeoutMins: platformSettings.autoCancelTimeoutMins || 15,
    updatedAt: platformSettings.updatedAt || new Date().toISOString(),
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await updatePlatformSettings(settings);
    setIsProcessing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          Platform Configuration & Marketplace Rules
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Global marketplace operating parameters, commission rules, and geographic radius limits
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Platform configuration updated and propagated to Firestore!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketplace Identity */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Marketplace Identity & Support</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) =>
                  setSettings({ ...settings, platformName: e.target.value })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Support Helpline
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) =>
                  setSettings({ ...settings, supportPhone: e.target.value })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-bold mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Commercials & Commission */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            <span>Commission & Geographic Delivery Rules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Default Merchant Commission Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.defaultCommissionRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultCommissionRate: Number(e.target.value),
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Standard platform fee deducted per order (default 5%)
              </p>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Delivery Radius Cap (km)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.defaultDeliveryRadiusKm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultDeliveryRadiusKm: Number(e.target.value),
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Maximum search radius for nearby grocery shops (standard 12 km)
              </p>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Default Base Delivery Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settings.defaultDeliveryFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultDeliveryFee: Number(e.target.value),
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Minimum Order Basket Value (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settings.minOrderAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minOrderAmount: Number(e.target.value),
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Payment Policy & Order Timeouts */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Fulfillment Rules & Payment Controls</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <p className="font-bold text-stone-900">
                  Allow Cash on Delivery (COD)
                </p>
                <p className="text-[11px] text-stone-500">
                  When enabled, customers can pay with cash or UPI at their doorstep
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, isCodEnabled: !settings.isCodEnabled })
                }
                className="text-stone-900 cursor-pointer"
              >
                {settings.isCodEnabled ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-400" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Auto-Cancel Unaccepted Orders (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={settings.autoCancelTimeoutMins}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoCancelTimeoutMins: Number(e.target.value),
                  })
                }
                className="w-full sm:w-48 p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Auto-cancel and notify customer if a merchant does not accept within timeout
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isProcessing ? 'Saving Configuration...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
