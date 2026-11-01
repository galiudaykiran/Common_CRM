import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  Search,
  Clock,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { diningApi, PublicDiningMenu, Dish } from '../../../api/diningApi';

export const PublicQrMenuPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [menu, setMenu] = useState<PublicDiningMenu | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrToken) return;

    diningApi
      .getPublicMenu(qrToken)
      .then((data) => {
        setMenu(data);
        if (data.categories && data.categories.length > 0) {
          setSelectedCategoryId(data.categories[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load menu for QR token', err);
        setError('This QR code is invalid or the table configuration has expired.');
      })
      .finally(() => setLoading(false));
  }, [qrToken]);

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
              fontWeight: 800,
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
              fontWeight: 800,
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
              fontWeight: 800,
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
              fontWeight: 800,
            }}
          >
            VEGAN
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '1rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Loading Restaurant Menu...</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Fetching the freshest dishes directly from our kitchen.
          </p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            border: '1px solid #334155',
          }}
        >
          <AlertTriangle size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Menu Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
            {error || 'The table QR code seems to be outdated. Please ask your server for assistance.'}
          </p>
        </div>
      </div>
    );
  }

  // Filter dishes
  const filteredDishes = (menu.dishes || []).filter((d) => {
    if (selectedCategoryId !== null && d.categoryId !== selectedCategoryId) {
      return false;
    }
    if (dietaryFilter !== 'ALL' && d.dietaryType !== dietaryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchDesc = d.description ? d.description.toLowerCase().includes(q) : false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
          padding: '1.5rem 1.25rem 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                DIGITAL DINING MENU
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0', color: '#ffffff' }}>
                {menu.shopName}
              </h1>
            </div>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 12px',
                borderRadius: '8px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                {menu.areaName || 'Floor'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>
                Table {menu.tableNumber}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search dishes, drinks, appetizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem 0.6rem 2.4rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Dietary Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['ALL', 'VEG', 'NON_VEG', 'EGG'].map((d) => (
              <button
                key={d}
                onClick={() => setDietaryFilter(d)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: 'none',
                  background: dietaryFilter === d ? '#10b981' : '#1e293b',
                  color: dietaryFilter === d ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {d === 'ALL' ? 'All Dishes' : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        {/* Category Horizontal Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: selectedCategoryId === null ? '1px solid #10b981' : '1px solid #334155',
              background: selectedCategoryId === null ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
              color: selectedCategoryId === null ? '#10b981' : '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Full Menu
          </button>

          {menu.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '8px',
                border: selectedCategoryId === c.id ? '1px solid #10b981' : '1px solid #334155',
                background: selectedCategoryId === c.id ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                color: selectedCategoryId === c.id ? '#10b981' : '#e2e8f0',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Dishes List */}
        {filteredDishes.length === 0 ? (
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              border: '1px dashed #334155',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: '#94a3b8',
            }}
          >
            <UtensilsCrossed size={40} style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              No dishes found in this section
            </h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
              Try selecting another category or clearing your search filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {filteredDishes.map((dish) => {
              const isAvailable = dish.availabilityStatus === 'AVAILABLE';
              return (
                <div
                  key={dish.id}
                  style={{
                    background: '#131c2e',
                    border: '1px solid #233148',
                    borderRadius: '12px',
                    padding: '1.15rem',
                    opacity: isAvailable ? 1 : 0.65,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getDietaryBadge(dish.dietaryType)}
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {dish.categoryName || 'Chef Special'}
                      </span>
                    </div>

                    {!isAvailable && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                        }}
                      >
                        {dish.availabilityStatus.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      {dish.name}
                    </h3>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                      ₹{Number(dish.basePrice).toFixed(2)}
                    </div>
                  </div>

                  {dish.description && (
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.4 }}>
                      {dish.description}
                    </p>
                  )}

                  {/* Variants */}
                  {dish.variants && dish.variants.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {dish.variants.map((v, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            fontSize: '0.75rem',
                            color: '#e2e8f0',
                          }}
                        >
                          {v.name}: <strong style={{ color: '#10b981' }}>₹{Number(v.price).toFixed(2)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add-ons */}
                  {dish.addons && dish.addons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                      {dish.addons.map((a, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            fontSize: '0.72rem',
                            color: '#93c5fd',
                          }}
                        >
                          +{a.name} (₹{Number(a.price).toFixed(2)})
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#64748b', marginTop: '0.6rem' }}>
                    <Clock size={12} /> Prep time: ~{dish.preparationTimeMinutes || 15} minutes
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem 1.5rem', color: '#64748b', fontSize: '0.75rem' }}>
          <div>Powered by Common CRM Dining Engine</div>
          <div style={{ marginTop: '0.2rem' }}>Please inform your server of any dietary allergies.</div>
        </div>
      </div>
    </div>
  );
};
