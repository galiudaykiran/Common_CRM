import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopOwnerApi } from '../../api/shopOwnerApi';
import { ShopOwnerDashboard } from '../../types';
import {
  Store,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  Boxes,
} from 'lucide-react';

export const ShopDashboardPage: React.FC = () => {
  const [data, setData] = useState<ShopOwnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await shopOwnerApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load store dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading store dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Unable to load store information.</p>
        <button onClick={loadData} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const enabledModulesCount = (data.modules || []).filter((m) => m.enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Store Greeting and Quick Controls */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              flexShrink: 0,
            }}
          >
            🏪
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                {data.shopName}
              </h1>
              <span className="shop-code-badge">{data.shopCode}</span>
              <span className="badge badge-primary">{data.businessTypeName}</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                marginTop: '0.35rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              {data.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
                  {data.phone}
                </span>
              )}
              {data.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} style={{ color: 'var(--accent-primary)' }} />
                  {data.city}, {data.state}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
                Currency: <strong>{data.currency}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/shop/profile')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Store size={14} />
            <span>Store Profile & Tax</span>
          </button>
        </div>
      </div>

      {/* Quick Action Operations Station */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Quick Store Shortcuts:</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/shop/products')} className="btn btn-outline btn-sm">
            <Package size={14} /> Catalog Products
          </button>
          <button onClick={() => navigate('/shop/inventory')} className="btn btn-outline btn-sm">
            <Boxes size={14} /> Inventory & Stock
          </button>
          <button onClick={() => navigate('/shop/employees')} className="btn btn-outline btn-sm">
            <Users size={14} /> Team & Employees
          </button>
          <button onClick={() => navigate('/shop/profile')} className="btn btn-outline btn-sm">
            <Store size={14} /> Store Settings
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="saas-stat-grid">
        {/* Today's Sales */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Today's Revenue</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="saas-stat-value">₹{data.stats.todayRevenue.toFixed(2)}</div>
          <div className="saas-stat-footer">
            <span>{data.stats.todaySalesCount} orders processed today</span>
          </div>
        </div>

        {/* Total Products */}
        <div
          className="saas-stat-card"
          onClick={() => navigate('/shop/products')}
          style={{ cursor: 'pointer' }}
          title="Click to view Products Catalog"
        >
          <div className="saas-stat-top">
            <span className="saas-stat-label">Catalog Products</span>
            <div className="saas-stat-icon-wrap">
              <Package size={20} />
            </div>
          </div>
          <div className="saas-stat-value">{data.stats.totalProducts}</div>
          <div className="saas-stat-footer" style={{ color: 'var(--accent-primary)' }}>
            <span>Active SKUs in catalog →</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className="saas-stat-card"
          onClick={() => navigate('/shop/inventory')}
          style={{ cursor: 'pointer' }}
          title="Click to view Inventory Stock & Alerts"
        >
          <div className="saas-stat-top">
            <span className="saas-stat-label">Low Stock Alerts</span>
            <div
              className="saas-stat-icon-wrap"
              style={{
                background: data.stats.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: data.stats.lowStockCount > 0 ? 'var(--danger)' : '#10b981',
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div
            className="saas-stat-value"
            style={{ color: data.stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}
          >
            {data.stats.lowStockCount}
          </div>
          <div className="saas-stat-footer">
            <span style={{ color: data.stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {data.stats.lowStockCount > 0 ? '⚠️ Items below reorder point →' : 'All items sufficiently stocked →'}
            </span>
          </div>
        </div>

        {/* Active Staff */}
        <div
          className="saas-stat-card"
          onClick={() => navigate('/shop/employees')}
          style={{ cursor: 'pointer' }}
          title="Click to view Store Employees"
        >
          <div className="saas-stat-top">
            <span className="saas-stat-label">Store Staff</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="saas-stat-value">{data.stats.activeEmployees}</div>
          <div className="saas-stat-footer">
            <span>Active team members assigned →</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Enabled Business Modules & Tenant Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Enabled Business Modules */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Store Business Modules
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                Modules enabled by Platform Admin for this store
              </p>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {enabledModulesCount} Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(data.modules || []).map((m) => (
              <div
                key={m.moduleId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: m.enabled ? 'var(--bg-primary)' : 'rgba(0,0,0,0.02)',
                  border: m.enabled ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                  opacity: m.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: m.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: m.enabled ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    <Layers size={16} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.name}
                      </span>
                      {m.core && (
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                          CORE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Code: {m.code}
                    </span>
                  </div>
                </div>

                <span className={`badge ${m.enabled ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                  {m.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Store Activity (Audit Scoped to Tenant) */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Store Audit & Activity Trail
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                Secure chronological trail of actions within your store
              </p>
            </div>
            <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
            {(!data.recentActivity || data.recentActivity.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                No recent activity recorded yet.
              </p>
            ) : (
              data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    By <strong>{log.actorUsername}</strong> • Resource: {log.resourceType} #{log.resourceId}
                  </div>
                  {log.newValue && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.newValue}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
