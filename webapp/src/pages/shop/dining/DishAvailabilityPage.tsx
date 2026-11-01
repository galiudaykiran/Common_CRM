import React, { useState, useEffect } from 'react';
import {
  ToggleRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';
import {
  diningApi,
  Dish,
  MenuCategory,
} from '../../../api/diningApi';

export const DishAvailabilityPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Bulk selection
  const [selectedDishIds, setSelectedDishIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('AVAILABLE');
  const [bulkReason, setBulkReason] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, dishList] = await Promise.all([
        diningApi.getCategories(),
        diningApi.getDishes({
          categoryId: selectedCategoryId || undefined,
          availabilityStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setCategories(cats);
      setDishes(dishList);
    } catch (err) {
      console.error('Failed to load dish availability', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, statusFilter, searchQuery]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Instant Single Toggle
  const handleToggleSingle = async (dish: Dish, targetStatus: string) => {
    try {
      await diningApi.updateDishAvailability({
        dishId: dish.id,
        status: targetStatus,
        reason: targetStatus === 'AVAILABLE' ? 'Restocked by kitchen' : 'Marked out of stock',
      });
      showNotification(`${dish.name} status updated to ${targetStatus}`);
      // Optimistic update
      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, availabilityStatus: targetStatus as any } : d))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Bulk Selection
  const handleSelectAll = () => {
    if (selectedDishIds.size === dishes.length) {
      setSelectedDishIds(new Set());
    } else {
      setSelectedDishIds(new Set(dishes.map((d) => d.id)));
    }
  };

  const handleToggleSelectDish = (id: number) => {
    const next = new Set(selectedDishIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDishIds(next);
  };

  const handleApplyBulk = async () => {
    if (selectedDishIds.size === 0) return;

    try {
      setSubmitting(true);
      await diningApi.updateDishAvailability({
        dishIds: Array.from(selectedDishIds),
        status: bulkStatus,
        reason: bulkReason.trim() || `Bulk set to ${bulkStatus}`,
      });
      showNotification(`Updated ${selectedDishIds.size} dishes to ${bulkStatus}`);
      setSelectedDishIds(new Set());
      setBulkReason('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating bulk availability');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'AVAILABLE',
        };
      case 'OUT_OF_STOCK':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'OUT OF STOCK',
        };
      case 'TEMP_UNAVAILABLE':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'TEMP UNAVAILABLE',
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.15)',
          color: '#9ca3af',
          border: 'rgba(156, 163, 175, 0.3)',
          label: status,
        };
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Dish Availability Quick Board
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
          One-click instant status controls to toggle dish stock on live QR menus and waiter billing screens in real-time.
        </p>
      </div>

      {/* Bulk Action Strip */}
      {selectedDishIds.size > 0 && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
              {selectedDishIds.size} dishes selected
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Choose a target stock status to update in bulk:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="AVAILABLE">Mark AVAILABLE</option>
              <option value="OUT_OF_STOCK">Mark OUT OF STOCK</option>
              <option value="TEMP_UNAVAILABLE">Mark TEMP UNAVAILABLE</option>
            </select>

            <input
              type="text"
              placeholder="Reason (e.g. Sold out for dinner)"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '220px',
              }}
            />

            <button
              onClick={handleApplyBulk}
              disabled={submitting}
              style={{
                padding: '0.45rem 1.25rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              {submitting ? 'Applying...' : 'Apply to Selected'}
            </button>

            <button
              onClick={() => setSelectedDishIds(new Set())}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter Strip */}
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by dish name..."
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            {['ALL', 'AVAILABLE', 'OUT_OF_STOCK', 'TEMP_UNAVAILABLE'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: statusFilter === s ? 'var(--accent-primary, #6366f1)' : 'var(--bg-primary)',
                  color: statusFilter === s ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s.replace(/_/g, ' ')}
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
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedCategoryId === c.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                color: selectedCategoryId === c.id ? '#10b981' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dish Availability Grid / Table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 2fr 1fr 1fr 2fr',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            alignItems: 'center',
          }}
        >
          <div style={{ cursor: 'pointer' }} onClick={handleSelectAll}>
            {selectedDishIds.size === dishes.length && dishes.length > 0 ? (
              <CheckSquare size={16} color="#10b981" />
            ) : (
              <Square size={16} />
            )}
          </div>
          <div>Dish & Category</div>
          <div>Base Price</div>
          <div>Current Status</div>
          <div style={{ textAlign: 'right' }}>Quick 1-Click Availability</div>
        </div>

        {dishes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No dishes matching current filter criteria.
          </div>
        ) : (
          dishes.map((dish) => {
            const isSelected = selectedDishIds.has(dish.id);
            const badge = getStatusBadge(dish.availabilityStatus);
            return (
              <div
                key={dish.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 2fr 1fr 1fr 2fr',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  background: isSelected ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ cursor: 'pointer' }} onClick={() => handleToggleSelectDish(dish.id)}>
                  {isSelected ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} />}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {dish.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dish.categoryName || 'Uncategorized'} • {dish.dietaryType}
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  ₹{Number(dish.basePrice).toFixed(2)}
                </div>

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                  {dish.availabilityReason && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {dish.availabilityReason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleToggleSingle(dish, 'AVAILABLE')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: dish.availabilityStatus === 'AVAILABLE' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                      background: dish.availabilityStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                      color: '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Available
                  </button>

                  <button
                    onClick={() => handleToggleSingle(dish, 'TEMP_UNAVAILABLE')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: dish.availabilityStatus === 'TEMP_UNAVAILABLE' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                      background: dish.availabilityStatus === 'TEMP_UNAVAILABLE' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                      color: '#f59e0b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Temp Wait
                  </button>

                  <button
                    onClick={() => handleToggleSingle(dish, 'OUT_OF_STOCK')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: dish.availabilityStatus === 'OUT_OF_STOCK' ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                      background: dish.availabilityStatus === 'OUT_OF_STOCK' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-primary)',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Out of Stock
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
