import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface AlertSettings {
  lowStockThreshold: number;
  damageCountThreshold: number;
  damageAmountThreshold: number;
  dailyRevenueTarget: number;
  dailyClosingReminderTime: string;
  enableDailyClosingReminder: boolean;
  enableSoundAlerts: boolean;
  enableLowStockAlerts: boolean;
  enableDamageAlerts: boolean;
}

export interface StoreAlert {
  id: string;
  alertKey: string;
  type: 'LOW_STOCK' | 'DAMAGE_WARNING' | 'DAILY_CLOSING_REMINDER' | 'REVENUE_TARGET' | 'GENERAL';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export const notificationApi = {
  // Fetch active store alerts from backend
  getActiveAlerts: async (): Promise<StoreAlert[]> => {
    const res = await apiClient.get<ApiResponse<StoreAlert[]>>('/notifications');
    return res.data.data || [];
  },

  // Permanently dismiss an alert in the backend DB
  dismissAlert: async (alertKey: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`/notifications/${encodeURIComponent(alertKey)}/dismiss`);
  },

  // Dismiss all active alerts
  dismissAllAlerts: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/notifications/dismiss-all');
  },

  // Mark an alert as read
  markAsRead: async (alertKey: string): Promise<void> => {
    await apiClient.patch<ApiResponse<void>>(`/notifications/${encodeURIComponent(alertKey)}/read`);
  },

  // Mark all active alerts as read
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch<ApiResponse<void>>('/notifications/read-all');
  },

  // Fetch shop holder alert threshold configuration
  getAlertSettings: async (): Promise<AlertSettings> => {
    const res = await apiClient.get<ApiResponse<AlertSettings>>('/notifications/settings');
    return res.data.data;
  },

  // Save shop holder alert threshold configuration
  updateAlertSettings: async (settings: Partial<AlertSettings>): Promise<AlertSettings> => {
    const res = await apiClient.put<ApiResponse<AlertSettings>>('/notifications/settings', settings);
    return res.data.data;
  },
};
