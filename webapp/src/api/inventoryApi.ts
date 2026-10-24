import { apiClient } from './client';
import {
  ApiResponse,
  PageResponse,
  Category,
  CreateCategoryRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  StockAdjustmentRequest,
  StockReceiveRequest,
  StockMovementResponse,
  InventorySummary,
  InventoryTransaction,
} from '../types';

export const inventoryApi = {
  // Categories
  getActiveCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/shop/catalog/categories');
    return res.data.data;
  },

  getAllCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/shop/catalog/categories/all');
    return res.data.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>('/shop/catalog/categories', data);
    return res.data.data;
  },

  updateCategory: async (id: number, data: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/shop/catalog/categories/${id}`, data);
    return res.data.data;
  },

  // Products
  searchProducts: async (params?: {
    search?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Product>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Product>>>('/shop/catalog/products', { params });
    return res.data.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/shop/catalog/products/${id}`);
    return res.data.data;
  },

  getProductByBarcode: async (barcode: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/shop/catalog/products/by-barcode/${encodeURIComponent(barcode)}`);
    return res.data.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>('/shop/catalog/products', data);
    return res.data.data;
  },

  updateProduct: async (id: number, data: UpdateProductRequest): Promise<Product> => {
    const res = await apiClient.put<ApiResponse<Product>>(`/shop/catalog/products/${id}`, data);
    return res.data.data;
  },

  // Inventory & Stock Ledger
  getSummary: async (): Promise<InventorySummary> => {
    const res = await apiClient.get<ApiResponse<InventorySummary>>('/shop/inventory/summary');
    return res.data.data;
  },

  getLowStockAlerts: async (): Promise<Product[]> => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/shop/inventory/low-stock');
    return res.data.data;
  },

  adjustStock: async (data: StockAdjustmentRequest): Promise<StockMovementResponse> => {
    const res = await apiClient.post<ApiResponse<StockMovementResponse>>('/shop/inventory/adjust', data);
    return res.data.data;
  },

  receiveStock: async (data: StockReceiveRequest): Promise<StockMovementResponse> => {
    const res = await apiClient.post<ApiResponse<StockMovementResponse>>('/shop/inventory/receive', data);
    return res.data.data;
  },

  getGlobalLedger: async (params?: { page?: number; size?: number }): Promise<PageResponse<InventoryTransaction>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<InventoryTransaction>>>('/shop/inventory/ledger', { params });
    return res.data.data;
  },

  getProductLedger: async (productId: number, params?: { page?: number; size?: number }): Promise<PageResponse<InventoryTransaction>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<InventoryTransaction>>>(`/shop/inventory/${productId}/ledger`, { params });
    return res.data.data;
  },
};
