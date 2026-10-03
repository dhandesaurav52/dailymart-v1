import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Package,
  Search,
  Store,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { Product } from '../../../types';

export const AdminProductsView: React.FC = () => {
  const { products, shops, updateProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.shopName && p.shopName.toLowerCase().includes(q));

      const matchesShop = selectedShopId === 'ALL' || p.shopId === selectedShopId;
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && p.inStock) ||
        (stockFilter === 'OUT_OF_STOCK' && !p.inStock);

      return matchesSearch && matchesShop && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedShopId, selectedCategory, stockFilter]);

  const handleToggleProductStock = async (product: Product) => {
    await updateProduct(product.id, { inStock: !product.inStock });
  };

  const handleToggleProductActive = async (product: Product) => {
    await updateProduct(product.id, { isActive: product.isActive === false ? true : false });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Global Products Moderation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Catalog moderation across all {shops.length} merchant stores
          </p>
        </div>

        <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
          Total: {products.length} Listed Items
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products or shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Shops ({shops.length})</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock Only</option>
            <option value="OUT_OF_STOCK">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Merchant Shop</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price & MRP</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isSuspended = product.isActive === false;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-stone-900 truncate max-w-[180px]">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Unit: {product.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-stone-800 truncate max-w-[140px]">
                        {product.shopName}
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {product.category}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-black text-stone-900">
                          ₹{product.price}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[10px] text-stone-400 line-through ml-1.5">
                            ₹{product.mrp}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleProductStock(product)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border cursor-pointer ${
                            product.inStock
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {product.inStock
                            ? `In Stock (${product.stockQuantity || 50})`
                            : 'Out of Stock'}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isSuspended
                              ? 'bg-stone-100 text-stone-600 border-stone-300'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleProductActive(product)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            isSuspended
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {isSuspended ? 'Enable' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
