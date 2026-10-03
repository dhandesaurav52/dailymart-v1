import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Boxes, AlertTriangle, CheckCircle2, XCircle, Search, Save } from 'lucide-react';

export const MerchantInventoryView: React.FC = () => {
  const { shopOwnerShop, getProductsForShop, updateProductStock } = useApp();
  const [search, setSearch] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);
  const [tempThresholdValue, setTempThresholdValue] = useState<number>(10);

  if (!shopOwnerShop) return null;

  const products = getProductsForShop(shopOwnerShop.id);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(
    (p) => (p.stockQuantity ?? 20) > 0 && (p.stockQuantity ?? 20) <= (p.lowStockThreshold ?? 10)
  ).length;

  const outOfStockCount = products.filter(
    (p) => (p.stockQuantity ?? 20) === 0 || !p.inStock
  ).length;

  const handleStartEdit = (productId: string, stock: number, threshold: number) => {
    setEditingStockId(productId);
    setTempStockValue(stock);
    setTempThresholdValue(threshold);
  };

  const handleSaveStock = async (productId: string) => {
    await updateProductStock(productId, Number(tempStockValue), Number(tempThresholdValue));
    setEditingStockId(null);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">
          Inventory & Stock Levels
        </h2>
        <p className="text-xs text-stone-500">
          Track unit quantities and configure low-stock warning thresholds
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Total Items
          </span>
          <div className="text-xl font-black text-stone-900 mt-1">{products.length}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <div className="text-xl font-black text-amber-700 mt-1">{lowStockCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Out of Stock
          </span>
          <div className="text-xl font-black text-rose-700 mt-1">{outOfStockCount}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter inventory by item name..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Inventory Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
        {filteredProducts.map((p) => {
          const stock = p.stockQuantity ?? 20;
          const threshold = p.lowStockThreshold ?? 10;
          const isLow = stock > 0 && stock <= threshold;
          const isOut = stock === 0 || !p.inStock;
          const isEditing = editingStockId === p.id;

          return (
            <div key={p.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{p.name}</h4>
                  <p className="text-[11px] text-stone-400">
                    {p.unit} · ₹{p.price}
                  </p>
                  <div className="mt-1">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3 h-3" />
                        <span>🔴 Out of Stock</span>
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        <span>🟠 Low Stock (&le;{threshold})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>🟢 In Stock</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock editor */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                {isEditing ? (
                  <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                    <div className="text-center">
                      <span className="text-[9px] text-stone-400 uppercase font-bold block">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={tempStockValue}
                        onChange={(e) => setTempStockValue(Number(e.target.value))}
                        className="w-16 px-1.5 py-1 text-xs text-center border rounded bg-white font-bold"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-stone-400 uppercase font-bold block">Threshold</span>
                      <input
                        type="number"
                        min="1"
                        value={tempThresholdValue}
                        onChange={(e) => setTempThresholdValue(Number(e.target.value))}
                        className="w-16 px-1.5 py-1 text-xs text-center border rounded bg-white font-bold"
                      />
                    </div>
                    <button
                      onClick={() => handleSaveStock(p.id)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-stone-900">{stock} units</div>
                      <span className="text-[10px] text-stone-400">Alert at &le;{threshold}</span>
                    </div>

                    <button
                      onClick={() => handleStartEdit(p.id, stock, threshold)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
