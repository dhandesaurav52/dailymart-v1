import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Store,
  Clock,
  Truck,
  MapPin,
  Save,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { BusinessHours, DeliveryConfig, DaySchedule } from '../../../types';
import { DEFAULT_BUSINESS_HOURS, DEFAULT_DELIVERY_CONFIG } from '../../../lib/seedData';

export const MerchantSettingsView: React.FC = () => {
  const {
    shopOwnerShop,
    updateShopProfile,
    updateBusinessHours,
    updateDeliveryConfig,
    setManualShopOverride,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'hours' | 'delivery'>('profile');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Shop Profile state
  const [name, setName] = useState(shopOwnerShop?.name || '');
  const [description, setDescription] = useState(shopOwnerShop?.description || '');
  const [phone, setPhone] = useState(shopOwnerShop?.phone || '');
  const [address, setAddress] = useState(shopOwnerShop?.address || '');
  const [city, setCity] = useState(shopOwnerShop?.city || '');
  const [image, setImage] = useState(shopOwnerShop?.image || '');

  // Business Hours state
  const [hours, setHours] = useState<BusinessHours>(
    shopOwnerShop?.businessHours || DEFAULT_BUSINESS_HOURS
  );

  // Delivery Config state
  const [delivery, setDelivery] = useState<DeliveryConfig>(
    shopOwnerShop?.deliveryConfig || {
      ...DEFAULT_DELIVERY_CONFIG,
      deliveryRadius: shopOwnerShop?.deliveryRadius || 12,
      deliveryFee: shopOwnerShop?.deliveryFee || 25,
      minOrder: shopOwnerShop?.minOrder || 99,
    } as any
  );

  if (!shopOwnerShop) return null;

  const showSaveSuccess = () => {
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateShopProfile(shopOwnerShop.id, {
      name: name.trim(),
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      image: image.trim(),
    });
    showSaveSuccess();
  };

  const handleDayChange = (dayKey: keyof BusinessHours, field: keyof DaySchedule, value: any) => {
    setHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessHours(shopOwnerShop.id, hours);
    showSaveSuccess();
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDeliveryConfig(shopOwnerShop.id, delivery);
    showSaveSuccess();
  };

  const days: { key: keyof BusinessHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">
          Shop &amp; Operational Settings
        </h2>
        <p className="text-xs text-stone-500">
          Configure store profile, weekly schedule, and hyper-local delivery parameters
        </p>
      </div>

      {isSavedAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings successfully saved and synchronized with customer apps!</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Shop Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hours')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'hours'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Business Hours</span>
        </button>

        <button
          onClick={() => setActiveSubTab('delivery')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'delivery'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery Config</span>
        </button>
      </div>

      {/* 1. Shop Profile Tab */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Shop Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Description / Tagline</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
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
            <div>
              <label className="font-bold text-stone-700 block mb-1">City / Region</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Store Front Image URL</label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. Business Hours Tab */}
      {activeSubTab === 'hours' && (
        <form onSubmit={handleSaveHours} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Weekly Store Hours</h3>
              <p className="text-[11px] text-stone-500">
                DailyMart checks this schedule to automatically mark your shop open or closed
              </p>
            </div>
          </div>

          <div className="space-y-2.5 divide-y divide-stone-100">
            {days.map(({ key, label }) => {
              const day = hours[key] || { open: '08:00', close: '21:00', isClosed: false };

              return (
                <div key={key} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-28 font-bold text-stone-900 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`day-${key}`}
                      checked={!day.isClosed}
                      onChange={(e) => handleDayChange(key, 'isClosed', !e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                    <label htmlFor={`day-${key}`} className="cursor-pointer">
                      {label}
                    </label>
                  </div>

                  {!day.isClosed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Open:</span>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="p-1.5 border rounded-lg bg-stone-50 text-xs font-semibold"
                      />
                      <span className="text-stone-400">to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="p-1.5 border rounded-lg bg-stone-50 text-xs font-semibold"
                      />
                    </div>
                  ) : (
                    <span className="text-rose-600 font-bold px-3 py-1 bg-rose-50 rounded-lg">
                      Closed for the day
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Hours</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Delivery Config Tab */}
      {activeSubTab === 'delivery' && (
        <form onSubmit={handleSaveDelivery} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3.5 text-xs">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="font-bold text-stone-900 block">Offer Home Delivery</span>
              <p className="text-[11px] text-stone-500">
                Allow customers to order delivery to their doorstep
              </p>
            </div>
            <input
              type="checkbox"
              checked={delivery.isDeliveryAvailable}
              onChange={(e) => setDelivery((prev) => ({ ...prev, isDeliveryAvailable: e.target.checked }))}
              className="w-5 h-5 accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Delivery Radius (km)</label>
              <input
                type="number"
                min="1"
                max="25"
                value={delivery.deliveryRadius}
                onChange={(e) =>
                  setDelivery((prev) => ({ ...prev, deliveryRadius: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Default marketplace maximum is 12 km</span>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={delivery.deliveryFee}
                onChange={(e) =>
                  setDelivery((prev) => ({ ...prev, deliveryFee: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Free Delivery Above (₹)</label>
              <input
                type="number"
                min="0"
                value={delivery.freeDeliveryAbove}
                onChange={(e) =>
                  setDelivery((prev) => ({ ...prev, freeDeliveryAbove: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Estimated Delivery Time</label>
              <input
                type="text"
                value={delivery.estimatedDeliveryTime}
                onChange={(e) =>
                  setDelivery((prev) => ({ ...prev, estimatedDeliveryTime: e.target.value }))
                }
                placeholder="20–30 min"
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Delivery Fleet Model</label>
            <select
              value={delivery.deliveryModel}
              onChange={(e) =>
                setDelivery((prev) => ({ ...prev, deliveryModel: e.target.value as any }))
              }
              className="w-full px-3 py-2 border rounded-xl bg-white"
            >
              <option value="SELF">Self Delivery (Store Staff / Kirana Boy)</option>
              <option value="DAILYMART">DailyMart Dedicated Delivery Partner</option>
              <option value="THIRD_PARTY">Third-Party On-Demand Fleet</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
