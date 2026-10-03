import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  MapPin,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    shops,
    setIsCheckingOut,
    setCurrentTab,
    setActiveShopId,
  } = useApp();

  const shop = shops.find((s) => s.id === cart.shopId);
  const deliveryFee = shop ? shop.deliveryFee : 25;
  const taxes = 5; // Platform & packaging fee
  const discount = 0;
  const grandTotal = cartSubtotal + deliveryFee + taxes - discount;

  if (cart.items.length === 0) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-stone-900">Your Cart is Empty</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
            Choose a nearby shop and fill your cart with fresh local groceries.
          </p>
        </div>
        <button
          onClick={() => setCurrentTab('home')}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <Store className="w-4 h-4" />
          <span>Explore Nearby Shops</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pb-36 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900">Your Cart</h2>
          <p className="text-xs text-stone-500">Items from single fulfilling shop</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Fulfilling Shop Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Ordering From
            </span>
            <h3 className="text-sm font-extrabold text-stone-900">
              {cart.shopName || shop?.name || 'Local Grocery Store'}
            </h3>
            {shop && (
              <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                <span className="truncate">{shop.address}, {shop.city}</span>
              </p>
            )}
          </div>
        </div>

        {shop && (
          <button
            onClick={() => setActiveShopId(shop.id)}
            className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer pt-1"
          >
            + Add More
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
        {cart.items.map(({ product, quantity }) => (
          <div key={product.id} className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-stone-900 truncate">
                  {product.name}
                </h4>
                <p className="text-[11px] text-stone-400">
                  {product.unit} · ₹{product.price} each
                </p>
                <div className="text-xs font-extrabold text-stone-900 mt-0.5">
                  ₹{product.price * quantity}
                </div>
              </div>
            </div>

            {/* Quantity Controller & Delete */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 border border-stone-200">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white text-stone-700 hover:bg-stone-200 cursor-pointer shadow-2xs"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold px-1.5 min-w-[16px] text-center text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white text-stone-700 hover:bg-stone-200 cursor-pointer shadow-2xs"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(product.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Details Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Bill Details
        </h4>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Item Total</span>
            <span className="font-semibold text-stone-900">₹{cartSubtotal}</span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>Delivery Partner Fee</span>
            <span className="font-semibold text-stone-900">
              {deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}
            </span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>Handling & Packaging</span>
            <span className="font-semibold text-stone-900">₹{taxes}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Promotional Discount</span>
              <span>-₹{discount}</span>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-black text-stone-900">
            <span>To Pay</span>
            <span className="text-base text-emerald-700">₹{grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Delivery Assurance */}
      <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Fresh essentials handpicked & packed safely by {cart.shopName || 'your local merchant'}.</span>
      </div>

      {/* Sticky Bottom Bar with Proceed to Checkout */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <div className="text-lg font-black text-stone-900">
              ₹{grandTotal}
            </div>
          </div>

          <button
            onClick={() => setIsCheckingOut(true)}
            className="flex-1 max-w-[240px] py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
