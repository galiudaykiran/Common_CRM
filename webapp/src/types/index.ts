export interface UserProfile {
  id: number;
  tenantId: number | null;
  username: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: string;
  requestId: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface BusinessType {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformModule {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  coreModule: boolean;
  createdAt: string;
}

export interface ShopSummary {
  id: number;
  code: string;
  name: string;
  tenantId: number;
  tenantName: string;
  tenantCode?: string;
  businessTypeId: number;
  businessTypeCode: string;
  businessTypeName: string;
  phone: string;
  email: string;
  city: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  currency: string;
  ownerFullName?: string;
  ownerUsername?: string;
  createdAt: string;
}

export interface ShopDetail extends ShopSummary {
  address: string;
  state: string;
  postalCode: string;
  timezone: string;
  version: number;
  updatedAt: string;
  configuration?: {
    taxNumber: string;
    defaultTaxRate: number;
    invoicePrefix: string;
    settingsJson?: string;
  };
  owner?: {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  modules?: Array<{
    moduleId: number;
    moduleCode: string;
    moduleName: string;
    enabled: boolean;
  }>;
}

export interface CreateShopRequest {
  shopCode: string;
  shopName: string;
  businessTypeId: number;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  currency: string;
  timezone: string;
  ownerUsername: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFullName: string;
  ownerPhone?: string;
  taxNumber?: string;
  defaultTaxRate?: number;
  invoicePrefix?: string;
  enabledModuleIds?: number[];
}

export interface AuditLogItem {
  id: number;
  actorUserId: number;
  actorUsername: string;
  tenantId: number | null;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  requestId: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  businessTypesCount: number;
  recentShops: ShopSummary[];
  recentActivity: AuditLogItem[];
}

export interface OtpResponse {
  otp: string;
  expiresInSeconds: number;
  purpose: string;
  message: string;
}

export interface ResetOwnerPasswordRequest {
  newPassword: string;
  otp: string;
}

export interface UpdateShopOwnerRequest {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  syncShopContact?: boolean;
  otp: string;
}

export interface UpdateShopProfileRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  currency?: string;
  timezone?: string;
}

export interface ShopOwnerDashboard {
  shopId: number;
  shopName: string;
  shopCode: string;
  tenantId: number;
  tenantName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  status: string;
  businessTypeId: number;
  businessTypeCode: string;
  businessTypeName: string;
  enabledModuleCodes: string[];
  modules: Array<{
    moduleId: number;
    code: string;
    name: string;
    description: string;
    core: boolean;
    enabled: boolean;
  }>;
  stats: {
    todaySalesCount: number;
    todayRevenue: number;
    yesterdayRevenue?: number;
    revenueGrowthPercent?: number;
    totalProducts: number;
    lowStockCount: number;
    activeEmployees: number;
    activeCustomers: number;
    pendingOrders: number;
  };
  recentActivity: AuditLogItem[];
}

export interface UpdateShopOwnerProfileRequest {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxNumber?: string;
  defaultTaxRate?: number;
  invoicePrefix?: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  tenantId: number;
  shopId: number;
  shopName: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  designation: string;
  department?: string;
  roleCode: string;
  roleName: string;
  joiningDate?: string;
  monthlySalary: number;
  salaryPayoutMethod: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  panOrIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  monthlyPayroll: number;
}

export interface CreateEmployeeRequest {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  designation: string;
  department?: string;
  roleCode?: string;
  joiningDate?: string;
  monthlySalary?: number;
  salaryPayoutMethod?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  panOrIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface UpdateEmployeeRequest {
  fullName: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  designation: string;
  department?: string;
  roleCode?: string;
  joiningDate?: string;
  monthlySalary?: number;
  salaryPayoutMethod?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  panOrIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status?: string;
  notes?: string;
}

// ==================== Inventory & Catalog Types ====================

export interface Category {
  id: number;
  name: string;
  code: string;
  parentId?: number | null;
  parentName?: string | null;
  description?: string;
  status: string;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  code?: string;
  parentId?: number | null;
  description?: string;
  status?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  hsnSacCode?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate: number;
  taxInclusive: boolean;
  reorderLevel: number;
  safetyStock: number;
  status: string;
  imageUrl?: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  binLocation?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: number | null;
  hsnSacCode?: string;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate?: number;
  taxInclusive?: boolean;
  reorderLevel?: number;
  safetyStock?: number;
  initialStock?: number;
  binLocation?: string;
  description?: string;
  status?: string;
}

export interface UpdateProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: number | null;
  hsnSacCode?: string;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate?: number;
  taxInclusive?: boolean;
  reorderLevel?: number;
  safetyStock?: number;
  binLocation?: string;
  description?: string;
  status?: string;
}

export interface StockAdjustmentRequest {
  productId: number;
  adjustmentType: 'CORRECTION' | 'DAMAGE_LOSS' | 'THEFT_SHRINKAGE' | 'FOUND_STOCK';
  quantity: number;
  notes: string;
  referenceId?: string;
}

export interface StockReceiveRequest {
  productId: number;
  quantity: number;
  unitCost?: number;
  invoiceNumber?: string;
  notes?: string;
}

export interface StockMovementResponse {
  transactionId: number;
  productId: number;
  sku: string;
  productName: string;
  transactionType: string;
  quantityBefore: number;
  quantityDelta: number;
  quantityAfter: number;
  notes?: string;
}

export interface InventorySummary {
  totalProducts: number;
  activeProducts: number;
  totalStockUnits: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  transactionType: string;
  referenceType?: string;
  referenceId?: string;
  quantityBefore: number;
  quantityDelta: number;
  quantityAfter: number;
  unitCost: number;
  totalValuation: number;
  notes?: string;
  createdByUserId?: number;
  createdAt: string;
}

export interface ShopBasicInfo {
  shopId: number;
  shopName: string;
  shopCode: string;
  tenantId: number;
  tenantName: string;
  status: string;
  enabledModuleCodes: string[];
}

// ----------------- Billing & Customer Types -----------------
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  totalSpent: number;
  creditBalance: number;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
}

export interface CreateInvoiceItemRequest {
  productId: number;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateInvoicePaymentRequest {
  paymentMode: string;
  amount: number;
  transactionReference?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface CreateInvoiceRequest {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string;
  customerAddress?: string;
  invoiceDiscountTotal?: number;
  paymentMode: string;
  primaryPaymentMode?: string;
  amountPaid: number;
  payments?: CreateInvoicePaymentRequest[];
  notes?: string;
  sendReceiptNotification?: boolean;
  items: CreateInvoiceItemRequest[];
}

export interface InvoiceItemResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  hsnSacCode?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface InvoicePaymentResponse {
  id: number;
  paymentMode: string;
  amount: number;
  transactionReference?: string;
  paymentStatus: string;
  paidAt: string;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  cashierId: number;
  cashierName: string;
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  changeReturned: number;
  primaryPaymentMode: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  items: InvoiceItemResponse[];
  payments: InvoicePaymentResponse[];
}

export interface ThermalReceiptItem {
  name: string;
  sku: string;
  hsnSacCode?: string;
  quantity: number;
  unitOfMeasure?: string;
  rate: number;
  taxRate: number;
  discount: number;
  lineTotal: number;
}

export interface ThermalReceiptResponse {
  storeName: string;
  storeCode: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeGstin?: string;
  storeState?: string;
  invoiceNumber: string;
  dateFormatted: string;
  timeFormatted: string;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  changeReturned: number;
  paymentMode: string;
  returnPolicyText: string;
  footerThankYou: string;
}

export interface CustomerNotificationSchedule {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  title: string;
  scheduleType: string;
  dayOfMonth: number;
  channel: string;
  messageTemplate: string;
  active: boolean;
  createdByName: string;
  lastSentAt?: string;
  nextRunDate: string;
  createdAt: string;
}

export interface CreateScheduleRequest {
  customerId: number;
  title: string;
  scheduleType: string;
  dayOfMonth: number;
  channel: string;
  messageTemplate: string;
}

export interface NotificationDeliveryLog {
  id: number;
  scheduleId?: number;
  customerName: string;
  customerPhone: string;
  channel: string;
  messageContent: string;
  deliveryStatus: string;
  triggerType: string;
  dispatchedAt: string;
  errorMessage?: string;
}

// ----------------- Reports & Expenses Types -----------------
export interface FinancialSummary {
  startDate: string;
  endDate: string;
  periodLabel: string;
  totalInvoicesCount: number;
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  inventoryShrinkageLoss: number;
  totalOutflows: number;
  netProfit: number;
  netMarginPercent: number;
  isNetProfit: boolean;
  totalGstCollected: number;
  averageBillValue: number;
  previousGrossRevenue?: number;
  revenueGrowthPercent?: number;
  previousInvoicesCount?: number;
  retailRevenue?: number;
  retailInvoicesCount?: number;
  diningRevenue?: number;
  diningBillsCount?: number;
}

export interface DailyTrendPoint {
  dateFormatted: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  billCount: number;
}

export interface PaymentModeStat {
  paymentMode: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface ProductProfitabilityStat {
  productId: number;
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface SlowMovingStockStat {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  unitCost: number;
  tiedUpCapital: number;
  categoryName: string;
}

export interface TaxGstSummary {
  totalTaxableTurnover: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTaxCollected: number;
  totalTaxableInvoices: number;
}

export interface ShopExpense {
  id: number;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMode?: string;
  receiptReference?: string;
  notes?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMode?: string;
  receiptReference?: string;
  notes?: string;
}

export interface CategoryExpenseBreakdown {
  category: string;
  totalAmount: number;
  percentage: number;
}


