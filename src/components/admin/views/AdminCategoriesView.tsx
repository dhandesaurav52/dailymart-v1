import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Layers,
} from 'lucide-react';
import { Category } from '../../../types';

export const AdminCategoriesView: React.FC = () => {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('🛒');
  const [catImage, setCatImage] = useState('');
  const [catOrder, setCatOrder] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatIcon('🛒');
    setCatImage('https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80');
    setCatOrder(categories.length + 1);
    setShowAddModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatIcon(cat.icon || '🛒');
    setCatImage(cat.image || '');
    setCatOrder(cat.displayOrder || 1);
    setShowAddModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    setIsProcessing(true);

    const slug =
      catSlug.trim() ||
      catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: catName.trim(),
        slug,
        icon: catIcon,
        image: catImage,
        displayOrder: catOrder,
      });
    } else {
      await createCategory({
        name: catName.trim(),
        slug,
        icon: catIcon,
        image: catImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        displayOrder: catOrder,
        isActive: true,
      });
    }

    setIsProcessing(false);
    setShowAddModal(false);
  };

  const handleToggleActive = async (cat: Category) => {
    await updateCategory(cat.id, { isActive: !cat.isActive });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Marketplace Categories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Define global product categories and customer browsing taxonomy
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
              cat.isActive
                ? 'border-stone-200'
                : 'border-stone-200 opacity-60 bg-stone-50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2 bg-stone-100 rounded-xl">
                  {cat.icon || '🛒'}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    cat.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-200 text-stone-600 border-stone-300'
                  }`}
                >
                  {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-stone-900">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                  slug: {cat.slug} · Order #{cat.displayOrder}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleActive(cat)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {cat.isActive ? 'Deactivate' : 'Activate'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dairy & Bakery"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. dairy-bakery (auto-generated if empty)"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Emoji / Icon
                  </label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isProcessing || !catName.trim()}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
