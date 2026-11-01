import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  X,
  PlusCircle,
  Tag,
  Clock,
  Sparkles,
  Layers,
  Leaf,
  Beef,
  Egg,
  Check,
} from 'lucide-react';
import {
  diningApi,
  MenuCategory,
  Dish,
  DishVariant,
  DishAddon,
} from '../../../api/diningApi';

export const DiningMenuPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    categoryId: '' as string | number,
    description: '',
    imageUrl: '',
    dietaryType: 'VEG' as 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN',
    basePrice: '' as string | number,
    preparationTimeMinutes: 15,
    taxRate: 5,
    isFeatured: false,
    displayOrder: 0,
    availabilityStatus: 'AVAILABLE',
    variants: [] as DishVariant[],
    addons: [] as DishAddon[],
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsData, dishesData] = await Promise.all([
        diningApi.getCategories(),
        diningApi.getDishes({
          categoryId: selectedCategoryId || undefined,
          dietaryType: dietaryFilter !== 'ALL' ? dietaryFilter : undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setCategories(catsData);
      setDishes(dishesData);
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, dietaryFilter, searchQuery]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Dish Modal Open
  const handleOpenDishModal = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      setDishForm({
        name: dish.name,
        categoryId: dish.categoryId || '',
        description: dish.description || '',
        imageUrl: dish.imageUrl || '',
        dietaryType: dish.dietaryType,
        basePrice: dish.basePrice,
        preparationTimeMinutes: dish.preparationTimeMinutes,
        taxRate: dish.taxRate,
        isFeatured: dish.isFeatured,
        displayOrder: dish.displayOrder,
        availabilityStatus: dish.availabilityStatus,
        variants: dish.variants ? [...dish.variants] : [],
        addons: dish.addons ? [...dish.addons] : [],
      });
    } else {
      setEditingDish(null);
      setDishForm({
        name: '',
        categoryId: selectedCategoryId || (categories.length > 0 ? categories[0].id : ''),
        description: '',
        imageUrl: '',
        dietaryType: 'VEG',
        basePrice: '',
        preparationTimeMinutes: 15,
        taxRate: 5,
        isFeatured: false,
        displayOrder: dishes.length,
        availabilityStatus: 'AVAILABLE',
        variants: [],
        addons: [],
      });
    }
    setIsDishModalOpen(true);
  };

  // Save Dish
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim() || !dishForm.basePrice) return;

    try {
      setSubmitting(true);
      const payload = {
        name: dishForm.name.trim(),
        categoryId: dishForm.categoryId ? Number(dishForm.categoryId) : undefined,
        description: dishForm.description.trim() || undefined,
        imageUrl: dishForm.imageUrl.trim() || undefined,
        dietaryType: dishForm.dietaryType,
        basePrice: Number(dishForm.basePrice),
        preparationTimeMinutes: Number(dishForm.preparationTimeMinutes),
        taxRate: Number(dishForm.taxRate),
        isFeatured: dishForm.isFeatured,
        displayOrder: Number(dishForm.displayOrder),
        availabilityStatus: dishForm.availabilityStatus,
        variants: dishForm.variants,
        addons: dishForm.addons,
      };

      if (editingDish) {
        await diningApi.updateDish(editingDish.id, payload as any);
        showNotification(`Dish '${dishForm.name}' updated`);
      } else {
        await diningApi.createDish(payload as any);
        showNotification(`Dish '${dishForm.name}' created`);
      }

      setIsDishModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving dish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDish = async (dish: Dish) => {
    if (!window.confirm(`Delete dish '${dish.name}'?`)) return;
    try {
      await diningApi.deleteDish(dish.id);
      showNotification(`Dish '${dish.name}' deleted`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting dish');
    }
  };

  // Category Modal
  const handleOpenCategoryModal = (cat?: MenuCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        displayOrder: cat.displayOrder,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        displayOrder: categories.length,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingCategory) {
        await diningApi.updateCategory(editingCategory.id, categoryForm);
        showNotification(`Category '${categoryForm.name}' updated`);
      } else {
        await diningApi.createCategory(categoryForm);
        showNotification(`Category '${categoryForm.name}' created`);
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  // Dietary Badge
  const getDietaryBadge = (type: string) => {
    switch (type) {
      case 'VEG':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            VEG
          </span>
        );
      case 'NON_VEG':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            NON-VEG
          </span>
        );
      case 'EGG':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #f59e0b',
              color: '#f59e0b',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
            EGG
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            VEGAN
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} /> {actionMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Menu & Dish Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Manage food categories, dish preparations, pricing variants, and add-ons for dine-in & QR menus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => handleOpenCategoryModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Layers size={16} /> Add Category
          </button>

          <button
            onClick={() => handleOpenDishModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Plus size={16} /> Add New Dish
          </button>
        </div>
      </div>

      {/* Filters: Category Tabs, Dietary, and Search */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Search & Dietary Select */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search dishes by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem 0.55rem 2.25rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dietary:</span>
            {['ALL', 'VEG', 'NON_VEG', 'EGG'].map((d) => (
              <button
                key={d}
                onClick={() => setDietaryFilter(d)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: dietaryFilter === d ? 'var(--accent-primary, #6366f1)' : 'var(--bg-primary)',
                  color: dietaryFilter === d ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedCategoryId === null ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
              color: selectedCategoryId === null ? '#10b981' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All Categories ({dishes.length})
          </button>

          {categories.map((c) => (
            <div key={c.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedCategoryId(c.id)}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px 0 0 8px',
                  border: 'none',
                  background: selectedCategoryId === c.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                  color: selectedCategoryId === c.id ? '#10b981' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {c.name} ({c.dishCount})
              </button>
              <button
                onClick={() => handleOpenCategoryModal(c)}
                style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: '0 8px 8px 0',
                  border: 'none',
                  borderLeft: '1px solid var(--border-subtle)',
                  background: selectedCategoryId === c.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                  color: selectedCategoryId === c.id ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <Edit size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dishes Cards Grid */}
      {dishes.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <UtensilsCrossed size={48} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No dishes found in this category
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 1.25rem' }}>
            Add dishes with descriptions, variants, and pricing to populate the digital menu.
          </p>
          <button
            onClick={() => handleOpenDishModal()}
            style={{
              padding: '0.65rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
            }}
          >
            Create Dish Now
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {dishes.map((dish) => (
            <div
              key={dish.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getDietaryBadge(dish.dietaryType)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {dish.categoryName || 'Uncategorized'}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background:
                        dish.availabilityStatus === 'AVAILABLE'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                      color:
                        dish.availabilityStatus === 'AVAILABLE' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {dish.availabilityStatus}
                  </span>
                </div>

                {/* Dish Name & Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dish.name}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    ₹{Number(dish.basePrice).toFixed(2)}
                  </div>
                </div>

                {dish.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                    {dish.description}
                  </p>
                )}

                {/* Variants List */}
                {dish.variants && dish.variants.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Variants ({dish.variants.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {dish.variants.map((v, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 6px',
                            background: 'var(--bg-primary)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {v.name}: <strong>₹{Number(v.price).toFixed(2)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addons List */}
                {dish.addons && dish.addons.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Add-ons ({dish.addons.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {dish.addons.map((a, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 6px',
                            background: 'var(--bg-primary)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          +{a.name} (₹{Number(a.price).toFixed(2)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer info & Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={13} /> Prep: ~{dish.preparationTimeMinutes || 15} mins
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleOpenDishModal(dish)}
                    title="Edit Dish"
                    style={{
                      padding: '0.4rem 0.65rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Edit size={13} /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteDish(dish)}
                    title="Delete Dish"
                    style={{
                      padding: '0.4rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD / EDIT DISH MODAL --- */}
      {isDishModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingDish ? `Edit Dish: ${editingDish.name}` : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setIsDishModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDish}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Butter Chicken, Paneer Tikka, Cold Coffee"
                    value={dishForm.name}
                    onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Category *
                  </label>
                  <select
                    value={dishForm.categoryId}
                    onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, Dietary, Prep Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="250.00"
                    value={dishForm.basePrice}
                    onChange={(e) => setDishForm({ ...dishForm, basePrice: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Dietary Classification
                  </label>
                  <select
                    value={dishForm.dietaryType}
                    onChange={(e) => setDishForm({ ...dishForm, dietaryType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="VEG">VEG (Vegetarian)</option>
                    <option value="NON_VEG">NON-VEG</option>
                    <option value="EGG">EGG (Egg-based)</option>
                    <option value="VEGAN">VEGAN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dishForm.preparationTimeMinutes}
                    onChange={(e) => setDishForm({ ...dishForm, preparationTimeMinutes: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  placeholder="Rich and creamy tomato gravy infused with butter and Indian spices..."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Variants Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Serving Variants (e.g. Half, Full, Family)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDishForm({
                        ...dishForm,
                        variants: [...dishForm.variants, { name: '', price: Number(dishForm.basePrice) || 0 }],
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary, #6366f1)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Add Variant
                  </button>
                </div>

                {dishForm.variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Variant name (e.g. Full Portion)"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...dishForm.variants];
                        updated[idx].name = e.target.value;
                        setDishForm({ ...dishForm, variants: updated });
                      }}
                      style={{
                        flex: 2,
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={v.price}
                      onChange={(e) => {
                        const updated = [...dishForm.variants];
                        updated[idx].price = Number(e.target.value);
                        setDishForm({ ...dishForm, variants: updated });
                      }}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = dishForm.variants.filter((_, i) => i !== idx);
                        setDishForm({ ...dishForm, variants: updated });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 0.5rem',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Addons Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Add-ons / Customizations (e.g. Extra Cheese, Dip)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDishForm({
                        ...dishForm,
                        addons: [...dishForm.addons, { name: '', price: 30 }],
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary, #6366f1)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Add Option
                  </button>
                </div>

                {dishForm.addons.map((a, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Addon name (e.g. Extra Butter)"
                      value={a.name}
                      onChange={(e) => {
                        const updated = [...dishForm.addons];
                        updated[idx].name = e.target.value;
                        setDishForm({ ...dishForm, addons: updated });
                      }}
                      style={{
                        flex: 2,
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Addon price (₹)"
                      value={a.price}
                      onChange={(e) => {
                        const updated = [...dishForm.addons];
                        updated[idx].price = Number(e.target.value);
                        setDishForm({ ...dishForm, addons: updated });
                      }}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = dishForm.addons.filter((_, i) => i !== idx);
                        setDishForm({ ...dishForm, addons: updated });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 0.5rem',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submitting ? 'Saving...' : editingDish ? 'Update Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT CATEGORY MODAL --- */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Menu Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Main Course, Breads, Beverages, Desserts"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh oven baked clay tandoor specialties"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
