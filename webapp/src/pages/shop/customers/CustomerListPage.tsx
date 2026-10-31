import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Bell,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Printer,
  Eye,
} from 'lucide-react';
import { billingApi } from '../../../api/billingApi';
import { Customer, CreateCustomerRequest, InvoiceResponse, ThermalReceiptResponse } from '../../../types';
import { ThermalReceiptModal } from '../billing/ThermalReceiptModal';
import '../billing/billing.css';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // New Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
  });

  // Customer Bills Modal State
  const [selectedCustomerForBills, setSelectedCustomerForBills] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceResponse[]>([]);
  const [loadingCustomerInvoices, setLoadingCustomerInvoices] = useState(false);
  const [thermalReceipt, setThermalReceipt] = useState<ThermalReceiptResponse | null>(null);
  const [showThermalModal, setShowThermalModal] = useState(false);

  const handleViewCustomerBills = async (c: Customer) => {
    setSelectedCustomerForBills(c);
    setLoadingCustomerInvoices(true);
    try {
      const res = await billingApi.searchInvoices({ search: c.phone || c.name, page: 0, size: 20 });
      setCustomerInvoices(res.content || []);
    } catch (err) {
      console.error('Failed to load customer bills', err);
      setCustomerInvoices([]);
    } finally {
      setLoadingCustomerInvoices(false);
    }
  };

  const handlePrintCustomerSlip = async (invoiceNumber: string) => {
    try {
      const receipt = await billingApi.getThermalReceipt(invoiceNumber);
      setThermalReceipt(receipt);
      setShowThermalModal(true);
    } catch (err) {
      alert('Failed to load receipt: ' + err);
    }
  };

  const loadCustomers = async (query = searchQuery, pageNum = page) => {
    setLoading(true);
    try {
      const res = await billingApi.searchCustomers({
        search: query.trim() || undefined,
        page: pageNum,
        size: 10,
      });
      setCustomers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(searchQuery, 0);
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setErrorMsg('Customer name and phone number are required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await billingApi.createCustomer(form);
      setShowModal(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        gstin: '',
      });
      setSuccessToast(`Customer "${form.name}" registered successfully.`);
      setTimeout(() => setSuccessToast(null), 3500);
      loadCustomers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create customer profile.');
    } finally {
      setSaving(false);
    }
  };

  // Quick stats
  const totalSpentAll = customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);
  const gstRegisteredCount = customers.filter((c) => Boolean(c.gstin)).length;
  const highValueCount = customers.filter((c) => Number(c.totalSpent) >= 1000).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Success Notification */}
      {successToast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={17} /> {successToast}
        </div>
      )}

      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Customer Directory
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Centralized CRM directory tracking customer purchasing history, phone contacts, and monthly reminder automations.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => loadCustomers()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Total Customers */}
        <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              Total Customers
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.35rem 0 0.2rem' }}>
            {totalElements}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Registered store clients
          </div>
        </div>

        {/* Total Purchases */}
        <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              Page Total Spent
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.2rem' }}>
            ₹{totalSpentAll.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Cumulative purchases recorded
          </div>
        </div>

        {/* High-Value Customers */}
        <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              Repeat VIP Clients
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', margin: '0.35rem 0 0.2rem' }}>
            {highValueCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Spent over ₹1,000 in store
          </div>
        </div>

        {/* GST Registered B2B */}
        <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              B2B / GST Clients
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', margin: '0.35rem 0 0.2rem' }}>
            {gstRegisteredCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Equipped with GSTIN for B2B billing
          </div>
        </div>
      </div>

      {/* Search Bar Strip */}
      <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by customer name, phone number, city, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.9rem 0.55rem 2.3rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Customer Records Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contact Info</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tax / GSTIN</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Spent</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                    Searching customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No customers found</div>
                    <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.82rem' }}>
                      {searchQuery ? `No customer matches "${searchQuery}".` : 'Get started by creating your first customer profile!'}
                    </p>
                    {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="btn btn-secondary btn-sm">Clear Search</button>
                    ) : (
                      <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">+ Add First Customer</button>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const initial = (c.name || 'C').charAt(0).toUpperCase();
                  const cleanPhone = (c.phone || '').replace(/\D/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Name & ID */}
                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              CUST-#{c.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '0.95rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
                            <a
                              href={`tel:${c.phone}`}
                              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontFamily: 'monospace' }}
                            >
                              {c.phone}
                            </a>
                            <a
                              href={`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(`Hello ${c.name}, greetings from your store!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={11} /> WhatsApp
                            </a>
                          </div>
                          {c.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <Mail size={12} /> {c.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.95rem 1rem', color: 'var(--text-secondary)' }}>
                        {c.city || c.state ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{[c.city, c.state].filter(Boolean).join(', ')}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* GSTIN */}
                      <td style={{ padding: '0.95rem 1rem' }}>
                        {c.gstin ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#d97706',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {c.gstin}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Regular Retail</span>
                        )}
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '0.95rem 1rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                          ₹{(Number(c.totalSpent) || 0).toFixed(2)}
                        </div>
                        {Number(c.creditBalance) > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                            Due: ₹{Number(c.creditBalance).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td style={{ padding: '0.95rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleViewCustomerBills(c)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title={`View bills for ${c.name}`}
                          >
                            <FileText size={13} />
                            <span>Bills</span>
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/shop/pos?customerPhone=${encodeURIComponent(c.phone)}&customerName=${encodeURIComponent(c.name)}`
                              )
                            }
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title={`Create new POS bill for ${c.name}`}
                          >
                            <ShoppingCart size={13} />
                            <span>+ Bill</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total clients)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  const prev = Math.max(0, page - 1);
                  setPage(prev);
                  loadCustomers(searchQuery, prev);
                }}
                disabled={page === 0}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const next = Math.min(totalPages - 1, page + 1);
                  setPage(next);
                  loadCustomers(searchQuery, next);
                }}
                disabled={page >= totalPages - 1}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Customer Modal */}
      {showModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                <Users size={18} color="var(--accent-primary)" /> Add New Store Customer Profile
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {errorMsg && (
                  <div
                    style={{
                      padding: '8px 12px',
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
                    <AlertCircle size={15} /> {errorMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Customer Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Mobile / WhatsApp Phone <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number (e.g. 9876543210)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      GSTIN (Optional for B2B)
                    </label>
                    <input
                      type="text"
                      placeholder="15-character GSTIN"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad / Visakhapatnam"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Andhra Pradesh / Telangana"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Billing Address / Street
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat #402, Gandhi Road"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div className="pos-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '7px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {saving ? 'Creating...' : '+ Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          CUSTOMER BILLS MODAL (SHOWS ONLY PARTICULAR CUSTOMER'S BILLS)
          ===================================================================== */}
      {selectedCustomerForBills && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
          onClick={() => setSelectedCustomerForBills(null)}
        >
          <div
            style={{
              width: '750px',
              maxWidth: '96vw',
              maxHeight: '85vh',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Invoices &amp; Bills: {selectedCustomerForBills.name}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Phone: {selectedCustomerForBills.phone} • Lifetime Spent: ₹{(Number(selectedCustomerForBills.totalSpent) || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForBills(null)}
                className="btn-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Invoices List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {loadingCustomerInvoices ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                  Loading invoices for this customer...
                </div>
              ) : customerInvoices.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No Bills Found</div>
                  <p style={{ fontSize: '0.78rem', margin: '4px 0 1rem' }}>
                    There are no recorded bills for {selectedCustomerForBills.name} ({selectedCustomerForBills.phone}) yet.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCustomerForBills(null);
                      navigate('/shop/pos');
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <ShoppingCart size={13} style={{ marginRight: '4px' }} />
                    + Create Bill at POS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {inv.invoiceNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: inv.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: inv.status === 'COMPLETED' ? '#10b981' : '#ef4444',
                            }}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          {' • '}
                          <span>Cashier: {inv.cashierName || 'Staff'}</span>
                          {' • '}
                          <span>Method: <strong>{inv.primaryPaymentMode || 'CASH'}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{Number(inv.grandTotal).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Items: {inv.items?.length || 1}
                          </div>
                        </div>

                        <button
                          onClick={() => handlePrintCustomerSlip(inv.invoiceNumber)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
                          title="Print Thermal Slip"
                        >
                          <Printer size={14} />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <button
                onClick={() => {
                  const phone = selectedCustomerForBills.phone;
                  setSelectedCustomerForBills(null);
                  navigate(`/shop/invoices?search=${encodeURIComponent(phone)}`);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 700 }}
              >
                Open in Full Invoices Ledger &rarr;
              </button>
              <button
                onClick={() => setSelectedCustomerForBills(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={showThermalModal}
        receipt={thermalReceipt}
        onClose={() => setShowThermalModal(false)}
      />
    </div>
  );
};
