import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Users,
  Clock,
  DollarSign,
  ChefHat,
  QrCode,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ToggleRight,
} from 'lucide-react';
import { diningApi, DiningDashboardStats, DiningTable } from '../../../api/diningApi';

export const DiningDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DiningDashboardStats | null>(null);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [statsData, tablesData] = await Promise.all([
        diningApi.getDashboard(),
        diningApi.getTables(),
      ]);
      setStats(statsData);
      setTables(tablesData);
    } catch (err) {
      console.error('Failed to load dining dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'OCCUPIED':
        return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'BILL_REQUESTED':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'CLEANING':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" />
          <span>Loading Restaurant Dining metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <UtensilsCrossed size={12} /> RESTAURANT & DINING MODULE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Dining Floor & Kitchen Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Real-time table occupancy, kitchen item workflow, and dining revenue tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => navigate('/shop/dining/orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            <PlusCircle size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Module Disabled Warning Banner */}
      {stats?.moduleEnabled === false && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#dc2626',
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Restaurant &amp; Dining Module Disabled by Administrator
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
              Today's dining revenue and new orders are paused because the DINING module is currently disabled at the admin level. Enable the module from Platform Modules or Store Details to resume active dining operations.
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Occupied Tables */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TABLES OCCUPIED</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats?.occupiedTables || 0}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
              / {stats?.totalTables || 0}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
            {stats?.availableTables || 0} tables available now
          </div>
        </div>

        {/* Active Kitchen Items */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>KITCHEN QUEUE</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChefHat size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {(stats?.preparingItems || 0) + (stats?.readyItems || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{stats?.preparingItems || 0} Preparing</span>
            {' • '}
            <span style={{ color: '#10b981', fontWeight: 700 }}>{stats?.readyItems || 0} Ready to serve</span>
          </div>
        </div>

        {/* Today's Orders */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TODAY'S ORDERS</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats?.moduleEnabled === false ? '0' : (stats?.todayOrderCount || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: stats?.moduleEnabled === false ? '#ef4444' : 'var(--text-muted)', marginTop: '0.35rem' }}>
            {stats?.moduleEnabled === false ? 'Module Inactive' : `${stats?.activeOrders || 0} ongoing active orders`}
          </div>
        </div>

        {/* Today's Revenue */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TODAY'S DINING SALES</span>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: stats?.moduleEnabled === false ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: stats?.moduleEnabled === false ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: stats?.moduleEnabled === false ? 'var(--text-muted)' : '#10b981' }}>
            ₹{stats?.moduleEnabled === false ? '0.00' : (stats?.todayDiningRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: stats?.moduleEnabled === false ? '#ef4444' : 'var(--text-muted)', marginTop: '0.35rem' }}>
            {stats?.moduleEnabled === false ? 'Module Inactive' : 'Billed & paid revenue today'}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          onClick={() => navigate('/shop/dining/tables')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <QrCode size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Tables & QR Menus</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View layouts & print QRs</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/shop/dining/menu')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Menu Catalog</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dishes, prices & variants</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/shop/dining/availability')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <ToggleRight size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dish Availability</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1-click stock status toggles</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/shop/dining/orders')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ChefHat size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Kitchen Display</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Track preparing & ready items</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/shop/dining/billing')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Receipt size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dining Billing Desk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate bills & record payment</div>
          </div>
        </div>
      </div>

      {/* Live Dining Floor Layout Preview */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Live Dining Tables Floor
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Click any table to manage session, place orders, or prepare billing.
            </p>
          </div>

          <button
            onClick={() => navigate('/shop/dining/tables')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary, #6366f1)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Manage All Tables <ArrowRight size={16} />
          </button>
        </div>

        {tables.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '8px',
            }}
          >
            <UtensilsCrossed size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No dining tables configured yet</div>
            <div style={{ fontSize: '0.85rem', margin: '0.35rem 0 1rem' }}>
              Add your dining areas and tables to start serving guests and generating digital QR menus.
            </div>
            <button
              onClick={() => navigate('/shop/dining/tables')}
              style={{
                padding: '0.6rem 1.4rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              Add Tables Now
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {tables.map((t) => {
              const style = getStatusColor(t.status);
              return (
                <div
                  key={t.id}
                  onClick={() => navigate('/shop/dining/tables')}
                  style={{
                    background: 'var(--bg-primary)',
                    border: `1px solid ${style.border}`,
                    borderRadius: '10px',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      Table {t.tableNumber}
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: style.bg,
                        color: style.text,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Area: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t.areaName || 'General'}</span> • {t.seatingCapacity} Seats
                  </div>

                  {t.status === 'OCCUPIED' && (
                    <div
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>Guest: {t.customerName || 'Walk-in'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{t.guestCount || 1} Guests seated</div>
                    </div>
                  )}

                  {t.status === 'AVAILABLE' && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.5rem' }}>
                      ✓ Ready for guests
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
