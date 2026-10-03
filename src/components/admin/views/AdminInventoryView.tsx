import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Store,
  RotateCw,
} from 'lucide-react';
import { Product } from '../../../types';

export const AdminInventoryView: React.FC = () => {
  const { products, shops, updateProductStock, updateProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK'>('ALL');

  // Compute stock health
  const outOfStockItems = useMemo(
    () => products.filter((p) => !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0)),
    [products]
  );

  const lowStockItems = useMemo(
    () =>
      products.filter(
        (p) =>
          p.inStock &&
          p.stockQuantity !== undefined &&
          p.stockQuantity > 0 &&
          p.stockQuantity <= (p.lowStockThreshold || 10)
      ),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.shopName && p.shopName.toLowerCase().includes(q));

      const matchesShop =
        selectedShopId === 'ALL' || p.shopId === selectedShopId;

      const isOut = !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0);
      const isLow =
        p.inStock &&
        p.stockQuantity !== undefined &&
        p.stockQuantity > 0 &&
        p.stockQuantity <= (p.lowStockThreshold || 10);

      let matchesStatus = true;
      if (statusFilter === 'OUT_OF_STOCK') matchesStatus = isOut;
      if (statusFilter === 'LOW_STOCK') matchesStatus = isLow;

      return matchesSearch && matchesShop && matchesStatus;
    });
  }, [products, searchQuery, selectedShopId, statusFilter]);

  const handleRestock = async (product: Product, quantity = 50) => {
    await updateProductStock(product.id, quantity, product.lowStockThreshold || 10);
    await updateProduct(product.id, { inStock: true });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Inventory & Stock Health Monitor
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time stock alerts and replenishment across all stores
          </p>
        </div>

        <div className="flex items-center gap-2">
          {outOfStockItems.length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
              🔴 {outOfStockItems.length} Out of Stock
            </span>
          )}
          {lowStockItems.length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
              ⚠️ {lowStockItems.length} Low Stock
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Total Monitored SKUs
          </p>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {products.length}
          </div>
          <span className="text-[11px] text-stone-400">
            Across {shops.length} merchants
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Out of Stock Items
          </p>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {outOfStockItems.length}
          </div>
          <span className="text-[11px] text-stone-400">
            Unavailable to customers
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Low Stock Alerts
          </p>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {lowStockItems.length}
          </div>
          <span className="text-[11px] text-stone-400">
            ≤ 10 units remaining
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          {(
            [
              { id: 'ALL', label: `All Items (${products.length})` },
              { id: 'OUT_OF_STOCK', label: `Out of Stock (${outOfStockItems.length})` },
              { id: 'LOW_STOCK', label: `Low Stock (${lowStockItems.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Stores</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Store</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((item) => {
                const isOut =
                  !item.inStock ||
                  (item.stockQuantity !== undefined && item.stockQuantity <= 0);
                const isLow =
                  item.inStock &&
                  item.stockQuantity !== undefined &&
                  item.stockQuantity > 0 &&
                  item.stockQuantity <= (item.lowStockThreshold || 10);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-stone-900">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Unit: {item.unit}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-800">
                      {item.shopName}
                    </td>

                    <td className="py-3 px-4 text-stone-600">{item.category}</td>

                    <td className="py-3 px-4 font-black text-stone-900">
                      ₹{item.price}
                    </td>

                    <td className="py-3 px-4 font-bold">
                      <span
                        className={
                          isOut
                            ? 'text-rose-600'
                            : isLow
                            ? 'text-amber-600'
                            : 'text-stone-800'
                        }
                      >
                        {item.stockQuantity !== undefined
                          ? `${item.stockQuantity} units`
                          : '50 units'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          isOut
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isOut
                          ? 'OUT OF STOCK'
                          : isLow
                          ? 'LOW STOCK'
                          : 'OPTIMAL'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isOut || isLow ? (
                        <button
                          onClick={() => handleRestock(item, 50)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +50 Units
                        </button>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
