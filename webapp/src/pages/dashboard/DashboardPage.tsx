import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ApiResponse, DashboardStats } from '../../types';
import {
  Store,
  Users,
  Building2,
  Tags,
  PlusCircle,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Tag,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
        <p>Loading platform telemetry and metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={36} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'Unable to retrieve stats'}</p>
        <button onClick={fetchStats} className="btn btn-secondary">Retry</button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Shops',
      value: stats.totalShops,
      subtitle: `${stats.activeShops} active, ${stats.inactiveShops} inactive`,
      icon: Store,
      color: '#6366f1',
    },
    {
      title: 'Registered Tenants',
      value: stats.totalTenants,
      subtitle: `${stats.activeTenants} active business groups`,
      icon: Building2,
      color: '#38bdf8',
    },
    {
      title: 'System Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active accounts`,
      icon: Users,
      color: '#10b981',
    },
    {
      title: 'Business Categories',
      value: stats.businessTypesCount,
      subtitle: 'Active business templates',
      icon: Tags,
      color: '#f59e0b',
    },
  ];

  return (
    <div>
      {/* Top Banner & Quick Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Platform Overview
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time multi-tenant operations, business onboarding, and audit events.
          </p>
        </div>

        <button
          onClick={() => navigate('/shops?create=true')}
          className="btn btn-primary"
        >
          <PlusCircle size={18} /> Onboard New Shop
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {kpi.title}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${kpi.color}18`,
                    border: `1px solid ${kpi.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.color,
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {kpi.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Shops + Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Shops */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recently Onboarded Shops</h3>
            </div>
            <button
              onClick={() => navigate('/shops')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.25rem' }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {stats.recentShops.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No shops onboarded yet.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentShops.map((shop) => (
                    <tr key={shop.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{shop.name}</div>
                        <span className="shop-code-badge">
                          <Tag size={10} style={{ flexShrink: 0 }} />
                          {shop.code}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {shop.businessTypeName}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${shop.status.toLowerCase()}`}>
                          {shop.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Admin Audit Activity */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--info)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Admin Activity</h3>
            </div>
            <button
              onClick={() => navigate('/audit-logs')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.25rem' }}
            >
              View Trail <ArrowUpRight size={14} />
            </button>
          </div>

          {stats.recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No activity logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentActivity.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="code-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>
                        {item.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        by <strong style={{ color: 'var(--text-primary)' }}>{item.actorUsername}</strong>
                      </span>
                    </div>
                    {item.newValue && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {item.newValue}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
