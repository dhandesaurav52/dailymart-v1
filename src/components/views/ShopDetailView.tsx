import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { formatDistance } from '../../lib/geo';

export const ShopDetailView: React.FC = () => {
  const {
    activeShop,
    setActiveShopId,
    getProductsForShop,
    cart,
    addToCart,
    updateQuantity,
    setCurrentTab,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!activeShop) {
    return (
      <div className="p-8 text-center">
        <p className="text-stone-500">Shop not found.</p>
        <button
          onClick={() => setActiveShopId(null)}
          className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Shops
        </button>
      </div>
    );
  }

  // Get products ONLY belonging to this specific shop
  const shopProducts = getProductsForShop(activeShop.id);

  // Extract categories present in this shop's catalog
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    shopProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [shopProducts]);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return shopProducts.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [shopProducts, selectedCategory, search]);

  // Helper to get product count currently in cart
  const getItemQuantityInCart = (productId: string) => {
    const item = cart.items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Check if current cart belongs to this shop
  const isCartFromThisShop = cart.shopId === activeShop.id && cart.items.length > 0;
  const currentShopCartItemsCount = isCartFromThisShop
    ? cart.items.reduce((s, i) => s + i.quantity, 0)
    : 0;
  const currentShopCartTotal = isCartFromThisShop
    ? cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
    : 0;

  return (
    <div className="pb-32 max-w-4xl mx-auto px-0 sm:px-4 pt-0 sm:pt-3">
      {/* 1. Sticky Navigation Bar */}
      <div className="sticky top-12 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setActiveShopId(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 cursor-pointer p-1 -ml-1 rounded-md hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Nearby Shops</span>
        </button>

        <span className="text-xs font-bold text-stone-900 truncate max-w-[200px]">
          {activeShop.name}
        </span>
      </div>

      {/* 2. Shop Hero & Details Header */}
      <div className="bg-white border-b border-stone-200 sm:rounded-2xl sm:border p-4 sm:p-5 mt-0 sm:mt-2 space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <img
            src={activeShop.image}
            alt={activeShop.name}
            className="w-full sm:w-40 h-44 sm:h-32 object-cover rounded-xl bg-stone-100"
          />

          <div className="flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {activeShop.name}
              </h1>

              {activeShop.rating > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>{activeShop.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    ({activeShop.totalRatings})
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-stone-600">
              {activeShop.category}
            </p>

            <p className="text-xs text-stone-500 leading-relaxed">
              {activeShop.description}
            </p>

            {/* Badges & Metrics Row */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-stone-700 pt-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{formatDistance(activeShop.distanceKm)}</strong>
              </span>
              <span className="text-stone-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>{activeShop.estimatedDeliveryTime}</span>
              </span>
              <span className="text-stone-300">·</span>
              <span className="font-semibold text-emerald-700">
                {activeShop.deliveryFee === 0 ? 'Free Delivery' : `₹${activeShop.deliveryFee} Delivery`}
              </span>
              {activeShop.minOrder > 0 && (
                <>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">Min Order ₹{activeShop.minOrder}</span>
                </>
              )}
            </div>

            {/* Address & Status */}
            <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
              <span>{activeShop.address}, {activeShop.city}</span>
              {activeShop.isOpen ? (
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Accepting Orders
                </span>
              ) : (
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Products in This Shop */}
      <div className="px-4 sm:px-0 pt-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search groceries in ${activeShop.name}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 shadow-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Category Horizontal Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Products Grid */}
      <div className="px-4 sm:px-0 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
            {selectedCategory === 'All' ? 'All Shop Products' : selectedCategory} ({filteredProducts.length})
          </h2>
          <span className="text-[11px] text-stone-500">Fulfilled by {activeShop.name}</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-8 text-center space-y-2">
            <Info className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-stone-900">No items match your search</p>
            <p className="text-xs text-stone-500">Try searching for other groceries or clear the category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const qtyInCart = getItemQuantityInCart(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-stone-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {product.mrp > product.price && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                        ₹{product.mrp - product.price} OFF
                      </span>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                        {product.unit}
                      </span>
                      <h3 className="text-xs font-bold text-stone-900 mt-0.5 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Add to Cart Controls */}
                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-xs font-extrabold text-stone-900">
                          ₹{product.price}
                        </div>
                        {product.mrp > product.price && (
                          <div className="text-[10px] text-stone-400 line-through">
                            ₹{product.mrp}
                          </div>
                        )}
                      </div>

                      {/* Add Button or +/- Counter */}
                      {product.inStock ? (
                        qtyInCart === 0 ? (
                          <button
                            onClick={() => addToCart(product, 1)}
                            className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-1.5 py-1">
                            <button
                              onClick={() => updateQuantity(product.id, qtyInCart - 1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-1">{qtyInCart}</span>
                            <button
                              onClick={() => addToCart(product, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-stone-400 font-bold">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Sticky Bottom Cart Bar for this shop */}
      {isCartFromThisShop && (
        <div className="fixed bottom-14 left-0 right-0 z-30 px-4 pb-2">
          <div className="max-w-md mx-auto bg-emerald-700 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between border border-emerald-600">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold">
                  {currentShopCartItemsCount} {currentShopCartItemsCount === 1 ? 'item' : 'items'} · ₹{currentShopCartTotal}
                </p>
                <p className="text-[10px] text-emerald-200">
                  From {activeShop.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('cart')}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 text-xs font-extrabold flex items-center gap-1 shadow-sm hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
