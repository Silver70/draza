import { z } from "zod";

// ==================== DASHBOARD OVERVIEW TYPES ====================

export type DashboardOverview = {
  // Core metrics
  totalRevenue: string;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: string;

  // Revenue breakdown
  revenueByStatus: {
    pending: string;
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
    refunded: string;
  };

  // Order breakdown
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
  };

  // Customer breakdown
  customerBreakdown: {
    registered: number;
    guest: number;
  };

  // Inventory alerts
  lowStockCount: number;
  outOfStockCount: number;

  // Additional metrics
  taxCollected: string;
  shippingCollected: string;
};

// ==================== REVENUE ANALYTICS TYPES ====================

export type RevenueAnalytics = {
  totalRevenue: string;
  subtotal: string;
  taxCollected: string;
  shippingCollected: string;
  averageOrderValue: string;
  revenueByStatus: Record<string, string>;
};

export type RevenueTrend = {
  date: string;
  revenue: string;
  orderCount: number;
};

// ==================== ORDER ANALYTICS TYPES ====================

export type OrderAnalytics = {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  averageItemsPerOrder: string;
  cancelledRate: string;
  refundRate: string;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: Date;
};

// ==================== CUSTOMER ANALYTICS TYPES ====================

export type CustomerAnalytics = {
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  repeatCustomerRate: string;
  averageCustomerLifetimeValue: string;
};

export type TopCustomer = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: string;
};

export type CustomerGeography = {
  country: string;
  state: string;
  customerCount: number;
};

// ==================== PRODUCT ANALYTICS TYPES ====================

export type ProductAnalytics = {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  averagePrice: string;
};

export type TopSellingProduct = {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  quantitySold: number;
  revenue: string;
};

export type LowStockProduct = {
  variantId: string;
  productName: string;
  sku: string;
  quantityInStock: number;
  price: string;
};

// ==================== INVENTORY ANALYTICS TYPES ====================

export type InventoryAnalytics = {
  totalInventoryValue: string;
  lowStockCount: number;
  outOfStockCount: number;
  totalVariants: number;
};

// ==================== SALES TRENDS TYPES ====================

export type SalesTrend = {
  period: string; // e.g., "2024-01", "2024-W01", "2024-01-15"
  revenue: string;
  orders: number;
  averageOrderValue: string;
};

// ==================== TAX & SHIPPING ANALYTICS ====================

export type TaxAnalytics = {
  totalTaxCollected: string;
  taxByJurisdiction: {
    jurisdictionName: string;
    taxCollected: string;
    orderCount: number;
  }[];
};

export type ShippingAnalytics = {
  totalShippingRevenue: string;
  averageShippingCost: string;
  shippingByMethod: {
    methodName: string;
    orderCount: number;
    revenue: string;
  }[];
  freeShippingOrders: number;
};

// ==================== VALIDATION SCHEMAS ====================

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const periodSchema = z.enum(["day", "week", "month", "year"]);

export const revenueTrendQuerySchema = z.object({
  period: periodSchema.default("week"),
  limit: z.number().int().min(1).max(365).default(30),
});

export const topProductsQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["quantity", "revenue"]).default("revenue"),
});

export const topCustomersQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

export const recentOrdersQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

export const lowStockQuerySchema = z.object({
  threshold: z.number().int().min(1).default(10),
  limit: z.number().int().min(1).max(100).default(20),
});
