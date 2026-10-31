import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  Tags,
  Layers,
  ShieldCheck,
  LogOut,
  User,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shops', label: 'Shops & Tenants', icon: Store },
    { to: '/business-types', label: 'Business Types', icon: Tags },
    { to: '/modules', label: 'Platform Modules', icon: Layers },
    { to: '/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden', maxWidth: '100vw' }}>
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
        {/* Brand */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1rem',
            }}
          >
            Ω
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Common CRM
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.05em' }}>
              PLATFORM ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.75rem 0.5rem', letterSpacing: '0.08em' }}>
            Platform Controls
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} style={{ color: 'var(--accent-primary)' }} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Clear Obvious Logout */}
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
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              <User size={18} />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.fullName || 'Platform Administrator'}
              </p>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>@{user?.username || 'admin'}</p>
            </div>
          </div>

          {/* Obvious, High-Visibility Logout Button */}
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
            title="Log out of Administrator Session"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
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
              Platform Admin Console
            </h2>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Multi-Tenant Business Management
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink
              to="/shop/dashboard"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                textDecoration: 'none',
              }}
            >
              <Store size={15} color="var(--accent-primary)" />
              <span>Store Operations</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </NavLink>

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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.fullName || user?.username}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {user?.roles?.[0] || 'ADMIN'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main style={{ padding: '2rem', flex: 1, minWidth: 0, overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
