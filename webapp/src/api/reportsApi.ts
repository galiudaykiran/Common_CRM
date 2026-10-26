import { apiClient } from './client';
import {
  ApiResponse,
  PageResponse,
  FinancialSummary,
  DailyTrendPoint,
  PaymentModeStat,
  ProductProfitabilityStat,
  SlowMovingStockStat,
  TaxGstSummary,
  ShopExpense,
  CreateExpenseRequest,
  CategoryExpenseBreakdown,
} from '../types';

export const reportsApi = {
  // Financial Summary (P&L KPIs)
  getFinancialSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialSummary> => {
    const res = await apiClient.get<ApiResponse<FinancialSummary>>('/shop/reports/financial-summary', { params });
    return res.data.data;
  },

  // Daily Trends for Time Series Visuals
  getDailyTrends: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DailyTrendPoint[]> => {
    const res = await apiClient.get<ApiResponse<DailyTrendPoint[]>>('/shop/reports/daily-trends', { params });
    return res.data.data;
  },

  // Top Product Profitability & Margins
  getProductProfitability: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ProductProfitabilityStat[]> => {
    const res = await apiClient.get<ApiResponse<ProductProfitabilityStat[]>>('/shop/reports/product-profitability', { params });
    return res.data.data;
  },

  // Payment Mode Breakdown
  getPaymentModes: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentModeStat[]> => {
    const res = await apiClient.get<ApiResponse<PaymentModeStat[]>>('/shop/reports/payment-modes', { params });
    return res.data.data;
  },

  // Slow-Moving Capital
  getSlowMovingStock: async (limit: number = 10): Promise<SlowMovingStockStat[]> => {
    const res = await apiClient.get<ApiResponse<SlowMovingStockStat[]>>('/shop/reports/slow-moving-stock', {
      params: { limit },
    });
    return res.data.data;
  },

  // GST & Tax Compliance Summary
  getTaxSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TaxGstSummary> => {
    const res = await apiClient.get<ApiResponse<TaxGstSummary>>('/shop/reports/tax-summary', { params });
    return res.data.data;
  },

  // Expenses Management
  createExpense: async (request: CreateExpenseRequest): Promise<ShopExpense> => {
    const res = await apiClient.post<ApiResponse<ShopExpense>>('/shop/expenses', request);
    return res.data.data;
  },

  getExpenses: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ShopExpense>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<ShopExpense>>>('/shop/expenses', { params });
    return res.data.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/shop/expenses/${id}`);
  },

  getExpenseCategoryBreakdown: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CategoryExpenseBreakdown[]> => {
    const res = await apiClient.get<ApiResponse<CategoryExpenseBreakdown[]>>('/shop/expenses/breakdown', { params });
    return res.data.data;
  },
};
