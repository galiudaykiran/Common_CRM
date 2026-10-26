import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../api/client';
import { ApiResponse, AuthResponse } from '../../types';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Store,
  Users,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const Login: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'STAFF' | 'OWNER' | 'ADMIN'>('STAFF');
  const [shopCode, setShopCode] = useState('NAG_11');
  const [username, setUsername] = useState('uday');
  const [password, setPassword] = useState('Staff@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'STAFF' | 'OWNER' | 'ADMIN') => {
    setActiveRole(role);
    setErrorMessage(null);
    if (role === 'STAFF') {
      setShopCode('NAG_11');
      setUsername('uday');
      setPassword('Staff@12345');
    } else if (role === 'OWNER') {
      setShopCode('');
      setUsername('nagaraju');
      setPassword('Password@123');
    } else {
      setShopCode('');
      setUsername('admin');
      setPassword('Admin@12345');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: { username: string; password: string; shopCode?: string } = {
        username: username.trim(),
        password,
      };

      if (activeRole === 'STAFF') {
        if (!shopCode.trim()) {
          setErrorMessage('Please enter your Store ID / Shop Code (e.g. NAG_11)');
          setLoading(false);
          return;
        }
        payload.shopCode = shopCode.trim().toUpperCase();
      }

      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);

      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        login(authData);
        const roles = authData.user.roles || [];
        const isAdmin = roles.some((r: string) => r === 'PLATFORM_ADMIN' || r.includes('ADMIN'));
        const isOwner = roles.some((r: string) => r === 'SHOP_OWNER' || r.includes('OWNER'));
        const isShopRole = roles.some((r: string) =>
          r.includes('SHOP_OWNER') ||
          r.includes('SHOP_EMPLOYEE') ||
          r.includes('STORE_MANAGER') ||
          r.includes('CASHIER') ||
          r.includes('SALES_ASSOCIATE') ||
          r.includes('INVENTORY_CLERK')
        );

        if (isAdmin) {
          navigate('/');
        } else if (isOwner) {
          navigate('/shop/dashboard');
        } else if (isShopRole) {
          navigate('/shop/products');
        } else {
          navigate('/');
        }
      } else {
        setErrorMessage(response.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials or server unavailable';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Top Right Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="btn-icon"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
      </button>

      {/* Main SaaS Auth Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          position: 'relative',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
              marginBottom: '1rem',
              color: '#fff',
            }}
          >
            {activeRole === 'STAFF' ? (
              <Store size={26} />
            ) : activeRole === 'OWNER' ? (
              <Store size={26} />
            ) : (
              <ShieldCheck size={26} />
            )}
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            {activeRole === 'STAFF'
              ? 'Store Staff Portal'
              : activeRole === 'OWNER'
              ? 'Shop Owner Access'
              : 'Platform Admin Console'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Multi-Tenant Retail & Business Operating System
          </p>
        </div>

        {/* 3-Way Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => handleRoleSelect('STAFF')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              background: activeRole === 'STAFF' ? 'var(--accent-primary)' : 'transparent',
              color: activeRole === 'STAFF' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} /> Staff
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('OWNER')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              background: activeRole === 'OWNER' ? 'var(--accent-primary)' : 'transparent',
              color: activeRole === 'OWNER' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={14} /> Owner
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              background: activeRole === 'ADMIN' ? 'var(--accent-primary)' : 'transparent',
              color: activeRole === 'ADMIN' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={14} /> Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Shop Code Input (Only for Staff / Employee Login) */}
          {activeRole === 'STAFF' && (
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Store ID / Shop Code *</span>
                <span className="shop-code-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>NAG_11</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Store
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent-primary)',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{
                    paddingLeft: '2.5rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                  placeholder="Enter Store Code (e.g. NAG_11)"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label">
              {activeRole === 'STAFF' ? 'Employee Username or Staff ID *' : 'Account Username *'}
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={
                  activeRole === 'STAFF'
                    ? 'e.g. uday or kavitha_cashier'
                    : activeRole === 'OWNER'
                    ? 'e.g. nagaraju'
                    : 'e.g. admin'
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="form-group" style={{ marginBottom: '1.4rem' }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating credentials...'
            ) : (
              <>
                {activeRole === 'STAFF' ? 'Access Store Counter' : 'Sign In to Workspace'} <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Quick Credential Pre-fill Helpers */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Instant Quick-Fill Access:
            </p>
            <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('STAFF')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Users size={12} /> Staff (NAG_11 / uday)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('OWNER')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Store size={12} /> Shop Owner (nagaraju)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ShieldCheck size={12} /> Platform Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
