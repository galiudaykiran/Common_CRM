import React, { useState } from 'react';
import { Receipt, X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { reportsApi } from '../../../api/reportsApi';
import { CreateExpenseRequest } from '../../../types';

interface StoreExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

export const StoreExpensesModal: React.FC<StoreExpensesModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
}) => {
  const [form, setForm] = useState<CreateExpenseRequest>({
    category: 'UTILITIES',
    title: '',
    amount: '' as any,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    receiptReference: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || Number(form.amount) <= 0) {
      setError('Please provide a valid title and positive expense amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await reportsApi.createExpense({
        ...form,
        amount: Number(form.amount),
      });
      onExpenseAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-card" style={{ maxWidth: '480px' }}>
        <div className="pos-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
            <Receipt size={18} color="var(--accent-primary)" /> Record Store Operational Expense
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Category <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <option value="RENT">Store Rent</option>
                  <option value="UTILITIES">Electricity & Water</option>
                  <option value="STAFF_WAGES">Staff Wages / Salary</option>
                  <option value="MAINTENANCE">Store Maintenance</option>
                  <option value="PACKAGING">Packaging & Bags</option>
                  <option value="TRANSPORT">Transport & Freight</option>
                  <option value="MISCELLANEOUS">Tea, Snacks & Misc</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Expense Date <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Expense Description / Purpose <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. October Electricity Bill / Shop Floor Cleaning"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: e.target.value as any })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Paid Via
                </label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                >
                  <option value="CASH">Cash in Drawer</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">Bank NetBanking / NEFT</option>
                  <option value="CARD">Credit/Debit Card</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Receipt / Voucher Ref (Optional)
              </label>
              <input
                type="text"
                value={form.receiptReference || ''}
                onChange={(e) => setForm({ ...form, receiptReference: e.target.value })}
                placeholder="e.g. VOUCHER-402 / Bill #8821"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            </div>
          </div>

          <div className="pos-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? 'Recording...' : '+ Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
