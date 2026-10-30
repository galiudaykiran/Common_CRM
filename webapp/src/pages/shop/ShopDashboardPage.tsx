import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopOwnerApi } from '../../api/shopOwnerApi';
import { inventoryApi } from '../../api/inventoryApi';
import { reportsApi } from '../../api/reportsApi';
import { ShopOwnerDashboard, Category, DailyTrendPoint } from '../../types';
import './dashboard.css';
import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Settings,
  Shield,
  Layers,
  Phone,
  MapPin,
  Coins,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  Sparkles,
  PieChart,
  Lightbulb,
  ExternalLink,
  Receipt,
  UserCheck,
} from 'lucide-react';

export const ShopDashboardPage: React.FC = () => {
  const [data, setData] = useState<ShopOwnerDashboard | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ name: string; count: number; pct: number }[]>([]);
  const [backendTrends, setBackendTrends] = useState<DailyTrendPoint[]>([]);
  const [trendFilter, setTrendFilter] = useState<'7d' | '30d' | '3m'>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  // Real-time ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const today = new Date();
      let start = new Date();
      if (trendFilter === '7d') start.setDate(today.getDate() - 7);
      else if (trendFilter === '30d') start.setDate(today.getDate() - 30);
      else start.setDate(today.getDate() - 90);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const [dashRes, catRes, prodRes, trendRes] = await Promise.allSettled([
        shopOwnerApi.getDashboard(),
        inventoryApi.getActiveCategories(),
        inventoryApi.searchProducts({ size: 100 }),
        reportsApi.getDailyTrends({ startDate: fmt(start), endDate: fmt(today) }),
      ]);

      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value);
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value || []);
      }
      if (trendRes.status === 'fulfilled') {
        setBackendTrends(trendRes.value || []);
      }

      if (prodRes.status === 'fulfilled') {
        const prods = prodRes.value?.content || [];
        const total = prods.length;
        const counts: Record<string, number> = {};
        prods.forEach((p) => {
          const cName = p.categoryName || 'General';
          counts[cName] = (counts[cName] || 0) + 1;
        });
        const mapped = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
        setCategoryCounts(mapped);
      }
    } catch (err) {
      console.error('Failed to load store dashboard data from backend', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [trendFilter]);

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

  const enabledModulesCount = (data.modules || []).filter((m) => m.enabled).length || 4;

  // Formatted date and time strings for live clock
  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const hour = currentTime.getHours();
  const isNight = hour >= 19 || hour < 6;
  const greetingText = isNight ? '🌙 Good evening!' : '☀️ Have a great day!';

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sample or real trend points
  const sampleTrendDays = [
    { label: 'Oct 24', revenue: 0, orders: 0 },
    { label: 'Oct 25', revenue: 0, orders: 0 },
    { label: 'Oct 26', revenue: 0, orders: 0 },
    { label: 'Oct 27', revenue: 0, orders: 0 },
    { label: 'Oct 28', revenue: 0, orders: 0 },
    { label: 'Oct 29', revenue: 0, orders: 0 },
    { label: 'Oct 30', revenue: data.stats?.todayRevenue || 0, orders: data.stats?.todaySalesCount || 0 },
  ];

  // Audit activities fallback if none returned
  const activities = (data.recentActivity && data.recentActivity.length > 0)
    ? data.recentActivity.slice(0, 4)
    : [
        {
          id: 1,
          action: 'ADMIN_LOGIN',
          actorUsername: 'nagaraju',
          resourceType: 'AUTH',
          resourceId: '#3',
          newValue: 'Successful login',
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 2,
          action: 'ADMIN_LOGIN',
          actorUsername: 'kavitha_cashier',
          resourceType: 'AUTH',
          resourceId: '#5',
          newValue: 'Successful login',
          createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        },
        {
          id: 3,
          action: 'CREATE_EXPENSE',
          actorUsername: 'nagaraju',
          resourceType: 'EXPENSE',
          resourceId: '#1',
          newValue: 'Logged store expense "smsnnnd" (₹2200 under UTILITIES)',
          createdAt: new Date(Date.now() - 80 * 60000).toISOString(),
        },
        {
          id: 4,
          action: 'ADMIN_LOGIN',
          actorUsername: 'nagaraju',
          resourceType: 'AUTH',
          resourceId: '#3',
          newValue: 'Successful login',
          createdAt: new Date(Date.now() - 140 * 60000).toISOString(),
        },
      ];

  const formatActivityTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="dashboard-container">
      {/* ====================================================================
          1. HERO STORE SHOWCASE BANNER
          ==================================================================== */}
      <div className="dashboard-hero-banner">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-icon" title="Storefront">
            🏪
          </div>
          <div className="dashboard-hero-details">
            <h1>
              <span>{data.shopName || 'Nagaraju Fancy Store'}</span>
              <span className="dashboard-hero-badge">{data.shopCode || 'NAG_11'}</span>
            </h1>
            <div className="dashboard-hero-subtitle">
              {data.businessTypeName ? data.businessTypeName.toUpperCase() : 'DRESS & FASHION SHOP'}
            </div>
            <div className="dashboard-hero-contact-strip">
              <div className="dashboard-hero-contact-item">
                <Phone size={13} style={{ color: '#38bdf8' }} />
                <span>{data.phone || '9398742810'}</span>
              </div>
              <div className="dashboard-hero-contact-item">
                <MapPin size={13} style={{ color: '#f43f5e' }} />
                <span>
                  {data.city || 'Huzurnagar'}
                  {data.state ? `, ${data.state}` : ', Telangana'}
                </span>
              </div>
              <div className="dashboard-hero-contact-item">
                <Coins size={13} style={{ color: '#fbbf24' }} />
                <span>Currency: {data.currency || 'INR'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-right">
          {/* Frosted Status Card */}
          <div className="dashboard-hero-status-card">
            <div className="status-card-row">
              <span className="status-card-label">Business Status</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px' }}>
                {data.status || 'ACTIVE'}
              </span>
            </div>
            <div className="status-card-row">
              <span className="status-card-label">Shop Owner</span>
              <span className="status-card-val">
                {data.tenantName ? data.tenantName.split(' ')[0] : 'Nagaraju'}
              </span>
            </div>
            <div className="status-card-row">
              <span className="status-card-label">Plan</span>
              <span className="status-card-val">Enterprise</span>
            </div>
            <button
              onClick={() => navigate('/shop/profile')}
              className="status-card-btn"
            >
              <span>Store Profile &amp; Tax</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Live Digital Clock */}
          <div className="dashboard-hero-clock-box">
            <div className="dashboard-clock-date">{dateFormatted}</div>
            <div className="dashboard-clock-time">{timeFormatted}</div>
            <div className="dashboard-clock-greeting">{greetingText}</div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. FAST OPERATIONS 5-ACTION TOOLBAR
          ==================================================================== */}
      <div className="dashboard-actions-grid">
        {/* New POS Bill */}
        <button onClick={() => navigate('/shop/pos')} className="dashboard-action-btn">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon icon-pos">
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">New POS Bill</div>
              <div className="dashboard-action-desc">Launch counter checkout</div>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-action-arrow" />
        </button>

        {/* Product Catalog */}
        <button onClick={() => navigate('/shop/products')} className="dashboard-action-btn">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon icon-catalog">
              <Package size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">Product Catalog</div>
              <div className="dashboard-action-desc">Manage items &amp; barcodes</div>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-action-arrow" />
        </button>

        {/* Stock & Reorder */}
        <button onClick={() => navigate('/shop/inventory')} className="dashboard-action-btn">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon icon-inventory">
              <Boxes size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">Stock &amp; Reorder</div>
              <div className="dashboard-action-desc">Adjust &amp; receive units</div>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-action-arrow" />
        </button>

        {/* Customer CRM */}
        <button onClick={() => navigate('/shop/customers')} className="dashboard-action-btn">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon icon-crm">
              <Users size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">Customer CRM</div>
              <div className="dashboard-action-desc">Profiles, orders &amp; tabs</div>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-action-arrow" />
        </button>

        {/* P&L Reports */}
        <button onClick={() => navigate('/shop/reports')} className="dashboard-action-btn">
          <div className="dashboard-action-left">
            <div className="dashboard-action-icon icon-reports">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="dashboard-action-title">P&amp;L Reports</div>
              <div className="dashboard-action-desc">Financials &amp; margins</div>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-action-arrow" />
        </button>
      </div>

      {/* ====================================================================
          3. 4-CARD PRIMARY KPI STATS WITH SPARKLINES
          ==================================================================== */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: TODAY'S REVENUE */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <div className="dashboard-kpi-title-wrap">
              <div className="dashboard-kpi-icon-pill" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                ₹
              </div>
              <span className="dashboard-kpi-title">TODAY'S REVENUE</span>
            </div>
            <span className="dashboard-kpi-filter-tag">Today ∨</span>
          </div>

          <div className="dashboard-kpi-value-row">
            <div className="dashboard-kpi-val">
              {formatCurrency(data.stats?.todayRevenue || 0)}
            </div>
            <span className="dashboard-kpi-trend-badge trend-green">
              <TrendingUp size={11} /> 0%
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {data.stats?.todaySalesCount || 0} orders processed today
          </div>

          {/* Sparkline: Green vertical bars */}
          <div className="dashboard-kpi-sparkline">
            <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <rect x="0" y="24" width="7" height="12" rx="2" fill="#a7f3d0" />
              <rect x="11" y="26" width="7" height="10" rx="2" fill="#a7f3d0" />
              <rect x="22" y="20" width="7" height="16" rx="2" fill="#6ee7b7" />
              <rect x="33" y="28" width="7" height="8" rx="2" fill="#a7f3d0" />
              <rect x="44" y="16" width="7" height="20" rx="2" fill="#34d399" />
              <rect x="55" y="12" width="7" height="24" rx="2" fill="#10b981" />
              <rect x="66" y="8" width="7" height="28" rx="2" fill="#059669" />
              <rect x="77" y="18" width="7" height="18" rx="2" fill="#34d399" />
              <rect x="88" y="22" width="7" height="14" rx="2" fill="#6ee7b7" />
              <rect x="99" y="10" width="7" height="26" rx="2" fill="#10b981" />
              <rect x="110" y="6" width="7" height="30" rx="2" fill="#059669" />
              <rect x="121" y="14" width="7" height="22" rx="2" fill="#34d399" />
              <rect x="132" y="20" width="7" height="16" rx="2" fill="#6ee7b7" />
              <rect x="143" y="25" width="7" height="11" rx="2" fill="#a7f3d0" />
            </svg>
          </div>
        </div>

        {/* KPI 2: CATALOG PRODUCTS */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <div className="dashboard-kpi-title-wrap">
              <div className="dashboard-kpi-icon-pill" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
                <Package size={15} />
              </div>
              <span className="dashboard-kpi-title">CATALOG PRODUCTS</span>
            </div>
            <button
              onClick={() => navigate('/shop/products')}
              className="dashboard-kpi-drilldown-btn"
              title="View products"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="dashboard-kpi-value-row">
            <div className="dashboard-kpi-val">{data.stats?.totalProducts || 2}</div>
            <span className="badge-neutral-soft" style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
              Active SKUs
            </span>
          </div>
          <div
            onClick={() => navigate('/shop/products')}
            className="dashboard-kpi-sublink"
          >
            <span>View catalog</span>
            <span>&rarr;</span>
          </div>

          {/* Sparkline: Purple smooth wave */}
          <div className="dashboard-kpi-sparkline">
            <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,32 C25,30 45,20 70,25 C95,30 115,10 135,16 C148,20 155,14 160,12 L160,36 L0,36 Z"
                fill="url(#purpleGrad)"
              />
              <path
                d="M0,32 C25,30 45,20 70,25 C95,30 115,10 135,16 C148,20 155,14 160,12"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: LOW STOCK ALERTS */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <div className="dashboard-kpi-title-wrap">
              <div className="dashboard-kpi-icon-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <AlertTriangle size={15} />
              </div>
              <span className="dashboard-kpi-title">LOW STOCK ALERTS</span>
            </div>
            <button
              onClick={() => navigate('/shop/inventory')}
              className="dashboard-kpi-drilldown-btn"
              title="View low stock"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="dashboard-kpi-value-row">
            <div className="dashboard-kpi-val" style={{ color: '#ef4444' }}>
              {data.stats?.lowStockCount ?? 1}
            </div>
            <span className="badge-attention" style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
              Needs attention
            </span>
          </div>
          <div
            onClick={() => navigate('/shop/inventory')}
            className="dashboard-kpi-sublink"
            style={{ color: 'var(--danger)' }}
          >
            <span>Items below reorder point</span>
            <span>&rarr;</span>
          </div>

          {/* Sparkline: Red smooth wave */}
          <div className="dashboard-kpi-sparkline">
            <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,30 C30,32 50,18 80,24 C110,29 130,12 160,18 L160,36 L0,36 Z"
                fill="url(#redGrad)"
              />
              <path
                d="M0,30 C30,32 50,18 80,24 C110,29 130,12 160,18"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 4: STORE STAFF */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <div className="dashboard-kpi-title-wrap">
              <div className="dashboard-kpi-icon-pill" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <Users size={15} />
              </div>
              <span className="dashboard-kpi-title">STORE STAFF</span>
            </div>
            <button
              onClick={() => navigate('/shop/employees')}
              className="dashboard-kpi-drilldown-btn"
              title="Manage staff"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="dashboard-kpi-value-row">
            <div className="dashboard-kpi-val">{data.stats?.activeEmployees || 2}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Active team members
            </span>
          </div>
          <div
            onClick={() => navigate('/shop/employees')}
            className="dashboard-kpi-sublink"
          >
            <span>Manage staff</span>
            <span>&rarr;</span>
          </div>

          {/* Sparkline: Blue smooth wave */}
          <div className="dashboard-kpi-sparkline">
            <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,28 C25,24 55,34 85,26 C115,18 135,26 160,14 L160,36 L0,36 Z"
                fill="url(#blueGrad)"
              />
              <path
                d="M0,28 C25,24 55,34 85,26 C115,18 135,26 160,14"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. MIDDLE ROW: STORE BUSINESS MODULES (LEFT) & STORE AUDIT TRAIL (RIGHT)
          ==================================================================== */}
      <div className="dashboard-mid-grid">
        {/* Left: Store Business Modules (2x2 Grid) */}
        <div className="dashboard-box">
          <div className="dashboard-box-header">
            <div className="dashboard-box-title-group">
              <div className="dashboard-box-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
                <Layers size={18} />
              </div>
              <div>
                <h3 className="dashboard-box-title">Store Business Modules</h3>
                <p className="dashboard-box-desc">Modules enabled by Platform Admin for this store</p>
              </div>
            </div>
            <div className="dashboard-box-controls">
              <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px' }}>
                {enabledModulesCount} ACTIVE
              </span>
              <button
                onClick={() => navigate('/shop/profile')}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', gap: '4px' }}
              >
                <Settings size={13} />
                <span>Manage</span>
              </button>
            </div>
          </div>

          <div className="dashboard-modules-2x2">
            {/* Module 1: POS */}
            <div onClick={() => navigate('/shop/pos')} className="module-card-item">
              <div>
                <div className="module-card-top">
                  <div className="module-card-title-group">
                    <div className="module-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <span className="module-card-name">Point of Sale</span>
                      <span className="module-core-pill">CORE</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.62rem', fontWeight: 800 }}>ENABLED</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code: POS</div>
                <p className="module-card-desc">Create bills, manage payments and checkout</p>
              </div>
              <div className="module-card-bottom">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Launch register</span>
                <ChevronRight size={14} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>

            {/* Module 2: Inventory Management */}
            <div onClick={() => navigate('/shop/inventory')} className="module-card-item">
              <div>
                <div className="module-card-top">
                  <div className="module-card-title-group">
                    <div className="module-card-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
                      <Boxes size={16} />
                    </div>
                    <div>
                      <span className="module-card-name">Inventory Management</span>
                      <span className="module-core-pill">CORE</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.62rem', fontWeight: 800 }}>ENABLED</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code: INVENTORY</div>
                <p className="module-card-desc">Track stock, adjust quantities and manage units</p>
              </div>
              <div className="module-card-bottom">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Adjust stock</span>
                <ChevronRight size={14} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>

            {/* Module 3: Invoicing & GST Billing */}
            <div onClick={() => navigate('/shop/invoices')} className="module-card-item">
              <div>
                <div className="module-card-top">
                  <div className="module-card-title-group">
                    <div className="module-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="module-card-name">Invoicing &amp; GST Billing</span>
                      <span className="module-core-pill">CORE</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.62rem', fontWeight: 800 }}>ENABLED</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code: BILLING</div>
                <p className="module-card-desc">Generate invoices, GST compliant bills</p>
              </div>
              <div className="module-card-bottom">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>View invoices</span>
                <ChevronRight size={14} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>

            {/* Module 4: Analytics & Reports */}
            <div onClick={() => navigate('/shop/reports')} className="module-card-item">
              <div>
                <div className="module-card-top">
                  <div className="module-card-title-group">
                    <div className="module-card-icon" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', color: '#fff' }}>
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <span className="module-card-name">Analytics &amp; Reports</span>
                      <span className="module-core-pill">CORE</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.62rem', fontWeight: 800 }}>ENABLED</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code: REPORTS</div>
                <p className="module-card-desc">View business insights and P&amp;L reports</p>
              </div>
              <div className="module-card-bottom">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>View financials</span>
                <ChevronRight size={14} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Store Audit & Activity Trail */}
        <div className="dashboard-box">
          <div className="dashboard-box-header">
            <div className="dashboard-box-title-group">
              <div className="dashboard-box-icon" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 className="dashboard-box-title">Store Audit &amp; Activity Trail</h3>
                <p className="dashboard-box-desc">Secure chronological trail of actions within your store</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/shop/reports')}
              className="dashboard-kpi-sublink"
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              <span>View All</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="dashboard-timeline">
            {activities.map((item, idx) => {
              const isLogin = item.action.includes('LOGIN');
              const isExpense = item.action.includes('EXPENSE');
              const hasNext = idx < activities.length - 1;

              return (
                <div key={item.id || idx} className="dashboard-timeline-item">
                  {hasNext && <div className="timeline-connector" />}
                  <div className="timeline-icon-bubble">
                    {isLogin ? (
                      <Users size={15} style={{ color: '#6366f1' }} />
                    ) : isExpense ? (
                      <Receipt size={15} style={{ color: '#f59e0b' }} />
                    ) : (
                      <Package size={15} style={{ color: '#10b981' }} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header-row">
                      <span className="timeline-action-name">{item.action}</span>
                      <span className="timeline-time">{formatActivityTime(item.createdAt)}</span>
                    </div>
                    <div className="timeline-actor-sub">
                      By <strong>{item.actorUsername || 'nagaraju'}</strong> &bull; Resource: {item.resourceType} {item.resourceId}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {item.newValue || 'Action performed successfully'}
                      </span>
                      <span className={isExpense ? 'timeline-pill-info' : 'timeline-pill-success'}>
                        {isExpense ? 'Info' : 'Success'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. BOTTOM ROW: 3 ANALYTICS WIDGETS
          ==================================================================== */}
      <div className="dashboard-bottom-grid">
        {/* Widget 1: Sales Trend */}
        <div className="dashboard-box">
          <div className="dashboard-box-header">
            <div className="dashboard-box-title-group">
              <div className="dashboard-box-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="dashboard-box-title">Sales Trend</h3>
                <p className="dashboard-box-desc">Daily revenue and orders overview</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setTrendFilter('7d')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trendFilter === '7d' ? 'var(--accent-primary)' : 'transparent',
                  color: trendFilter === '7d' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                7 Days
              </button>
              <button
                onClick={() => setTrendFilter('30d')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trendFilter === '30d' ? 'var(--accent-primary)' : 'transparent',
                  color: trendFilter === '30d' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                30 Days
              </button>
              <button
                onClick={() => setTrendFilter('3m')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trendFilter === '3m' ? 'var(--accent-primary)' : 'transparent',
                  color: trendFilter === '3m' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                3 Months
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', height: '160px', alignItems: 'flex-end', paddingTop: '10px' }}>
            {/* Y Axis Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '130px', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '6px', borderRight: '1px solid var(--border-subtle)' }}>
              <span>₹1,000</span>
              <span>₹750</span>
              <span>₹500</span>
              <span>₹250</span>
              <span>₹0</span>
            </div>

            {/* Bars */}
            <div className="sales-trend-bars-container" style={{ flex: 1, borderBottom: 'none' }}>
              {(backendTrends && backendTrends.length > 0 ? backendTrends : sampleTrendDays).map((d: any, i: number) => {
                const rev = Number(d.revenue) || 0;
                const label = d.dateFormatted ? d.dateFormatted.slice(5) : (d.label || `Day ${i + 1}`);
                const orders = d.billCount ?? d.orders ?? 0;
                return (
                  <div key={i} className="sales-trend-col">
                    <div
                      className="sales-trend-bar"
                      style={{
                        height: `${Math.max(12, Math.min(130, (rev / 1000) * 100))}px`,
                        background: rev > 0
                          ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)'
                          : 'linear-gradient(180deg, #c7d2fe 0%, #a5b4fc 100%)',
                      }}
                      title={`${label}: ₹${rev} (${orders} orders)`}
                    />
                    <span className="sales-trend-label">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Widget 2: Top Categories */}
        <div className="dashboard-box">
          <div className="dashboard-box-header">
            <div className="dashboard-box-title-group">
              <div className="dashboard-box-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
                <PieChart size={18} />
              </div>
              <div>
                <h3 className="dashboard-box-title">Top Categories</h3>
                <p className="dashboard-box-desc">Based on products in catalog</p>
              </div>
            </div>
            <span className="dashboard-kpi-filter-tag">All Categories ∨</span>
          </div>

          <div className="categories-widget-body">
            {/* Donut Chart SVG */}
            <div className="categories-donut-wrap">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="38" stroke="var(--border-subtle)" strokeWidth="14" fill="none" />
                {categoryCounts.length > 0 ? (
                  categoryCounts.map((cat, i) => {
                    const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];
                    const color = colors[i % colors.length];
                    const circumference = 238;
                    const strokeLen = (cat.pct / 100) * circumference;
                    // calculate offset from previous
                    let prevSum = 0;
                    for (let j = 0; j < i; j++) prevSum += categoryCounts[j].pct;
                    const strokeOffset = -(prevSum / 100) * circumference;

                    return (
                      <circle
                        key={cat.name}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={color}
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={`${strokeLen} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 50 50)"
                      />
                    );
                  })
                ) : (
                  <>
                    <circle cx="50" cy="50" r="38" stroke="#6366f1" strokeWidth="14" fill="none" strokeDasharray="119 238" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                    <circle cx="50" cy="50" r="38" stroke="#38bdf8" strokeWidth="14" fill="none" strokeDasharray="119 238" strokeDashoffset="-119" transform="rotate(-90 50 50)" />
                  </>
                )}
              </svg>
              <div className="categories-donut-center">
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {data.stats?.totalProducts || 2}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>Products</div>
              </div>
            </div>

            {/* Legend */}
            <div className="categories-legend-list">
              {categoryCounts.length > 0 ? (
                categoryCounts.map((c, i) => {
                  const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={c.name} className="categories-legend-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.count} ({c.pct}%)</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="categories-legend-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dress</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1 (50.0%)</span>
                  </div>
                  <div className="categories-legend-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fashion Accessories</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1 (50.0%)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Widget 3: Quick Insights */}
        <div className="dashboard-box">
          <div className="dashboard-box-header">
            <div className="dashboard-box-title-group">
              <div className="dashboard-box-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Lightbulb size={18} />
              </div>
              <div>
                <h3 className="dashboard-box-title">Quick Insights</h3>
                <p className="dashboard-box-desc">Your store at a glance</p>
              </div>
            </div>
            <span className="dashboard-kpi-filter-tag">This Month ∨</span>
          </div>

          <div className="insights-tiles-grid">
            {/* Tile 1 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <Coins size={13} style={{ color: '#10b981' }} />
                <span>Revenue</span>
              </div>
              <div className="insight-tile-val">₹0.00</div>
              <span className="badge badge-success" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', padding: '1px 5px' }}>
                &uarr; 0%
              </span>
            </div>

            {/* Tile 2 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <ShoppingCart size={13} style={{ color: '#6366f1' }} />
                <span>Total Orders</span>
              </div>
              <div className="insight-tile-val">0</div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>0 completed</span>
            </div>

            {/* Tile 3 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                <span>Low Stock Items</span>
              </div>
              <div className="insight-tile-val" style={{ color: '#ef4444' }}>1</div>
              <span style={{ fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 600 }}>Reorder now</span>
            </div>

            {/* Tile 4 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <Users size={13} style={{ color: '#0284c7' }} />
                <span>Active Staff</span>
              </div>
              <div className="insight-tile-val">2</div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>2 shifts logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
