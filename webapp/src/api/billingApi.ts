import { apiClient } from './client';
import {
  ApiResponse,
  PageResponse,
  Customer,
  CreateCustomerRequest,
  CreateInvoiceRequest,
  InvoiceResponse,
  ThermalReceiptResponse,
  CustomerNotificationSchedule,
  CreateScheduleRequest,
  NotificationDeliveryLog,
} from '../types';

export const billingApi = {
  // POS & Invoicing
  checkout: async (request: CreateInvoiceRequest): Promise<InvoiceResponse> => {
    const res = await apiClient.post<ApiResponse<InvoiceResponse>>('/shop/billing/checkout', request);
    return res.data.data;
  },

  searchInvoices: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<InvoiceResponse>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<InvoiceResponse>>>('/shop/billing/invoices', { params });
    return res.data.data;
  },

  getInvoiceById: async (id: number): Promise<InvoiceResponse> => {
    const res = await apiClient.get<ApiResponse<InvoiceResponse>>(`/shop/billing/invoices/${id}`);
    return res.data.data;
  },

  getInvoiceByNumber: async (invoiceNumber: string): Promise<InvoiceResponse> => {
    const res = await apiClient.get<ApiResponse<InvoiceResponse>>(`/shop/billing/invoices/by-number/${encodeURIComponent(invoiceNumber)}`);
    return res.data.data;
  },

  getThermalReceipt: async (invoiceNumber: string): Promise<ThermalReceiptResponse> => {
    const res = await apiClient.get<ApiResponse<ThermalReceiptResponse>>(`/shop/billing/invoices/${encodeURIComponent(invoiceNumber)}/receipt`);
    return res.data.data;
  },

  // Customers
  createCustomer: async (request: CreateCustomerRequest): Promise<Customer> => {
    const res = await apiClient.post<ApiResponse<Customer>>('/shop/customers', request);
    return res.data.data;
  },

  searchCustomers: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Customer>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Customer>>>('/shop/customers', { params });
    return res.data.data;
  },

  quickSearchCustomers: async (query: string): Promise<Customer[]> => {
    const res = await apiClient.get<ApiResponse<Customer[]>>('/shop/customers/quick-search', {
      params: { query },
    });
    return res.data.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const res = await apiClient.get<ApiResponse<Customer>>(`/shop/customers/${id}`);
    return res.data.data;
  },

  // Notification Schedules (Monthly Recurring Reminders & Alerts)
  createSchedule: async (request: CreateScheduleRequest): Promise<CustomerNotificationSchedule> => {
    const res = await apiClient.post<ApiResponse<CustomerNotificationSchedule>>('/shop/notifications/schedules', request);
    return res.data.data;
  },

  getSchedules: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<CustomerNotificationSchedule>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<CustomerNotificationSchedule>>>('/shop/notifications/schedules', { params });
    return res.data.data;
  },

  toggleSchedule: async (id: number): Promise<CustomerNotificationSchedule> => {
    const res = await apiClient.patch<ApiResponse<CustomerNotificationSchedule>>(`/shop/notifications/schedules/${id}/toggle`);
    return res.data.data;
  },

  deleteSchedule: async (id: number): Promise<void> => {
    await apiClient.delete(`/shop/notifications/schedules/${id}`);
  },

  triggerSchedulesNow: async (): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/shop/notifications/schedules/trigger-now');
    return res.data.data;
  },

  getDeliveryLogs: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<NotificationDeliveryLog>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<NotificationDeliveryLog>>>('/shop/notifications/logs', { params });
    return res.data.data;
  },
};
