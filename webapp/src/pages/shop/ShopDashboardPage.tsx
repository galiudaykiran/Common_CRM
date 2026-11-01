import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopOwnerApi } from '../../api/shopOwnerApi';
import { inventoryApi } from '../../api/inventoryApi';
import { reportsApi } from '../../api/reportsApi';
import { ShopOwnerDashboard, Category, DailyTrendPoint, AuditLogItem } from '../../types';
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
  ChevronLeft,
  TrendingUp,
  TrendingDown,
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
  Store,
  Search,
  X,
  Filter,
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

  // Store Audits Modal State & Server Pagination (default page = 0, size = 10)
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(0);
  const [auditSize] = useState(10);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditTotalElements, setAuditTotalElements] = useState(0);

  const fetchAuditLogs = async (targetPage = auditPage, query = auditSearchQuery, action = auditActionFilter) => {
    setLoadingAudits(true);
    try {
      const pageRes = await shopOwnerApi.getStoreAuditLogs({
        page: targetPage,
        size: auditSize,
        action: action === 'ALL' ? undefined : action,
        actorUsername: query.trim() || undefined,
      });
      setAuditLogsList(pageRes?.content || []);
      setAuditTotalPages(pageRes?.totalPages || 0);
      setAuditTotalElements(pageRes?.totalElements || 0);
      setAuditPage(targetPage);
    } catch (err) {
      console.error('Failed to load store audit logs', err);
      setAuditLogsList((data?.recentActivity as any) || []);
      setAuditTotalPages(1);
      setAuditTotalElements(data?.recentActivity?.length || 0);
      setAuditPage(0);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleOpenAuditsModal = () => {
    setShowAuditModal(true);
    setAuditPage(0);
    fetchAuditLogs(0, auditSearchQuery, auditActionFilter);
  };

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
        {/* Transparent Vector Background Watermark & Ambient Glow */}
        <div className="dashboard-hero-watermark" aria-hidden="true" />
        <div className="dashboard-hero-ambient-glow" aria-hidden="true" />

        <div className="dashboard-hero-left">
          <div className="dashboard-hero-icon" title="Storefront">
            <Store size={32} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="dashboard-hero-details">
            <h1>
              <span>{data.shopName || 'Nagaraju Fancy Store'}</span>
              <span className="dashboard-hero-badge">{data.shopCode || 'NAG_11'}</span>
              <span className="dashboard-status-live-pill">
                <span className="dashboard-live-dot" /> {data.status || 'ACTIVE'}
              </span>
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
          {/* Quick Store Profile Action */}
          <button
            onClick={() => navigate('/shop/profile')}
            className="dashboard-hero-quick-btn"
            title="Configure Store Profile, GST & Tax Details"
          >
            <span>Store Profile &amp; Tax</span>
            <ArrowRight size={13} />
          </button>

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
        {(() => {
          const todayRev = data.stats?.todayRevenue ?? 0;
          const yestRev = data.stats?.yesterdayRevenue ?? 0;
          const growthPct = data.stats?.revenueGrowthPercent ?? 0;
          const isUp = growthPct >= 0;
          const isNegative = growthPct < 0;
          let trendBadgeText = '~ 0%';
          if (growthPct > 0) trendBadgeText = `+${growthPct.toFixed(1)}%`;
          else if (growthPct < 0) trendBadgeText = `${growthPct.toFixed(1)}%`;
          else if (todayRev > 0 && yestRev === 0) trendBadgeText = '+100%';

          return (
            <div className="dashboard-kpi-card dashboard-kpi-revenue-card">
              <div className="dashboard-kpi-header">
                <div className="dashboard-kpi-title-wrap">
                  <div className="dashboard-kpi-icon-pill kpi-icon-revenue">
                    ₹
                  </div>
                  <span className="dashboard-kpi-title">TODAY'S REVENUE</span>
                </div>
                <span className="dashboard-kpi-filter-tag">
                  <span className="kpi-live-dot" /> Today
                </span>
              </div>

              <div className="dashboard-kpi-value-row">
                <div className="dashboard-kpi-val kpi-val-highlight">
                  {formatCurrency(todayRev)}
                </div>
                <span className={`dashboard-kpi-trend-badge ${isNegative ? 'trend-red' : 'trend-green'}`}>
                  {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trendBadgeText}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{data.stats?.todaySalesCount || 0}</strong> orders processed today
              </div>

              {/* Enhanced Sparkline with Real Responsive Glow */}
              <div className="dashboard-kpi-sparkline">
                <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="revBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="revBarFaint" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="24" width="7" height="12" rx="2" fill="url(#revBarFaint)" />
                  <rect x="11" y="26" width="7" height="10" rx="2" fill="url(#revBarFaint)" />
                  <rect x="22" y="20" width="7" height="16" rx="2" fill="url(#revBarFaint)" />
                  <rect x="33" y="28" width="7" height="8" rx="2" fill="url(#revBarFaint)" />
                  <rect x="44" y="16" width="7" height="20" rx="2" fill="url(#revBarGrad)" />
                  <rect x="55" y="12" width="7" height="24" rx="2" fill="url(#revBarGrad)" />
                  <rect x="66" y="8" width="7" height="28" rx="2" fill="url(#revBarGrad)" />
                  <rect x="77" y="18" width="7" height="18" rx="2" fill="url(#revBarGrad)" />
                  <rect x="88" y="22" width="7" height="14" rx="2" fill="url(#revBarFaint)" />
                  <rect x="99" y="10" width="7" height="26" rx="2" fill="url(#revBarGrad)" />
                  <rect x="110" y="6" width="7" height="30" rx="2" fill="url(#revBarGrad)" />
                  <rect x="121" y="14" width="7" height="22" rx="2" fill="url(#revBarGrad)" />
                  <rect x="132" y="20" width="7" height="16" rx="2" fill="url(#revBarFaint)" />
                  <rect x="143" y="12" width="7" height="24" rx="2" fill="url(#revBarGrad)" />
                </svg>
              </div>
            </div>
          );
        })()}

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
              onClick={handleOpenAuditsModal}
              className="dashboard-kpi-sublink"
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
              title="View all chronological store audit records"
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, marginLeft: '6px' }}>
                        {c.count} ({c.pct}%)
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No categories recorded yet
                </div>
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
            <span className="dashboard-kpi-filter-tag">Today</span>
          </div>

          <div className="insights-tiles-grid">
            {/* Tile 1 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <Coins size={13} style={{ color: '#10b981' }} />
                <span>Today Revenue</span>
              </div>
              <div className="insight-tile-val">
                ₹{Number(data?.stats?.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', padding: '1px 5px' }}>
                Live
              </span>
            </div>

            {/* Tile 2 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <ShoppingCart size={13} style={{ color: '#6366f1' }} />
                <span>Today Orders</span>
              </div>
              <div className="insight-tile-val">{data?.stats?.todaySalesCount || 0}</div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {data?.stats?.todaySalesCount || 0} completed
              </span>
            </div>

            {/* Tile 3 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <AlertTriangle size={13} style={{ color: (data?.stats?.lowStockCount || 0) > 0 ? '#ef4444' : '#10b981' }} />
                <span>Low Stock Items</span>
              </div>
              <div className="insight-tile-val" style={{ color: (data?.stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                {data?.stats?.lowStockCount || 0}
              </div>
              <span style={{ fontSize: '0.62rem', color: (data?.stats?.lowStockCount || 0) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                {(data?.stats?.lowStockCount || 0) > 0 ? 'Reorder now' : 'Stock Optimal'}
              </span>
            </div>

            {/* Tile 4 */}
            <div className="insight-tile">
              <div className="insight-tile-label">
                <Users size={13} style={{ color: '#0284c7' }} />
                <span>Active Staff</span>
              </div>
              <div className="insight-tile-val">{data?.stats?.activeEmployees || 0}</div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {data?.stats?.activeEmployees || 0} on duty
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          STORE AUDIT & ACTIVITY TRAIL MODAL (VIEW ALL AUDITS)
          ===================================================================== */}
      {showAuditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
          onClick={() => setShowAuditModal(false)}
        >
          <div
            style={{
              width: '900px',
              maxWidth: '96vw',
              maxHeight: '88vh',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Store Audit &amp; Activity Ledger
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Chronological zero-trust audit trail of store operations and staff activities
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="btn-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Strip */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: 'var(--bg-primary)',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  placeholder="Search by username, action, or description..."
                  value={auditSearchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setAuditSearchQuery(q);
                    fetchAuditLogs(0, q, auditActionFilter);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.8rem 0.45rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'LOGIN', 'EXPENSE', 'PRODUCT', 'INVENTORY', 'BILL'].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setAuditActionFilter(f);
                      fetchAuditLogs(0, auditSearchQuery, f);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: auditActionFilter === f ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: auditActionFilter === f ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                      color: auditActionFilter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs List Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1rem' }}>
              {loadingAudits ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                  Loading store audit records...
                </div>
              ) : auditLogsList.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Shield size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No audit events found</div>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Try adjusting your search query or filters.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Timestamp</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Actor</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Action</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Details / Change</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogsList.map((log, idx) => {
                      const isLogin = (log.action || '').includes('LOGIN');
                      const isExpense = (log.action || '').includes('EXPENSE');
                      const isProduct = (log.action || '').includes('PRODUCT') || (log.action || '').includes('STOCK');
                      const badgeColor = isLogin ? '#6366f1' : isExpense ? '#f59e0b' : isProduct ? '#10b981' : '#0284c7';
                      const badgeBg = isLogin ? 'rgba(99, 102, 241, 0.12)' : isExpense ? 'rgba(245, 158, 11, 0.12)' : isProduct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.12)';

                      return (
                        <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem' }}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            @{log.actorUsername || 'system'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: badgeBg, color: badgeColor, fontSize: '0.68rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-primary)', maxWidth: '360px', wordBreak: 'break-word' }}>
                            {log.newValue || log.resourceType || '—'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer with Pagination Controls */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>
                  Showing {auditLogsList.length} of <strong>{auditTotalElements}</strong> records
                  {auditTotalPages > 1 && ` (Page ${auditPage + 1} of ${auditTotalPages})`}
                </span>
              </div>

              {/* Server Pagination Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {auditTotalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      disabled={auditPage === 0 || loadingAudits}
                      onClick={() => fetchAuditLogs(auditPage - 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                      title="Previous Page"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    {Array.from({ length: Math.min(5, auditTotalPages) }, (_, i) => {
                      let p = i;
                      if (auditTotalPages > 5) {
                        if (auditPage >= 3 && auditPage <= auditTotalPages - 3) {
                          p = auditPage - 2 + i;
                        } else if (auditPage > auditTotalPages - 3) {
                          p = auditTotalPages - 5 + i;
                        }
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => fetchAuditLogs(p)}
                          className={`btn btn-sm ${auditPage === p ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: auditPage === p ? 700 : 500,
                            minWidth: '28px',
                          }}
                        >
                          {p + 1}
                        </button>
                      );
                    })}
                    <button
                      disabled={auditPage >= auditTotalPages - 1 || loadingAudits}
                      onClick={() => fetchAuditLogs(auditPage + 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                      title="Next Page"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.76rem' }}
                >
                  Close Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
