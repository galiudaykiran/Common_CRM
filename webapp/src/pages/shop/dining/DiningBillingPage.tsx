import React, { useState, useEffect } from 'react';
import {
  Receipt,
  DollarSign,
  CheckCircle,
  CreditCard,
  QrCode,
  Printer,
  X,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  diningApi,
  DiningBill,
  DiningSession,
} from '../../../api/diningApi';

export const DiningBillingPage: React.FC = () => {
  const [bills, setBills] = useState<DiningBill[]>([]);
  const [activeSessions, setActiveSessions] = useState<DiningSession[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate Bill Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DiningSession | null>(null);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<DiningBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');

  // Receipt Modal
  const [receiptBill, setReceiptBill] = useState<DiningBill | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [billsData, sessionsData] = await Promise.all([
        diningApi.getBills(paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined),
        diningApi.getActiveSessions(),
      ]);
      setBills(billsData);
      setActiveSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paymentStatusFilter]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Generate Bill
  const handleOpenGenerateModal = (session: DiningSession) => {
    setSelectedSession(session);
    setDiscountTotal(0);
    setServiceCharge(0);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      setSubmitting(true);
      const bill = await diningApi.generateBill(selectedSession.id, {
        discountTotal: Number(discountTotal) || 0,
        serviceCharge: Number(serviceCharge) || 0,
      });

      showNotification(`Bill ${bill.billNumber} generated successfully`);
      setIsGenerateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error generating bill');
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment
  const handleOpenPaymentModal = (bill: DiningBill) => {
    setPayingBill(bill);
    setPaymentAmount(bill.balanceAmount);
    setPaymentMode('CASH');
    setTransactionRef('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    try {
      setSubmitting(true);
      const updated = await diningApi.recordPayment(payingBill.id, {
        amount: Number(paymentAmount),
        paymentMode,
        transactionReference: transactionRef.trim() || undefined,
      });

      showNotification(`Payment recorded. Status: ${updated.paymentStatus}`);
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { label: 'PAID', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'PARTIALLY_PAID':
        return { label: 'PARTIALLY PAID', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'PENDING':
        return { label: 'PENDING PAYMENT', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: status, bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} /> {actionMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Dining Billing & Settlements Desk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Consolidate table tickets into itemized tax bills, apply discounts/charges, and record payment settlements.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Active Seated Tables Ready for Billing */}
      {activeSessions.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Dining Tables Ready for Bill Generation ({activeSessions.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click Generate Bill to prepare guest check
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {activeSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Table {session.tableNumber}
                    </strong>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#3b82f6',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {session.areaName || 'General'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Guest: <strong style={{ color: 'var(--text-primary)' }}>{session.customerName || 'Walk-in'}</strong> ({session.guestCount} Guests)
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Ordered Items Total: <strong style={{ color: '#10b981' }}>₹{Number(session.ordersTotal || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenGenerateModal(session)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Receipt size={14} /> Generate Bill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs for Existing Bills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>
          Payment Status:
        </span>
        {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID'].map((status) => (
          <button
            key={status}
            onClick={() => setPaymentStatusFilter(status)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: paymentStatusFilter === status ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: paymentStatusFilter === status ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary)',
              color: paymentStatusFilter === status ? '#fff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Bills Table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr 1.8fr',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          <div>Bill Number</div>
          <div>Table</div>
          <div>Grand Total</div>
          <div>Balance</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {bills.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={44} style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
            <div>No dining bills found matching current filter.</div>
          </div>
        ) : (
          bills.map((bill) => {
            const badge = getPaymentStatusBadge(bill.paymentStatus);
            return (
              <div
                key={bill.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr 1.8fr',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {bill.billNumber}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Table {bill.tableNumber}
                </div>

                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>
                  ₹{Number(bill.grandTotal).toFixed(2)}
                </div>

                <div style={{ fontWeight: 700, color: bill.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                  ₹{Number(bill.balanceAmount).toFixed(2)}
                </div>

                <div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.text,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setReceiptBill(bill)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Printer size={13} /> View / Print
                  </button>

                  {bill.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => handleOpenPaymentModal(bill)}
                      style={{
                        padding: '0.4rem 0.9rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <DollarSign size={13} /> Record Payment
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- GENERATE BILL MODAL --- */}
      {isGenerateModalOpen && selectedSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Generate Bill for Table {selectedSession.tableNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Session: {selectedSession.sessionCode}
                </span>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateBill}>
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal (Ordered items):</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{Number(selectedSession.ordersTotal || 0).toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. GST / Taxes:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>Calculated automatically</strong>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Service Charge (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submitting ? 'Generating...' : 'Confirm & Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT MODAL --- */}
      {isPaymentModalOpen && payingBill && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Record Payment for {payingBill.billNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Table {payingBill.tableNumber} • Grand Total: ₹{Number(payingBill.grandTotal).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  max={payingBill.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Payment Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {['CASH', 'UPI', 'CARD', 'OTHER'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '6px',
                        border: paymentMode === mode ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                        background: paymentMode === mode ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                        color: paymentMode === mode ? '#10b981' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Transaction / UPI Ref ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-12345678 or POS Txn #"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Recording...' : 'Accept Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE RECEIPT MODAL --- */}
      {receiptBill && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#111827',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }} className="no-print">
              <button
                onClick={() => setReceiptBill(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Content */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #d1d5db', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#111827' }}>
                RESTAURANT TAX INVOICE
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Dine-In Guest Check
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280' }}>Bill #:</span>
                <strong>{receiptBill.billNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280' }}>Table #:</span>
                <strong>{receiptBill.tableNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280' }}>Date:</span>
                <span>{new Date(receiptBill.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #d1d5db', borderBottom: '1px dashed #d1d5db', padding: '0.75rem 0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                <span>Subtotal:</span>
                <span>₹{Number(receiptBill.subtotal).toFixed(2)}</span>
              </div>
              {receiptBill.discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#ef4444' }}>
                  <span>Discount:</span>
                  <span>-₹{Number(receiptBill.discountTotal).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                <span>GST / Taxes:</span>
                <span>₹{Number(receiptBill.taxTotal).toFixed(2)}</span>
              </div>
              {receiptBill.serviceCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span>Service Charge:</span>
                  <span>₹{Number(receiptBill.serviceCharge).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span>₹{Number(receiptBill.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Paid Amount:</span>
                <strong style={{ color: '#10b981' }}>₹{Number(receiptBill.paidAmount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Balance Due:</span>
                <strong style={{ color: receiptBill.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                  ₹{Number(receiptBill.balanceAmount).toFixed(2)}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} className="no-print">
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.6rem 1.25rem',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
