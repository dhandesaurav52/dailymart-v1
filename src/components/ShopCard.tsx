import React from 'react';
import { Shop } from '../types';
import { useApp } from '../context/AppContext';
import { Star, MapPin, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { formatDistance } from '../lib/geo';

interface ShopCardProps {
  shop: Shop;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const { setActiveShopId, setCurrentTab } = useApp();

  const handleCardClick = () => {
    setActiveShopId(shop.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row ${
        !shop.isOpen ? 'opacity-75' : ''
      }`}
    >
      {/* Shop Image / Thumbnail */}
      <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-stone-100 overflow-hidden">
        <img
          src={shop.image}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Status indicator on image */}
        <div className="absolute top-2.5 left-2.5">
          {shop.isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-xs text-[11px] font-bold text-emerald-300 tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Open Now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[11px] font-bold text-rose-300 tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Closed
            </span>
          )}
        </div>

        {/* Distance on Image (Mobile) */}
        {shop.distanceKm !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{formatDistance(shop.distanceKm)}</span>
          </div>
        )}
      </div>

      {/* Shop Information Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: Name & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg group-hover:text-emerald-700 transition-colors line-clamp-1">
              {shop.name}
            </h3>
            {shop.rating > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{shop.rating.toFixed(1)}</span>
                <span className="text-[10px] text-stone-400 font-normal">({shop.totalRatings})</span>
              </div>
            )}
          </div>

          {/* Category / Subtitle */}
          <p className="text-xs font-medium text-stone-500 mt-0.5 line-clamp-1">
            {shop.category}
          </p>

          {/* Metadata Row: Unboxed clean text with bullet separators */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-stone-600 mt-2 font-medium">
            <div className="flex items-center gap-1 text-stone-700">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{shop.estimatedDeliveryTime}</span>
            </div>
            <span className="text-stone-300">·</span>
            <span>
              {shop.deliveryFee === 0 ? (
                <strong className="text-emerald-700">Free Delivery</strong>
              ) : (
                `₹${shop.deliveryFee} Delivery`
              )}
            </span>
            {shop.minOrder > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span>Min ₹{shop.minOrder}</span>
              </>
            )}
          </div>

          {/* Short Address */}
          <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">
            {shop.address}, {shop.city}
          </p>
        </div>

        {/* Footer Action */}
        <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            {shop.tags && shop.tags.slice(0, 2).map((tag, idx) => (
              <span key={tag} className="text-stone-500">
                {tag}{idx < Math.min(shop.tags.length, 2) - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
            <span>View Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
