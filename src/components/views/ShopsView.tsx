import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShopCard } from '../ShopCard';
import { Search, MapPin, Compass } from 'lucide-react';

export const ShopsView: React.FC = () => {
  const { nearbyShops, userLocation, setIsLocationModalOpen } = useApp();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const allTags = ['All', 'Groceries', 'Dairy', 'Vegetables', 'Fruits', 'Supermarket', 'Snacks'];

  const filtered = nearbyShops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.category.toLowerCase().includes(search.toLowerCase()) ||
      shop.address.toLowerCase().includes(search.toLowerCase());

    const matchesTag =
      selectedTag === 'All' ||
      shop.category.toLowerCase().includes(selectedTag.toLowerCase()) ||
      (shop.tags && shop.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
          All Nearby Grocery Stores
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Within 12 km of {userLocation.area}</span>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="text-emerald-700 font-semibold underline cursor-pointer ml-1"
          >
            Change
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by store name, locality, or category..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 shadow-xs focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedTag === tag
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-stone-900">No stores match your filters</p>
          <p className="text-xs text-stone-500">Try searching for general groceries or clearing filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
};
