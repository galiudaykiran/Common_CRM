import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { notificationApi, StoreAlert, AlertSettings } from '../api/notificationApi';
import { soundFx } from '../utils/soundEffects';

export type { AlertSettings, StoreAlert };

interface NotificationContextType {
  alerts: StoreAlert[];
  unreadCount: number;
  settings: AlertSettings;
  updateSettings: (newSettings: Partial<AlertSettings>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  dismissAllAlerts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  playTestSound: () => void;
  isAlertDrawerOpen: boolean;
  setIsAlertDrawerOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
}

const DEFAULT_SETTINGS: AlertSettings = {
  lowStockThreshold: 10,
  damageCountThreshold: 10,
  damageAmountThreshold: 2000,
  dailyRevenueTarget: 5000,
  dailyClosingReminderTime: '22:00', // 10:00 PM default
  enableDailyClosingReminder: true,
  enableSoundAlerts: true,
  enableLowStockAlerts: true,
  enableDamageAlerts: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load local dismissed alert keys for instantaneous client-side shielding
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('shop_dismissed_alert_keys');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [settings, setSettings] = useState<AlertSettings>(() => {
    try {
      const saved = localStorage.getItem('shop_alert_config');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [alerts, setAlerts] = useState<StoreAlert[]>([]);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Track alert keys that have already been presented during this browser session
  const seenKeysRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // 1. Fetch persisted settings from backend on mount
  useEffect(() => {
    notificationApi
      .getAlertSettings()
      .then((serverSettings) => {
        if (serverSettings) {
          setSettings((prev) => {
            const merged = { ...prev, ...serverSettings };
            localStorage.setItem('shop_alert_config', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => {
        // Fallback to local settings if not logged in or network error
        console.debug('Using local notification settings fallback', err);
      });
  }, []);

  // 2. Fetch active alerts from backend rule engine
  const refreshAlerts = useCallback(async () => {
    try {
      const serverAlerts = await notificationApi.getActiveAlerts();

      // Read current dismissed keys to ensure race-condition safety
      let localDismissed: Set<string> = dismissedKeys;
      try {
        const saved = localStorage.getItem('shop_dismissed_alert_keys');
        if (saved) {
          localDismissed = new Set(JSON.parse(saved));
        }
      } catch {
        // ignore
      }

      // Filter out any dismissed alerts permanently
      const filtered = serverAlerts.filter(
        (a) => !localDismissed.has(a.id) && !localDismissed.has(a.alertKey)
      );

      // Check for genuinely new incoming alerts to play audio chime
      if (initialLoadDoneRef.current && settings.enableSoundAlerts) {
        const hasBrandNew = filtered.some(
          (a) => !seenKeysRef.current.has(a.id) && !seenKeysRef.current.has(a.alertKey)
        );
        if (hasBrandNew) {
          soundFx.playNotificationChime();
        }
      }

      // Record seen keys
      filtered.forEach((a) => {
        seenKeysRef.current.add(a.id);
        seenKeysRef.current.add(a.alertKey);
      });
      initialLoadDoneRef.current = true;

      setAlerts(filtered);
    } catch (err) {
      console.debug('Failed to refresh store alerts from backend', err);
    }
  }, [dismissedKeys, settings.enableSoundAlerts]);

  // 3. Dismiss an individual alert permanently
  const dismissAlert = async (id: string) => {
    // Immediate optimistic UI update
    setAlerts((prev) => prev.filter((a) => a.id !== id && a.alertKey !== id));

    // Update local dismissed cache immediately
    setDismissedKeys((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem('shop_dismissed_alert_keys', JSON.stringify(Array.from(updated)));
      } catch {
        // ignore
      }
      return updated;
    });

    // Notify backend to permanently mark dismissed in DB
    try {
      await notificationApi.dismissAlert(id);
    } catch (err) {
      console.error('Failed to dismiss alert in backend', err);
    }
  };

  // 4. Dismiss all active alerts at once
  const dismissAllAlerts = async () => {
    const idsToDismiss = alerts.map((a) => a.alertKey || a.id);
    setAlerts([]);

    setDismissedKeys((prev) => {
      const updated = new Set(prev);
      idsToDismiss.forEach((id) => updated.add(id));
      try {
        localStorage.setItem('shop_dismissed_alert_keys', JSON.stringify(Array.from(updated)));
      } catch {
        // ignore
      }
      return updated;
    });

    try {
      await notificationApi.dismissAllAlerts();
    } catch (err) {
      console.error('Failed to dismiss all alerts in backend', err);
    }
  };

  // 5. Mark alert as read
  const markAsRead = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id || a.alertKey === id ? { ...a, read: true } : a))
    );
    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    }
  };

  // 6. Mark all alerts as read
  const markAllAsRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all alerts as read', err);
    }
  };

  // 7. Update settings on backend & locally
  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('shop_alert_config', JSON.stringify(updated));
      return updated;
    });

    try {
      await notificationApi.updateAlertSettings(newSettings);
      // Immediately refresh alerts with new thresholds
      refreshAlerts();
    } catch (err) {
      console.error('Failed to save alert settings to backend', err);
    }
  };

  const playTestSound = () => {
    soundFx.playNotificationChime();
  };

  // Periodic polling every 45 seconds
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 45000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <NotificationContext.Provider
      value={{
        alerts,
        unreadCount,
        settings,
        updateSettings,
        markAsRead,
        markAllAsRead,
        dismissAlert,
        dismissAllAlerts,
        refreshAlerts,
        playTestSound,
        isAlertDrawerOpen,
        setIsAlertDrawerOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
