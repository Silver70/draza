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

// ==================== CAMPAIGN TRACKING TYPES ====================

export type Campaign = {
  id: string;
  parentCampaignId: string | null;
  name: string;
  description: string | null;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'twitter' | 'multi' | 'other';
  campaignType: 'post' | 'reel' | 'story' | 'video' | 'ad' | 'campaign';
  postUrl: string | null;
  trackingCode: string;
  cost: string;
  budget: string;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignVisit = {
  id: string;
  campaignId: string;
  sessionId: string;
  customerId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  landingPage: string | null;
  country: string | null;
  city: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other' | null;
  visitedAt: Date;
  lastActivityAt: Date;
  converted: boolean;
  conversionAt: Date | null;
  attributedOrderId: string | null;
  expiresAt: Date;
};

export type CampaignConversion = {
  id: string;
  campaignId: string;
  visitId: string;
  orderId: string;
  customerId: string;
  revenue: string;
  convertedAt: Date;
  createdAt: Date;
};

export type CampaignAnalytics = {
  campaign: Campaign;
  metrics: {
    totalVisits: number;
    uniqueVisitors: number;
    totalConversions: number;
    conversionRate: string; // Percentage
    totalRevenue: string;
    averageOrderValue: string;
    roi: string; // Percentage
    costPerVisit: string;
    costPerConversion: string;
  };
  timeline?: {
    date: string;
    visits: number;
    conversions: number;
    revenue: string;
  }[];
  topProducts?: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: string;
  }[];
  deviceBreakdown?: {
    deviceType: string;
    visits: number;
    conversions: number;
  }[];
  geographicBreakdown?: {
    country: string;
    visits: number;
    conversions: number;
    revenue: string;
  }[];
};

export type CampaignSummary = {
  id: string;
  name: string;
  platform: string;
  trackingCode: string;
  cost: string;
  visits: number;
  conversions: number;
  revenue: string;
  roi: string;
};

export type ParentCampaignAnalytics = {
  campaign: Campaign;
  metrics: {
    totalVisits: number;
    uniqueVisitors: number;
    totalConversions: number;
    conversionRate: string;
    totalRevenue: string;
    averageOrderValue: string;
    roi: string;
    costPerConversion: string;
  };
  children: CampaignSummary[];
  platformBreakdown?: {
    platform: string;
    visits: number;
    conversions: number;
    revenue: string;
  }[];
};

// ==================== CAMPAIGN VALIDATION SCHEMAS ====================

export const platformEnum = z.enum([
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'twitter',
  'multi',
  'other',
]);

export const campaignTypeEnum = z.enum([
  'post',
  'reel',
  'story',
  'video',
  'ad',
  'campaign',
]);

export const deviceTypeEnum = z.enum(['mobile', 'tablet', 'desktop', 'other']);

export const createCampaignSchema = z.object({
  parentCampaignId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: platformEnum,
  campaignType: campaignTypeEnum,
  postUrl: z.string().url().optional(),
  cost: z.number().nonnegative().optional().default(0),
  budget: z.number().nonnegative().optional().default(0),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  metadata: z.any().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  postUrl: z.string().url().optional(),
  cost: z.number().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const trackVisitSchema = z.object({
  trackingCode: z.string(),
  sessionId: z.string().uuid(),
  landingPage: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  ipAddress: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

export const updateActivitySchema = z.object({
  sessionId: z.string().uuid(),
});

export const campaignAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeTimeline: z.boolean().optional().default(false),
  includeProducts: z.boolean().optional().default(false),
  includeDeviceBreakdown: z.boolean().optional().default(false),
  includeGeographic: z.boolean().optional().default(false),
});

export const campaignListQuerySchema = z.object({
  platform: platformEnum.optional(),
  isActive: z.boolean().optional(),
  parentCampaignId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const campaignLeaderboardQuerySchema = z.object({
  metric: z.enum(['roi', 'revenue', 'conversions', 'visits']).default('roi'),
  limit: z.number().int().min(1).max(100).default(10),
});
