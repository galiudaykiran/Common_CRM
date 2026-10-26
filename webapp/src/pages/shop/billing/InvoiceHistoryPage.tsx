import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  Eye,
  RefreshCw,
  Banknote,
  QrCode,
  CreditCard,
  Layers,
} from 'lucide-react';
import { billingApi } from '../../../api/billingApi';
import { InvoiceResponse, ThermalReceiptResponse } from '../../../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import './billing.css';

export const InvoiceHistoryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);
  const [thermalReceipt, setThermalReceipt] = useState<ThermalReceiptResponse | null>(null);
  const [showThermalModal, setShowThermalModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [page]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await billingApi.searchInvoices({
        search: search.trim() || undefined,
        page,
        size: 15,
      });
      setInvoices(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error('Failed to load invoices', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadInvoices();
  };

  const handlePrintSlip = async (invoiceNumber: string) => {
    try {
      const receipt = await billingApi.getThermalReceipt(invoiceNumber);
      setThermalReceipt(receipt);
      setShowThermalModal(true);
    } catch (err) {
      alert('Failed to load receipt slip: ' + err);
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'CASH':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Banknote size={12} /> CASH
          </span>
        );
      case 'UPI':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <QrCode size={12} /> UPI
          </span>
        );
      case 'CARD':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <CreditCard size={12} /> CARD
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            {mode}
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="saas-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="saas-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="saas-icon-badge" style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <FileText size={22} />
          </div>
          <div>
            <h1 className="saas-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Billing & Invoices Audit Ledger
            </h1>
            <p className="saas-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Real-time audit log of store sales, automated stock decrements, GST tax breakdowns, and printable POS receipts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div className="pos-input-container">
            <Search size={14} className="pos-input-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, customer..."
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                width: '260px',
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px' }}>Invoice #</th>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Cashier</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Items</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tax (GST)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Grand Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Mode</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoice transactions recorded yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--table-border)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      #{inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(inv.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.customerName || 'Walk-in Guest'}</div>
                      {inv.customerPhone && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{inv.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {inv.cashierName}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {inv.items?.length || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                      ₹{inv.totalTax?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: 'var(--text-primary)', fontSize: '13px' }}>
                      ₹{inv.grandTotal?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {getModeBadge(inv.primaryPaymentMode)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Details"
                          style={{ padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handlePrintSlip(inv.invoiceNumber)}
                          title="Print Thermal Slip"
                          style={{ padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'var(--success-bg)', color: 'var(--success)', cursor: 'pointer' }}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 16px', background: 'var(--table-header-bg)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>Showing {invoices.length} of {totalElements} bills</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              Previous
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: '600px' }}>
            <div className="pos-modal-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Invoice #{selectedInvoice.invoiceNumber}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {new Date(selectedInvoice.createdAt).toLocaleString()} • Cashier: {selectedInvoice.cashierName}
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedInvoice.customerName || 'Walk-in Guest'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedInvoice.customerPhone || 'No Phone recorded'}
                  </div>
                </div>
                <div>{getModeBadge(selectedInvoice.primaryPaymentMode)}</div>
              </div>

              {/* Items List */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax%</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((it) => (
                      <tr key={it.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.productName}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>SKU: {it.sku}</div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{it.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>₹{it.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{it.taxRate}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>₹{it.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                {selectedInvoice.invoiceDiscountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.invoiceDiscountTotal?.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Taxes (CGST + SGST):</span>
                  <span>₹{selectedInvoice.totalTax?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--success)' }}>₹{selectedInvoice.grandTotal?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pos-modal-footer">
              <button onClick={() => setSelectedInvoice(null)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '11px' }}>
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintSlip(selectedInvoice.invoiceNumber);
                  setSelectedInvoice(null);
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} /> Print Thermal Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Slip */}
      <ThermalReceiptModal
        receipt={thermalReceipt}
        isOpen={showThermalModal}
        onClose={() => setShowThermalModal(false)}
      />
    </div>
  );
};
