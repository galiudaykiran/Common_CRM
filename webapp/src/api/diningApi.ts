import { apiClient } from './client';

export interface DiningDashboardStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  billRequestedTables: number;
  cleaningTables: number;
  activeSessions: number;
  activeOrders: number;
  preparingItems: number;
  readyItems: number;
  servedItems: number;
  todayOrderCount: number;
  todayDiningRevenue: number;
}

export interface DiningArea {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  tableCount: number;
}

export interface DiningTable {
  id: number;
  areaId?: number;
  areaName?: string;
  tableNumber: string;
  seatingCapacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILL_REQUESTED' | 'CLEANING';
  qrCodeToken: string;
  qrMenuUrl: string;
  active: boolean;
  currentSessionId?: number;
  currentSessionCode?: string;
  guestCount?: number;
  customerName?: string;
  sessionOpenedAt?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  dishCount: number;
}

export interface DishVariant {
  id?: number;
  name: string;
  price: number;
  active?: boolean;
}

export interface DishAddon {
  id?: number;
  name: string;
  price: number;
  active?: boolean;
}

export interface Dish {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  dietaryType: 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
  basePrice: number;
  preparationTimeMinutes: number;
  taxRate: number;
  isFeatured: boolean;
  displayOrder: number;
  active: boolean;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMP_UNAVAILABLE' | 'OUT_OF_STOCK';
  availabilityReason?: string;
  availabilityUpdatedAt?: string;
  variants: DishVariant[];
  addons: DishAddon[];
}

export interface DiningOrderItem {
  id: number;
  orderId: number;
  dishId: number;
  dishName: string;
  variantName?: string;
  variantPrice: number;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  totalPrice: number;
  specialInstructions?: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
}

export interface DiningOrder {
  id: number;
  sessionId: number;
  sessionCode: string;
  tableNumber: string;
  orderNumber: string;
  notes?: string;
  status: string;
  placedAt: string;
  orderTotal: number;
  items: DiningOrderItem[];
}

export interface DiningPayment {
  id: number;
  billId: number;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  transactionReference?: string;
  recordedByUsername?: string;
  createdAt: string;
}

export interface DiningBill {
  id: number;
  sessionId: number;
  sessionCode: string;
  tableNumber: string;
  billNumber: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  serviceCharge: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  createdAt: string;
  payments: DiningPayment[];
}

export interface DiningSession {
  id: number;
  tableId: number;
  tableNumber: string;
  areaName?: string;
  sessionCode: string;
  guestCount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  openedAt: string;
  closedAt?: string;
  status: 'ACTIVE' | 'BILLED' | 'CLOSED' | 'CANCELLED';
  ordersTotal: number;
  orders: DiningOrder[];
  bill?: DiningBill;
}

export interface PublicDiningMenu {
  shopName: string;
  shopCode: string;
  currency: string;
  tableNumber: string;
  areaName: string;
  categories: MenuCategory[];
  dishes: Dish[];
}

export const diningApi = {
  // Dashboard
  getDashboard: async (): Promise<DiningDashboardStats> => {
    const res = await apiClient.get('/dining/dashboard');
    return res.data.data;
  },

  // Areas
  getAreas: async (): Promise<DiningArea[]> => {
    const res = await apiClient.get('/dining/areas');
    return res.data.data;
  },
  createArea: async (data: Partial<DiningArea>): Promise<DiningArea> => {
    const res = await apiClient.post('/dining/areas', data);
    return res.data.data;
  },
  updateArea: async (id: number, data: Partial<DiningArea>): Promise<DiningArea> => {
    const res = await apiClient.put(`/dining/areas/${id}`, data);
    return res.data.data;
  },
  deleteArea: async (id: number): Promise<void> => {
    await apiClient.delete(`/dining/areas/${id}`);
  },

  // Tables
  getTables: async (areaId?: number): Promise<DiningTable[]> => {
    const res = await apiClient.get('/dining/tables', { params: { areaId } });
    return res.data.data;
  },
  getTable: async (id: number): Promise<DiningTable> => {
    const res = await apiClient.get(`/dining/tables/${id}`);
    return res.data.data;
  },
  createTable: async (data: Partial<DiningTable>): Promise<DiningTable> => {
    const res = await apiClient.post('/dining/tables', data);
    return res.data.data;
  },
  updateTable: async (id: number, data: Partial<DiningTable>): Promise<DiningTable> => {
    const res = await apiClient.put(`/dining/tables/${id}`, data);
    return res.data.data;
  },
  updateTableStatus: async (id: number, status: string): Promise<DiningTable> => {
    const res = await apiClient.put(`/dining/tables/${id}/status`, { status });
    return res.data.data;
  },
  regenerateQrToken: async (id: number): Promise<DiningTable> => {
    const res = await apiClient.post(`/dining/tables/${id}/regenerate-qr`);
    return res.data.data;
  },
  deleteTable: async (id: number): Promise<void> => {
    await apiClient.delete(`/dining/tables/${id}`);
  },

  // Categories
  getCategories: async (): Promise<MenuCategory[]> => {
    const res = await apiClient.get('/dining/categories');
    return res.data.data;
  },
  createCategory: async (data: Partial<MenuCategory>): Promise<MenuCategory> => {
    const res = await apiClient.post('/dining/categories', data);
    return res.data.data;
  },
  updateCategory: async (id: number, data: Partial<MenuCategory>): Promise<MenuCategory> => {
    const res = await apiClient.put(`/dining/categories/${id}`, data);
    return res.data.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/dining/categories/${id}`);
  },

  // Dishes
  getDishes: async (params?: { categoryId?: number; dietaryType?: string; availabilityStatus?: string; search?: string }): Promise<Dish[]> => {
    const res = await apiClient.get('/dining/dishes', { params });
    return res.data.data;
  },
  getDish: async (id: number): Promise<Dish> => {
    const res = await apiClient.get(`/dining/dishes/${id}`);
    return res.data.data;
  },
  createDish: async (data: Partial<Dish>): Promise<Dish> => {
    const res = await apiClient.post('/dining/dishes', data);
    return res.data.data;
  },
  updateDish: async (id: number, data: Partial<Dish>): Promise<Dish> => {
    const res = await apiClient.put(`/dining/dishes/${id}`, data);
    return res.data.data;
  },
  deleteDish: async (id: number): Promise<void> => {
    await apiClient.delete(`/dining/dishes/${id}`);
  },

  // Availability
  updateDishAvailability: async (data: { dishId?: number; dishIds?: number[]; status: string; reason?: string }): Promise<Dish[]> => {
    const res = await apiClient.put('/dining/dishes/availability', data);
    return res.data.data;
  },

  // Sessions
  getActiveSessions: async (): Promise<DiningSession[]> => {
    const res = await apiClient.get('/dining/sessions/active');
    return res.data.data;
  },
  getSession: async (id: number): Promise<DiningSession> => {
    const res = await apiClient.get(`/dining/sessions/${id}`);
    return res.data.data;
  },
  getSessionByTable: async (tableId: number): Promise<DiningSession> => {
    const res = await apiClient.get(`/dining/sessions/table/${tableId}`);
    return res.data.data;
  },
  startSession: async (data: { tableId: number; guestCount: number; customerName?: string; customerPhone?: string; notes?: string }): Promise<DiningSession> => {
    const res = await apiClient.post('/dining/sessions/start', data);
    return res.data.data;
  },
  closeSession: async (id: number): Promise<DiningSession> => {
    const res = await apiClient.post(`/dining/sessions/${id}/close`);
    return res.data.data;
  },

  // Orders
  getActiveOrders: async (): Promise<DiningOrder[]> => {
    const res = await apiClient.get('/dining/orders/active');
    return res.data.data;
  },
  getOrdersBySession: async (sessionId: number): Promise<DiningOrder[]> => {
    const res = await apiClient.get(`/dining/orders/session/${sessionId}`);
    return res.data.data;
  },
  getKitchenItems: async (): Promise<DiningOrderItem[]> => {
    const res = await apiClient.get('/dining/orders/kitchen/items');
    return res.data.data;
  },
  placeOrder: async (data: {
    sessionId: number;
    notes?: string;
    items: Array<{
      dishId: number;
      variantName?: string;
      variantPrice?: number;
      quantity: number;
      specialInstructions?: string;
    }>;
  }): Promise<DiningOrder> => {
    const res = await apiClient.post('/dining/orders', data);
    return res.data.data;
  },
  updateOrderItemStatus: async (itemId: number, data: { status: string; remarks?: string }): Promise<DiningOrderItem> => {
    const res = await apiClient.put(`/dining/orders/items/${itemId}/status`, data);
    return res.data.data;
  },

  // Billing
  getBills: async (paymentStatus?: string): Promise<DiningBill[]> => {
    const res = await apiClient.get('/dining/bills', { params: { paymentStatus } });
    return res.data.data;
  },
  getBillBySession: async (sessionId: number): Promise<DiningBill> => {
    const res = await apiClient.get(`/dining/bills/session/${sessionId}`);
    return res.data.data;
  },
  generateBill: async (sessionId: number, data?: { discountTotal?: number; serviceCharge?: number }): Promise<DiningBill> => {
    const res = await apiClient.post(`/dining/bills/session/${sessionId}/generate`, data || {});
    return res.data.data;
  },
  recordPayment: async (billId: number, data: { amount: number; paymentMode: string; transactionReference?: string }): Promise<DiningBill> => {
    const res = await apiClient.post(`/dining/bills/${billId}/payments`, data);
    return res.data.data;
  },

  // Public QR Menu (no auth token required)
  getPublicMenu: async (qrToken: string): Promise<PublicDiningMenu> => {
    const res = await apiClient.get(`/public/dining/menu/${qrToken}`);
    return res.data.data;
  },
};
