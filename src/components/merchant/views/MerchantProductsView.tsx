import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product } from '../../../types';

interface MerchantProductsViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const MerchantProductsView: React.FC<MerchantProductsViewProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const {
    shopOwnerShop,
    getProductsForShop,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Add / Edit Modal States
  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Groceries');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState(99);
  const [formMrp, setFormMrp] = useState(120);
  const [formUnit, setFormUnit] = useState('1 kg');
  const [formStock, setFormStock] = useState(30);
  const [formThreshold, setFormThreshold] = useState(10);
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500');
  const [formInStock, setFormInStock] = useState(true);

  if (!shopOwnerShop) return null;

  const products = getProductsForShop(shopOwnerShop.id);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;

      const currentStock = p.stockQuantity ?? 20;
      const threshold = p.lowStockThreshold ?? 10;

      let matchStock = true;
      if (stockFilter === 'IN_STOCK') matchStock = currentStock > threshold;
      if (stockFilter === 'LOW_STOCK') matchStock = currentStock > 0 && currentStock <= threshold;
      if (stockFilter === 'OUT_OF_STOCK') matchStock = currentStock === 0 || !p.inStock;

      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Rice & Grains');
    setFormDesc('');
    setFormPrice(99);
    setFormMrp(120);
    setFormUnit('1 kg');
    setFormStock(25);
    setFormThreshold(10);
    setFormImage('https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500');
    setFormInStock(true);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormDesc(p.description);
    setFormPrice(p.price);
    setFormMrp(p.mrp);
    setFormUnit(p.unit);
    setFormStock(p.stockQuantity ?? 20);
    setFormThreshold(p.lowStockThreshold ?? 10);
    setFormImage(p.image);
    setFormInStock(p.inStock);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formName.trim(),
        category: formCategory.trim(),
        description: formDesc.trim(),
        price: Number(formPrice),
        mrp: Number(formMrp),
        unit: formUnit.trim(),
        stockQuantity: Number(formStock),
        lowStockThreshold: Number(formThreshold),
        image: formImage.trim(),
        inStock: Number(formStock) > 0 && formInStock,
      });
    } else {
      await addProduct({
        shopId: shopOwnerShop.id,
        shopName: shopOwnerShop.name,
        name: formName.trim(),
        category: formCategory.trim(),
        description: formDesc.trim(),
        price: Number(formPrice),
        mrp: Number(formMrp),
        unit: formUnit.trim(),
        stockQuantity: Number(formStock),
        lowStockThreshold: Number(formThreshold),
        image: formImage.trim(),
        inStock: Number(formStock) > 0 && formInStock,
        isFeatured: false,
      });
    }

    setShowModal(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            Store Grocery Inventory ({products.length})
          </h2>
          <p className="text-xs text-stone-500">
            Add items, configure selling prices, and control real-time stock
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Search & Stock Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groceries by name or description..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
              stockFilter === 'ALL'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter('IN_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
              stockFilter === 'IN_STOCK'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setStockFilter('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
              stockFilter === 'LOW_STOCK'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            Low Stock (&le;10)
          </button>
          <button
            onClick={() => setStockFilter('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
              stockFilter === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-stone-800 text-white border-stone-800'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
          No products found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const stock = p.stockQuantity ?? 20;
            const threshold = p.lowStockThreshold ?? 10;
            const isLow = stock > 0 && stock <= threshold;
            const isOut = stock === 0 || !p.inStock;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      {p.category} · {p.unit}
                    </span>
                    <h3 className="text-xs font-bold text-stone-900 line-clamp-1 mt-0.5">
                      {p.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-black text-stone-900">₹{p.price}</span>
                      {p.mrp > p.price && (
                        <span className="text-[11px] text-stone-400 line-through">₹{p.mrp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="p-2 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">
                      Stock
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-extrabold text-stone-900">{stock} units</span>
                      {isOut ? (
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateProductStock(p.id, Math.max(0, stock - 5))}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-700 font-bold text-xs hover:bg-stone-100 cursor-pointer"
                      title="Reduce stock by 5"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => updateProductStock(p.id, stock + 10)}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-700 font-bold text-xs hover:bg-stone-100 cursor-pointer"
                      title="Add 10 units"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Edit Product</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) {
                        deleteProduct(p.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Grocery Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="Rice & Grains">Rice & Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Household">Household</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Unit / Pack Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 g, 1 kg, 1 L"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formMrp}
                    onChange={(e) => setFormMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Low Stock Alert (&le;)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Essential whole wheat grain, fresh farm produce, etc."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
