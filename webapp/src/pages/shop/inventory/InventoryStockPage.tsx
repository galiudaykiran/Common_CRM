import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  XCircle,
  DollarSign,
  PackageCheck,
  History,
  ArrowUpDown,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { inventoryApi } from '../../../api/inventoryApi';
import {
  InventorySummary,
  Product,
  InventoryTransaction,
} from '../../../types';

export const InventoryStockPage: React.FC = () => {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [ledger, setLedger] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Boxes size={22} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Inventory Valuation & Stock Operations
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Real-time stock valuation metrics, critical reorder alerts, and store-wide audit ledger.
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '9px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        {/* Total Stock Units */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL STOCK UNITS</span>
            <PackageCheck size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.totalStockUnits != null ? Number(summary.totalStockUnits).toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Across {summary?.activeProducts || 0} active catalog items
          </div>
        </div>

        {/* Total Valuation at Cost */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>VALUATION (AT COST)</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#10b981' }}>
            ₹{summary?.totalCostValuation != null ? Number(summary.totalCostValuation).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current capital tied up in stock</div>
        </div>

        {/* Total Valuation at Retail */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>VALUATION (AT RETAIL)</span>
            <TrendingUp size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#8b5cf6' }}>
            ₹{summary?.totalRetailValuation != null ? Number(summary.totalRetailValuation).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated gross retail revenue</div>
        </div>

        {/* Low Stock Alerts */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>LOW STOCK ALERTS</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b' }}>
            {summary?.lowStockCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Items at or below reorder level</div>
        </div>

        {/* Out of Stock */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>OUT OF STOCK</span>
            <XCircle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#ef4444' }}>
            {summary?.outOfStockCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Critical: zero available stock</div>
        </div>
      </div>

      {/* Low Stock Critical Alert Section */}
      {lowStockItems.length > 0 && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Stock Replenishment Warnings ({lowStockItems.length} items require reordering)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    SKU: {item.sku} • Reorder at: {item.reorderLevel}
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={18} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Store-wide Immutable Stock Audit Ledger
            </h3>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Latest 50 recorded stock events</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Timestamp
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Product
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Event Type
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Reference / Document
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Movement Delta
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Stock Balance
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledger.map((tx) => {
                  const isPositive = Number(tx.quantityDelta) > 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
                            fontSize: '14px',
                            color: isPositive ? '#10b981' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                          {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {tx.quantityBefore} → <strong>{tx.quantityAfter}</strong>
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
