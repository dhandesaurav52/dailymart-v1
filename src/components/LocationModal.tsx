import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, X, Check, Search, ShieldCheck } from 'lucide-react';
import { POPULAR_DELIVERY_LOCATIONS } from '../lib/geo';
import { UserLocation } from '../types';

export const LocationModal: React.FC = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    userLocation,
    updateLocation,
    detectCurrentLocation,
    isDetectingLocation,
  } = useApp();

  const [customAddress, setCustomAddress] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleSelectPopular = (loc: UserLocation) => {
    updateLocation(loc);
    setIsLocationModalOpen(false);
  };

  const handleGpsDetect = async () => {
    const success = await detectCurrentLocation();
    if (!success) {
      alert(
        'Unable to retrieve GPS coordinates. Please select one of the popular delivery areas below or enter your address.'
      );
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;

    // Default to approximate coordinates near Bangalore / Metro if custom
    const newLoc: UserLocation = {
      address: customAddress.trim(),
      area: customArea.trim() || 'My Delivery Address',
      city: customCity.trim() || 'Bengaluru',
      lat: userLocation.lat,
      lng: userLocation.lng,
      isCustom: true,
    };
    updateLocation(newLoc);
    setIsLocationModalOpen(false);
    setShowCustomForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Choose Delivery Location</h3>
            <p className="text-xs text-stone-500">Discover grocery shops within 12 km</p>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* GPS Auto-detect */}
          <button
            onClick={handleGpsDetect}
            disabled={isDetectingLocation}
            className="w-full py-3 px-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold flex items-center justify-center gap-2.5 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Navigation className={`w-5 h-5 text-emerald-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Locating your address...' : 'Use Current Location (GPS)'}</span>
          </button>

          {/* 12 km notice */}
          <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>DailyMart automatically filters shops within 12 km of your chosen address.</span>
          </div>

          {/* Popular Areas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Popular Localities
            </h4>
            <div className="space-y-1.5">
              {POPULAR_DELIVERY_LOCATIONS.map((loc) => {
                const isSelected =
                  userLocation.lat === loc.lat && userLocation.lng === loc.lng;
                return (
                  <button
                    key={loc.area}
                    onClick={() => handleSelectPopular(loc)}
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-sm font-bold text-stone-900">{loc.area}</div>
                        <div className="text-xs text-stone-500">{loc.address}, {loc.city}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Address Input */}
          <div className="pt-2 border-t border-stone-100">
            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full py-2.5 text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                + Enter custom address or landmark
              </button>
            ) : (
              <form onSubmit={handleSaveCustom} className="space-y-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <h5 className="text-xs font-bold text-stone-800">Enter Address</h5>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No, Street or Colony"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Area / Locality"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className="text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-white rounded-lg border border-stone-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
