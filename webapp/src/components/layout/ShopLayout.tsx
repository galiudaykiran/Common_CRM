import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopOwnerApi } from '../../api/shopOwnerApi';
import { ShopOwnerDashboard, ShopBasicInfo } from '../../types';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  Sun,
  Moon,
  ScanBarcode,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ShopLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState<ShopBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = Boolean(user?.roles?.some((r) => r === 'SHOP_OWNER' || r === 'PLATFORM_ADMIN'));

  useEffect(() => {
    shopOwnerApi.getInfo()
      .then((data) => setStoreInfo(data))
      .catch((err) => {
        console.error('Failed to load shop details', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const enabledCodes = new Set((storeInfo?.enabledModuleCodes || []).map((c) => c.toUpperCase()));

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    always?: boolean;
    module?: string;
    ownerOnly?: boolean;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  // Dynamic modules navigation configuration with strict Owner vs Staff control
  const navSections: NavSection[] = [
    {
      title: 'Store Operations',
      items: [
        { to: '/shop/dashboard', label: 'Dashboard', icon: LayoutDashboard, always: true, ownerOnly: true },
        { to: '/shop/profile', label: 'Store Profile & Tax', icon: Store, always: true, ownerOnly: true },
      ],
    },
    {
      title: 'Catalog & Stock',
      items: [
        { to: '/shop/products', label: 'Products Catalog', icon: Package, always: true },
        { to: '/shop/inventory', label: 'Inventory & Stock', icon: Boxes, always: true },
      ],
    },
    {
      title: 'Sales & People',
      items: [
        { to: '/shop/sales', label: 'Point of Sale & Orders', icon: ShoppingCart, module: 'SALES' },
        { to: '/shop/customers', label: 'Customer Directory', icon: Users, module: 'CUSTOMERS' },
        { to: '/shop/employees', label: 'Store Employees', icon: UserCheck, always: true, ownerOnly: true },
      ],
    },
    {
      title: 'Finance & Insights',
      items: [
        { to: '/shop/expenses', label: 'Store Expenses', icon: Receipt, module: 'EXPENSES', ownerOnly: true },
        { to: '/shop/reports', label: 'Business Reports', icon: BarChart3, module: 'REPORTS', ownerOnly: true },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            🏪
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h1
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                margin: 0,
              }}
              title={storeInfo?.shopName || 'Shop Holder'}
            >
              {storeInfo?.shopName || 'Store Portal'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
              <span className="shop-code-badge" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {storeInfo?.shopCode || 'STORE'}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: isOwner ? '#10b981' : '#818cf8',
                  background: isOwner ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {isOwner ? 'SHOP OWNER' : 'STORE STAFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            padding: '1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {navSections.map((sec) => {
            const visibleItems = sec.items.filter((it) => {
              if (it.ownerOnly && !isOwner) return false;
              return it.always || (it.module && enabledCodes.has(it.module));
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '0 0.75rem 0.25rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  {sec.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/shop/dashboard'}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      })}
                    >
                      <Icon size={17} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Card & Clear Logout */}
        <div
          style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                background: isOwner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isOwner ? '#10b981' : 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              <User size={18} />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  margin: 0,
                }}
              >
                {user?.fullName || (isOwner ? 'Shop Owner' : 'Store Staff')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  @{user?.username || 'user'}
                </span>
                <span style={{ fontSize: '0.65rem', color: isOwner ? '#10b981' : 'var(--accent-primary)', fontWeight: 600 }}>
                  • {isOwner ? 'Owner' : 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.55rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--danger)',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Sign out of store session"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
              {storeInfo?.shopName || 'Store Operations'}
            </h2>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {storeInfo?.shopCode || 'STORE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Building2 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Tenant: <strong>{storeInfo?.tenantName || 'Authorized Tenant'}</strong></span>
            </div>
            <span
              className={`badge ${storeInfo?.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
              style={{ fontSize: '0.75rem' }}
            >
              {storeInfo?.status || 'ACTIVE'}
            </span>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
            </button>
          </div>
        </header>

        {/* View Content */}
        <main style={{ padding: '2rem', flex: 1, minWidth: 0 }}>
          <Outlet context={{ storeInfo, reloadStoreInfo: () => shopOwnerApi.getInfo().then(setStoreInfo) }} />
        </main>
      </div>
    </div>
  );
};
