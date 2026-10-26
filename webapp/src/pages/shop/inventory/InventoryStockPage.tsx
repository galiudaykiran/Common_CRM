import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  XCircle,
  DollarSign,
  PackageCheck,
  History,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { inventoryApi } from '../../../api/inventoryApi';
import {
  InventorySummary,
  Product,
  InventoryTransaction,
} from '../../../types';

export const InventoryStockPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [ledger, setLedger] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerSearch, setLedgerSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, lowRes, ledgerRes] = await Promise.allSettled([
        inventoryApi.getSummary(),
        inventoryApi.getLowStockAlerts(),
        inventoryApi.getGlobalLedger({ page: 0, size: 50 }),
      ]);
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value);
      } else {
        console.error('Failed to load inventory summary', sumRes.reason);
      }
      if (lowRes.status === 'fulfilled') {
        setLowStockItems(lowRes.value);
      } else {
        console.error('Failed to load low stock alerts', lowRes.reason);
      }
      if (ledgerRes.status === 'fulfilled') {
        setLedger(ledgerRes.value.content);
      } else {
        console.error('Failed to load stock ledger', ledgerRes.reason);
      }
    } catch (err) {
      console.error('Failed to load inventory operations data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLedger = ledger.filter((tx) => {
    if (!ledgerSearch) return true;
    const q = ledgerSearch.toLowerCase();
    return (
      tx.productName?.toLowerCase().includes(q) ||
      tx.sku?.toLowerCase().includes(q) ||
      tx.referenceId?.toLowerCase().includes(q) ||
      tx.transactionType?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '4px' }}>
      {/* SaaS Page Header */}
      <div className="saas-header">
        <div className="saas-title-group">
          <div className="saas-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="saas-title">Inventory Valuation & Stock Operations</h1>
            <p className="saas-subtitle">
              Real-time stock valuation, automated reorder thresholds, and store-wide audit ledger.
            </p>
          </div>
        </div>

        <div className="saas-actions">
          <button
            onClick={() => navigate('/shop/products')}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Manage Catalog
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </button>
        </div>
      </div>

      {/* Modern SaaS KPI Cards Grid */}
      <div className="saas-stat-grid" style={{ marginBottom: '28px' }}>
        {/* Total Stock Units */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Total Stock Units</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="saas-stat-value">
            {summary?.totalStockUnits != null ? Number(summary.totalStockUnits).toLocaleString() : '—'}
          </div>
          <div className="saas-stat-footer">
            Across <strong>{summary?.activeProducts || 0}</strong> active catalog items
          </div>
        </div>

        {/* Valuation (At Cost) */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Valuation (Cost)</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#10b981' }}>
            ₹{summary?.totalCostValuation != null ? Number(summary.totalCostValuation).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="saas-stat-footer">
            Current working capital tied in stock
          </div>
        </div>

        {/* Valuation (At Retail) */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Valuation (Retail)</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#8b5cf6' }}>
            ₹{summary?.totalRetailValuation != null ? Number(summary.totalRetailValuation).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="saas-stat-footer">
            Estimated gross retail revenue
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Low Stock Alerts</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#f59e0b' }}>
            {summary?.lowStockCount || 0}
          </div>
          <div className="saas-stat-footer">
            Items at or below safety threshold
          </div>
        </div>

        {/* Out of Stock */}
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Out of Stock</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#ef4444' }}>
            {summary?.outOfStockCount || 0}
          </div>
          <div className="saas-stat-footer">
            Critical zero available inventory
          </div>
        </div>
      </div>

      {/* Low Stock Critical Alert Section */}
      {lowStockItems.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '28px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Stock Replenishment Warnings
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {lowStockItems.length} products require purchase order replenishment
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/shop/products')}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Restock in Catalog <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    SKU: <span style={{ fontFamily: 'monospace' }}>{item.sku}</span> • Reorder Level: {item.reorderLevel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: item.isOutOfStock ? '#ef4444' : '#f59e0b',
                    }}
                  >
                    {item.currentStock} {item.unitOfMeasure}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Available</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store-wide Immutable Ledger Table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <History size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Store-wide Stock Audit Ledger
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Immutable double-entry log of all stock adjustments, receipts, and sales
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="saas-search-input-wrap" style={{ minWidth: '220px' }}>
              <Search className="saas-search-icon" size={15} />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="saas-search-input"
                style={{ padding: '7px 12px 7px 32px', fontSize: '13px' }}
              />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing {filteredLedger.length} events
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Timestamp
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Product
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Event Type
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Reference / Document
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Movement Delta
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Stock Balance
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Notes / Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit transactions...
                  </td>
                </tr>
              ) : filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock transactions match your search.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => {
                  const isPositive = Number(tx.quantityDelta) > 0;
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{tx.productName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tx.sku}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            background: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isPositive ? '#10b981' : '#ef4444',
                          }}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {tx.referenceId || '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            color: isPositive ? '#10b981' : '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                          {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{tx.quantityBefore}</span>
                        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                        <strong>{tx.quantityAfter}</strong>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '250px' }}>
                        {tx.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
