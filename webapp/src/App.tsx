import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
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
import { PosBillingPage } from './pages/shop/billing/PosBillingPage';
import { InvoiceHistoryPage } from './pages/shop/billing/InvoiceHistoryPage';
import { CustomerRemindersPage } from './pages/shop/billing/CustomerRemindersPage';
import { CustomerListPage } from './pages/shop/customers/CustomerListPage';
import { BusinessReportsPage } from './pages/shop/reports/BusinessReportsPage';

import { DiningDashboardPage } from './pages/shop/dining/DiningDashboardPage';
import { DiningTablesPage } from './pages/shop/dining/DiningTablesPage';
import { DiningMenuPage } from './pages/shop/dining/DiningMenuPage';
import { DishAvailabilityPage } from './pages/shop/dining/DishAvailabilityPage';
import { DiningOrdersPage } from './pages/shop/dining/DiningOrdersPage';
import { DiningBillingPage } from './pages/shop/dining/DiningBillingPage';
import { PublicQrMenuPage } from './pages/shop/dining/PublicQrMenuPage';

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
        <NotificationProvider>
          <BrowserRouter>
            <NotificationDrawer />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/scan-bridge" element={<MobileScanBridgePage />} />
              <Route path="/dining/public/menu/:qrToken" element={<PublicQrMenuPage />} />

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
                <Route path="pos" element={<PosBillingPage />} />
                <Route path="invoices" element={<InvoiceHistoryPage />} />
                <Route path="reminders" element={<CustomerRemindersPage />} />
                <Route path="sales" element={<Navigate to="/shop/pos" replace />} />
                <Route path="customers" element={<CustomerListPage />} />
                <Route
                  path="employees"
                  element={
                    <OwnerOnlyRoute>
                      <EmployeeListPage />
                    </OwnerOnlyRoute>
                  }
                />
                <Route path="expenses" element={<Navigate to="/shop/reports" replace />} />
                <Route
                  path="reports"
                  element={
                    <OwnerOnlyRoute>
                      <BusinessReportsPage />
                    </OwnerOnlyRoute>
                  }
                />

                {/* Restaurant & Dining Management Module Routes */}
                <Route path="dining/dashboard" element={<DiningDashboardPage />} />
                <Route path="dining/tables" element={<DiningTablesPage />} />
                <Route path="dining/menu" element={<DiningMenuPage />} />
                <Route path="dining/availability" element={<DishAvailabilityPage />} />
                <Route path="dining/orders" element={<DiningOrdersPage />} />
                <Route path="dining/billing" element={<DiningBillingPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
