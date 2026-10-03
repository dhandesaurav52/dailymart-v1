import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ShopCard } from '../ShopCard';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { formatDistance } from '../../lib/geo';

export const HomeView: React.FC = () => {
  const {
    nearbyShops,
    products,
    userLocation,
    setIsLocationModalOpen,
    setActiveShopId,
    setCurrentTab,
    isLoadingData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'open' | 'fastest' | 'topRated'>('all');

  // Filter nearby shops based on search & filter type
  const filteredShops = useMemo(() => {
    let result = [...nearbyShops];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Secondary filters
    if (filterType === 'open') {
      result = result.filter((s) => s.isOpen);
    } else if (filterType === 'fastest') {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (filterType === 'topRated') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [nearbyShops, searchQuery, filterType]);

  // Product search matches across nearby shops
  const productMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];

    const q = searchQuery.toLowerCase().trim();
    // Find products matching query in shops that are within 12km
    const nearbyShopIds = new Set(nearbyShops.map((s) => s.id));

    return products
      .filter((p) => nearbyShopIds.has(p.shopId) && (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ))
      .slice(0, 6)
      .map((p) => {
        const shop = nearbyShops.find((s) => s.id === p.shopId);
        return {
          product: p,
          shop,
        };
      });
  }, [searchQuery, products, nearbyShops]);

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 pt-3 space-y-5">
      {/* 1. Top Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
          <input
            id="marketplace-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shops, groceries, or essentials..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Product Matches Search Dropdown (if user is searching for a product like "Rice" or "Milk") */}
      {searchQuery.trim().length >= 2 && productMatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Items available at nearby shops:</span>
            </h4>
            <span className="text-[11px] text-stone-500">
              {productMatches.length} results
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {productMatches.map(({ product, shop }) => (
              <div
                key={product.id}
                onClick={() => {
                  if (shop) {
                    setActiveShopId(shop.id);
                  }
                }}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-stone-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-md bg-stone-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {shop?.name} ·{' '}
                      <span className="text-emerald-700 font-semibold">
                        {shop?.distanceKm !== undefined ? formatDistance(shop.distanceKm) : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-stone-900">
                    ₹{product.price}
                  </div>
                  <div className="text-[10px] text-stone-400 line-through">
                    ₹{product.mrp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Section Header: Shops Near You & Radius Badge */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Shops near you</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
              <span>Showing shops within 12 km</span>
              <span>·</span>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{userLocation.area}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('shops')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>See All ({nearbyShops.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills (Interactive Segmented Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              filterType === 'all'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Nearby ({nearbyShops.length})
          </button>
          <button
            onClick={() => setFilterType('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              filterType === 'open'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Open Now
          </button>
          <button
            onClick={() => setFilterType('fastest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              filterType === 'fastest'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Nearest First
          </button>
          <button
            onClick={() => setFilterType('topRated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              filterType === 'topRated'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      {/* 4. Nearby Shop Cards List */}
      {isLoadingData ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse flex flex-col sm:flex-row gap-4"
            >
              <div className="w-full sm:w-48 h-36 bg-stone-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-5 bg-stone-200 rounded-md w-3/4" />
                <div className="h-3 bg-stone-100 rounded-md w-1/2" />
                <div className="h-3 bg-stone-100 rounded-md w-2/3" />
                <div className="h-8 bg-stone-100 rounded-md w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-stone-900">
              No shops found within 12 km
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              There are currently no active grocery merchants within 12 km of{' '}
              <strong className="text-stone-700">{userLocation.address}</strong>.
            </p>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Choose another location</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}

      {/* 5. Marketplace Features & Trust Highlights (Placed BELOW Shop Discovery) */}
      <div className="pt-4 border-t border-stone-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
          Why Order With DailyMart
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">12 km Radius</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Hyper-local shops only</p>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">20–35 Mins</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Fast direct delivery</p>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">Local Kiranas</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Direct merchant support</p>
          </div>
        </div>
      </div>
    </div>
  );
};
