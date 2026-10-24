import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ShopListPage } from './pages/shops/ShopListPage';
import { BusinessTypesPage } from './pages/business-types/BusinessTypesPage';
import { ModulesPage } from './pages/modules/ModulesPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';

import { ShopLayout } from './components/layout/ShopLayout';
import { ShopDashboardPage } from './pages/shop/ShopDashboardPage';
import { ShopProfilePage } from './pages/shop/ShopProfilePage';
import { EmployeeListPage } from './pages/shop/employees/EmployeeListPage';
import { ProductListPage } from './pages/shop/inventory/ProductListPage';
import { InventoryStockPage } from './pages/shop/inventory/InventoryStockPage';
import { MobileScanBridgePage } from './pages/shop/inventory/MobileScanBridgePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        Loading platform credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const OwnerOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Verifying permissions...
      </div>
    );
  }

  const isOwner = Boolean(user?.roles?.some((r) => r === 'SHOP_OWNER' || r === 'PLATFORM_ADMIN'));
  if (!isOwner) {
    return <Navigate to="/shop/products" replace />;
  }

  return <>{children}</>;
};

const ShopIndexRedirect: React.FC = () => {
  const { user } = useAuth();
  const isOwner = Boolean(user?.roles?.some((r) => r === 'SHOP_OWNER' || r === 'PLATFORM_ADMIN'));
  return <Navigate to={isOwner ? "/shop/dashboard" : "/shop/products"} replace />;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/scan-bridge" element={<MobileScanBridgePage />} />

          {/* Platform Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="shops" element={<ShopListPage />} />
            <Route path="business-types" element={<BusinessTypesPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Shop Holder / Store Operations Routes */}
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <ShopLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ShopIndexRedirect />} />
            <Route
              path="dashboard"
              element={
                <OwnerOnlyRoute>
                  <ShopDashboardPage />
                </OwnerOnlyRoute>
              }
            />
            <Route
              path="profile"
              element={
                <OwnerOnlyRoute>
                  <ShopProfilePage />
                </OwnerOnlyRoute>
              }
            />
            <Route path="products" element={<ProductListPage />} />
            <Route path="inventory" element={<InventoryStockPage />} />
            <Route path="sales" element={<div className="glass-card" style={{ padding: '2rem' }}><h3 style={{ margin: '0 0 0.5rem' }}>Point of Sale & Orders</h3><p style={{ color: 'var(--text-secondary)', margin: 0 }}>Slice 7 Sales, invoicing, and order management integration.</p></div>} />
            <Route path="customers" element={<div className="glass-card" style={{ padding: '2rem' }}><h3 style={{ margin: '0 0 0.5rem' }}>Customer Directory</h3><p style={{ color: 'var(--text-secondary)', margin: 0 }}>Slice 5 Customer relationship records integration.</p></div>} />
            <Route
              path="employees"
              element={
                <OwnerOnlyRoute>
                  <EmployeeListPage />
                </OwnerOnlyRoute>
              }
            />
            <Route
              path="expenses"
              element={
                <OwnerOnlyRoute>
                  <div className="glass-card" style={{ padding: '2rem' }}><h3 style={{ margin: '0 0 0.5rem' }}>Store Expenses</h3><p style={{ color: 'var(--text-secondary)', margin: 0 }}>Operating expenses recording integration.</p></div>
                </OwnerOnlyRoute>
              }
            />
            <Route
              path="reports"
              element={
                <OwnerOnlyRoute>
                  <div className="glass-card" style={{ padding: '2rem' }}><h3 style={{ margin: '0 0 0.5rem' }}>Business Reports</h3><p style={{ color: 'var(--text-secondary)', margin: 0 }}>SQL-optimized sales and tax reporting integration.</p></div>
                </OwnerOnlyRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
