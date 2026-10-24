import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { ApiResponse, AuthResponse } from '../../types';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Store, BadgeCheck, Users } from 'lucide-react';

export const Login: React.FC = () => {
  const [loginMode, setLoginMode] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [shopCode, setShopCode] = useState('NAG_11');
  const [username, setUsername] = useState('uday');
  const [password, setPassword] = useState('Staff@12345');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: { username: string; password: string; shopCode?: string } = {
        username: username.trim(),
        password,
      };

      if (loginMode === 'EMPLOYEE') {
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

  const fillStaffCredentials = () => {
    setLoginMode('EMPLOYEE');
    setShopCode('NAG_11');
    setUsername('uday');
    setPassword('Staff@12345');
    setErrorMessage(null);
  };

  const fillShopOwnerCredentials = () => {
    setLoginMode('ADMIN');
    setUsername('nagaraju');
    setPassword('Password@123');
    setShopCode('');
    setErrorMessage(null);
  };

  const fillAdminCredentials = () => {
    setLoginMode('ADMIN');
    setUsername('admin');
    setPassword('Admin@12345');
    setShopCode('');
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '18px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'var(--accent-gradient)',
            filter: 'blur(50px)',
            opacity: 0.18,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
              marginBottom: '1rem',
              color: '#fff',
            }}
          >
            {loginMode === 'EMPLOYEE' ? <Store size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            {loginMode === 'EMPLOYEE' ? 'Store Staff Portal' : 'Business Portal Access'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Multi-Tenant Retail & Enterprise Operating System
          </p>
        </div>

        {/* Tab Switcher: Store Staff vs Owner/Admin */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginMode('EMPLOYEE');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: loginMode === 'EMPLOYEE' ? 'var(--accent-primary)' : 'transparent',
              color: loginMode === 'EMPLOYEE' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Store size={15} /> Store Staff
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('ADMIN');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: loginMode === 'ADMIN' ? 'var(--accent-primary)' : 'transparent',
              color: loginMode === 'ADMIN' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <ShieldCheck size={15} /> Owner / Admin
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
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

        <form onSubmit={handleSubmit}>
          {/* Shop Code Input (Only for Staff / Employee Login) */}
          {loginMode === 'EMPLOYEE' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Store ID / Shop Code *</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>e.g. NAG_11</span>
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
                  placeholder="Enter Store Code (e.g., NAG_11)"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">
              {loginMode === 'EMPLOYEE' ? 'Employee Username or Staff ID *' : 'Account Username *'}
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
                placeholder={loginMode === 'EMPLOYEE' ? 'e.g. uday or EMP-001' : 'Enter username or email'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating credentials...'
            ) : (
              <>
                {loginMode === 'EMPLOYEE' ? 'Access Store Counter' : 'Sign In to Platform'} <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* 1-Click Fast Credentials Helper */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Quick Demo Access:
            </p>
            <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={fillStaffCredentials}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Users size={12} /> Staff (NAG_11 / uday)
              </button>
              <button
                type="button"
                onClick={fillShopOwnerCredentials}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Store size={12} /> Shop Owner (nagaraju)
              </button>
              <button
                type="button"
                onClick={fillAdminCredentials}
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
