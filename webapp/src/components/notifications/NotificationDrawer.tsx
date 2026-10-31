import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, AlertSettings } from '../../context/NotificationContext';
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  Settings,
  Check,
  CheckCheck,
  Package,
  ShieldAlert,
  ArrowRight,
  Flame,
  Volume2,
  Trash2,
} from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    alerts,
    unreadCount,
    settings,
    updateSettings,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    dismissAllAlerts,
    playTestSound,
    isAlertDrawerOpen,
    setIsAlertDrawerOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
  } = useNotifications();

  const navigate = useNavigate();
  const [tempSettings, setTempSettings] = useState<AlertSettings>(settings);
  const [filterType, setFilterType] = useState<'ALL' | 'STOCK' | 'REMINDERS'>('ALL');
  const [saveToast, setSaveToast] = useState(false);

  // Sync temp settings when opening modal
  const openSettings = () => {
    setTempSettings(settings);
    setIsSettingsModalOpen(true);
  };

  const saveAlertSettings = () => {
    updateSettings(tempSettings);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      setIsSettingsModalOpen(false);
    }, 1200);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'STOCK') return a.type === 'LOW_STOCK';
    if (filterType === 'REMINDERS') return a.type === 'DAILY_CLOSING_REMINDER' || a.type === 'DAMAGE_WARNING';
    return true;
  });

  return (
    <>
      {/* =====================================================================
          1. SLIDE-OVER / POPUP NOTIFICATION CENTER
          ===================================================================== */}
      {isAlertDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setIsAlertDrawerOpen(false)}
        >
          <div
            style={{
              width: '420px',
              maxWidth: '92vw',
              height: '100vh',
              background: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-subtle)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Store Alerts &amp; Notifications
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={openSettings}
                  className="btn-icon"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  title="Configure alert thresholds & daily closing time"
                >
                  <Settings size={15} />
                </button>
                <button
                  onClick={() => setIsAlertDrawerOpen(false)}
                  className="btn-icon"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-header Filter Tabs */}
            <div
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setFilterType('ALL')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterType === 'ALL' ? 'var(--accent-primary)' : 'transparent',
                    color: filterType === 'ALL' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  All ({alerts.length})
                </button>
                <button
                  onClick={() => setFilterType('STOCK')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterType === 'STOCK' ? 'var(--accent-primary)' : 'transparent',
                    color: filterType === 'STOCK' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setFilterType('REMINDERS')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterType === 'REMINDERS' ? 'var(--accent-primary)' : 'transparent',
                    color: filterType === 'REMINDERS' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Reminders &amp; Losses
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark read</span>
                  </button>
                )}
                {alerts.length > 0 && (
                  <button
                    onClick={dismissAllAlerts}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Permanently dismiss all current alerts"
                  >
                    <Trash2 size={12} />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Alerts List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>No active alerts</div>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Store inventory, daily closing targets, and operations are running smoothly!
                  </p>
                  <button
                    onClick={openSettings}
                    style={{
                      marginTop: '1rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Adjust Alert Thresholds
                  </button>
                </div>
              ) : (
                filteredAlerts.map((a) => {
                  const isCritical = a.severity === 'critical';
                  const isWarning = a.severity === 'warning';
                  const borderColor = isCritical ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.3)';
                  const iconBg = isCritical ? 'rgba(239, 68, 68, 0.12)' : isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)';
                  const iconColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--accent-primary)';

                  return (
                    <div
                      key={a.id}
                      style={{
                        background: a.read ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: a.read ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                      }}
                      onClick={() => markAsRead(a.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: iconBg,
                              color: iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {a.type === 'LOW_STOCK' ? (
                              <Package size={14} />
                            ) : a.type === 'DAILY_CLOSING_REMINDER' ? (
                              <Clock size={14} />
                            ) : a.type === 'DAMAGE_WARNING' ? (
                              <ShieldAlert size={14} />
                            ) : (
                              <TrendingUp size={14} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {a.title}
                            </div>
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{a.timestamp}</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissAlert(a.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title="Dismiss alert"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {a.message}
                      </p>

                      {a.actionUrl && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAlertDrawerOpen(false);
                              navigate(a.actionUrl!);
                            }}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--accent-primary)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{a.actionLabel || 'View Details'}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Config Action */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Closing digest set for <strong>{settings.dailyClosingReminderTime}</strong>
              </div>
              <button
                onClick={openSettings}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Settings size={13} />
                <span>Configure Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. ALERT THRESHOLD CONFIGURATION MODAL (FOR SHOP HOLDER)
          ===================================================================== */}
      {isSettingsModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            style={{
              width: '500px',
              maxWidth: '92vw',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              animation: 'scaleIn 0.2s ease',
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Settings size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Store Alert &amp; Reminder Rules
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Configured by Shop Holder to trigger automatic daily alerts
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="btn-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {saveToast && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#059669',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={15} />
                  <span>Alert rules saved successfully!</span>
                </div>
              )}

              {/* 1. Low Stock Threshold */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Low Stock Alert Threshold (Units)
                </label>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Trigger warning when any product stock drops to or below this count.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[5, 10, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, lowStockThreshold: val })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: tempSettings.lowStockThreshold === val ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: tempSettings.lowStockThreshold === val ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                        color: tempSettings.lowStockThreshold === val ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {val} units
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tempSettings.lowStockThreshold}
                    onChange={(e) => setTempSettings({ ...tempSettings, lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* 2. Damage / Shrinkage Threshold */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Damage &amp; Shrinkage Loss Alert Limit (₹ Amount)
                </label>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Trigger high-severity alert if daily inventory waste or loss exceeds this amount.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, damageAmountThreshold: val })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: tempSettings.damageAmountThreshold === val ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: tempSettings.damageAmountThreshold === val ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                        color: tempSettings.damageAmountThreshold === val ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      ₹{val}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={tempSettings.damageAmountThreshold}
                    onChange={(e) => setTempSettings({ ...tempSettings, damageAmountThreshold: parseInt(e.target.value, 10) || 1000 })}
                    style={{
                      width: '100px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* 3. Daily Store Closing Reminder Time (10 PM or 11 PM configured by shop holder) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Daily Store Closing Digest Reminder Time
                </label>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Configured daily closing alert to review cash, register totals, and end-of-day reports.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '9:00 PM', time: '21:00' },
                    { label: '10:00 PM', time: '22:00' },
                    { label: '11:00 PM', time: '23:00' },
                  ].map((preset) => (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, dailyClosingReminderTime: preset.time })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: tempSettings.dailyClosingReminderTime === preset.time ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: tempSettings.dailyClosingReminderTime === preset.time ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                        color: tempSettings.dailyClosingReminderTime === preset.time ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <input
                    type="time"
                    value={tempSettings.dailyClosingReminderTime}
                    onChange={(e) => setTempSettings({ ...tempSettings, dailyClosingReminderTime: e.target.value })}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* 4. Daily Revenue Target */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Daily Revenue Target (₹ Goal)
                </label>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Celebrate target milestones and notify when daily counter sales reach this threshold.
                </div>
                <input
                  type="number"
                  step="1000"
                  value={tempSettings.dailyRevenueTarget}
                  onChange={(e) => setTempSettings({ ...tempSettings, dailyRevenueTarget: parseInt(e.target.value, 10) || 0 })}
                  style={{
                    width: '160px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* 5. Audio Chime Alerts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Audio Alert Chime</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Play modern SaaS chime when alerts or reminders arrive</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={playTestSound}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Play chime preview"
                  >
                    Test Chime
                  </button>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tempSettings.enableSoundAlerts}
                      onChange={(e) => setTempSettings({ ...tempSettings, enableSoundAlerts: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: tempSettings.enableSoundAlerts ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        borderRadius: '22px',
                        transition: '0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          height: '16px',
                          width: '16px',
                          left: tempSettings.enableSoundAlerts ? '19px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.2s',
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAlertSettings}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={15} />
                <span>Save Alert Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
