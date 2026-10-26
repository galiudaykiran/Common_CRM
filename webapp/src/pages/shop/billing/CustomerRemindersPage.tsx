import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Plus,
  Send,
  MessageSquare,
  CheckCircle,
  Trash2,
  Clock,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { billingApi } from '../../../api/billingApi';
import {
  CustomerNotificationSchedule,
  CreateScheduleRequest,
  Customer,
  NotificationDeliveryLog,
} from '../../../types';
import './billing.css';

export const CustomerRemindersPage: React.FC = () => {
  const [schedules, setSchedules] = useState<CustomerNotificationSchedule[]>([]);
  const [logs, setLogs] = useState<NotificationDeliveryLog[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs'>('schedules');
  const [loading, setLoading] = useState(false);
  const [triggeringNow, setTriggeringNow] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState<{
    title: string;
    scheduleType: string;
    dayOfMonth: number;
    channel: string;
    messageTemplate: string;
  }>({
    title: 'Monthly Store Visit & Rewards',
    scheduleType: 'MONTHLY_STORE_VISIT',
    dayOfMonth: 5,
    channel: 'WHATSAPP',
    messageTemplate:
      'Hello {customerName}! We look forward to seeing you at {storeName}. Exclusive discounts are available this month on your favorite items!',
  });

  useEffect(() => {
    loadSchedules();
    loadLogs();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getSchedules({ page: 0, size: 50 });
      setSchedules(res.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await billingApi.getDeliveryLogs({ page: 0, size: 50 });
      setLogs(res.content);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await billingApi.quickSearchCustomers(customerSearch);
        setCustomerResults(results);
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleTemplatePresetChange = (type: string) => {
    if (type === 'MONTHLY_STORE_VISIT') {
      setForm((prev) => ({
        ...prev,
        scheduleType: type,
        title: 'Monthly Store Visit & Rewards',
        messageTemplate:
          'Hello {customerName}! We look forward to seeing you at {storeName}. Exclusive discounts are available this month on your favorite items!',
      }));
    } else if (type === 'NEW_PRODUCTS_PROMO') {
      setForm((prev) => ({
        ...prev,
        scheduleType: type,
        title: 'New Monthly Catalog Arrival',
        messageTemplate:
          'Dear {customerName}, new stock has arrived at {storeName}! Drop by this week to grab fresh collections before stocks run out.',
      }));
    } else if (type === 'MONTHLY_PAYMENT_DUE') {
      setForm((prev) => ({
        ...prev,
        scheduleType: type,
        title: 'Monthly Dues / Balance Reminder',
        messageTemplate:
          'Dear {customerName}, this is a gentle reminder regarding your monthly account bill with {storeName}. Please visit us to settle your bill.',
      }));
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer for this schedule.');
      return;
    }

    try {
      const req: CreateScheduleRequest = {
        customerId: selectedCustomer.id,
        title: form.title,
        scheduleType: form.scheduleType,
        dayOfMonth: Number(form.dayOfMonth),
        channel: form.channel,
        messageTemplate: form.messageTemplate,
      };

      await billingApi.createSchedule(req);
      setShowModal(false);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setSuccessMsg('Monthly reminder schedule created successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await billingApi.toggleSchedule(id);
      loadSchedules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notification schedule?')) return;
    try {
      await billingApi.deleteSchedule(id);
      loadSchedules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerNow = async () => {
    setTriggeringNow(true);
    try {
      const count = await billingApi.triggerSchedulesNow();
      setSuccessMsg(`Dispatched ${count} due customer notifications instantly.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadSchedules();
      loadLogs();
    } catch (e: any) {
      alert('Failed to trigger notifications: ' + e);
    } finally {
      setTriggeringNow(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="saas-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="saas-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="saas-icon-badge" style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <Bell size={22} />
          </div>
          <div>
            <h1 className="saas-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Customer Recurring Monthly Reminders
            </h1>
            <p className="saas-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Configure automated monthly notifications sent to customer WhatsApp/SMS on a recurring date (e.g. 5th of every month).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTriggerNow}
            disabled={triggeringNow}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} className={triggeringNow ? 'animate-spin' : ''} />
            {triggeringNow ? 'Dispatching...' : 'Dispatch Due Now'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> New Monthly Reminder
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('schedules')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'schedules' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'schedules' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '13px',
            paddingBottom: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Calendar size={15} /> Active Monthly Schedules ({schedules.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'logs' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '13px',
            paddingBottom: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock size={15} /> Delivery Logs ({logs.length})
        </button>
      </div>

      {/* SCHEDULES TAB */}
      {activeTab === 'schedules' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Reminder Purpose</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Repeat Day</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Channel</th>
                  <th style={{ padding: '12px 16px' }}>Next Run</th>
                  <th style={{ padding: '12px 16px' }}>Created By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
                      Loading notification schedules...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No monthly customer reminders configured. Click "New Monthly Reminder" to configure.
                    </td>
                  </tr>
                ) : (
                  schedules.map((sch) => (
                    <tr key={sch.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sch.customerName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={10} /> {sch.customerPhone}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sch.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          "{sch.messageTemplate}"
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                          Day {sch.dayOfMonth}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: sch.channel === 'WHATSAPP' ? 'var(--success-bg)' : 'var(--info-bg)', color: sch.channel === 'WHATSAPP' ? 'var(--success)' : 'var(--info)' }}>
                          <MessageSquare size={10} /> {sch.channel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                        {sch.nextRunDate}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {sch.createdByName}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggle(sch.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: sch.active ? 'var(--success-bg)' : 'var(--bg-card)', color: sch.active ? 'var(--success)' : 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                            {sch.active ? 'Active' : 'Paused'}
                          </span>
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(sch.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '12px 16px' }}>Dispatched At</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Channel</th>
                  <th style={{ padding: '12px 16px' }}>Message Sent</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No notifications dispatched yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                        {new Date(log.dispatchedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.customerName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{log.customerPhone}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
                        {log.channel}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {log.messageContent}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success)' }}>
                          <CheckCircle size={10} /> {log.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Bell size={18} color="var(--accent-primary)" /> Configure Monthly Recurring Reminder
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule}>
              <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Customer <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  {selectedCustomer ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--info-bg)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCustomer.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</div>
                      </div>
                      <button type="button" onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer' }}>
                        ✕ Change
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customer by name or phone..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                      />
                      {customerResults.length > 0 && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', zIndex: 30, maxHeight: '160px', overflowY: 'auto' }}>
                          {customerResults.map((cust) => (
                            <div
                              key={cust.id}
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setCustomerSearch('');
                                setCustomerResults([]);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px' }}
                            >
                              <div style={{ fontWeight: 600 }}>{cust.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{cust.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Day of Every Month <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      value={form.dayOfMonth}
                      onChange={(e) => setForm({ ...form, dayOfMonth: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Delivery Channel
                    </label>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                    >
                      <option value="WHATSAPP">WhatsApp Message</option>
                      <option value="SMS">SMS Text Message</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Template Presets
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleTemplatePresetChange('MONTHLY_STORE_VISIT')}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: form.scheduleType === 'MONTHLY_STORE_VISIT' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: form.scheduleType === 'MONTHLY_STORE_VISIT' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🛍️ Store Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplatePresetChange('NEW_PRODUCTS_PROMO')}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: form.scheduleType === 'NEW_PRODUCTS_PROMO' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: form.scheduleType === 'NEW_PRODUCTS_PROMO' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✨ New Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplatePresetChange('MONTHLY_PAYMENT_DUE')}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: form.scheduleType === 'MONTHLY_PAYMENT_DUE' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: form.scheduleType === 'MONTHLY_PAYMENT_DUE' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      📋 Dues / Bill
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600 }}>Message Content</label>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Placeholders: {'{customerName}'}, {'{storeName}'}</span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={form.messageTemplate}
                    onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="pos-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '12px' }}>
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
