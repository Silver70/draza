import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { analyticsService, campaignsService } from "./services";
import {
  createCampaignSchema,
  updateCampaignSchema,
  trackVisitSchema,
  updateActivitySchema,
  campaignAnalyticsQuerySchema,
  campaignListQuerySchema,
  campaignLeaderboardQuerySchema,
} from "./analytics.types";

export const analyticsRoutes = new Hono();

// ==================== DASHBOARD OVERVIEW ROUTES ====================

/**
 * GET /analytics/dashboard/overview
 * Get comprehensive dashboard overview with all key metrics
 * This is the primary endpoint for the dashboard homepage
 */
analyticsRoutes.get("/dashboard/overview", async (c) => {
  try {
    const overview = await analyticsService.getDashboardOverview();
    return c.json({ success: true, data: overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard overview";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== REVENUE ANALYTICS ROUTES ====================

/**
 * GET /analytics/revenue
 * Get detailed revenue analytics
 */
analyticsRoutes.get("/revenue", async (c) => {
  try {
    const analytics = await analyticsService.getRevenueAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch revenue analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/revenue/trend
 * Get revenue trends over time
 * Query params: period (day|week|month), limit (number)
 */
analyticsRoutes.get("/revenue/trend", async (c) => {
  try {
    const { period, limit } = c.req.query();

    const periodValue = (period === "day" || period === "week" || period === "month")
      ? period
      : "week";
    const limitValue = limit ? parseInt(limit, 10) : 30;

    const trends = await analyticsService.getRevenueTrend(periodValue, limitValue);
    return c.json({ success: true, data: trends });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch revenue trends";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== ORDER ANALYTICS ROUTES ====================

/**
 * GET /analytics/orders
 * Get detailed order analytics
 */
analyticsRoutes.get("/orders", async (c) => {
  try {
    const analytics = await analyticsService.getOrderAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/orders/recent
 * Get recent orders with customer info
 * Query params: limit (number)
 */
analyticsRoutes.get("/orders/recent", async (c) => {
  try {
    const { limit } = c.req.query();
    const limitValue = limit ? parseInt(limit, 10) : 10;

    const orders = await analyticsService.getRecentOrders(limitValue);
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recent orders";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== CUSTOMER ANALYTICS ROUTES ====================

/**
 * GET /analytics/customers
 * Get detailed customer analytics
 */
analyticsRoutes.get("/customers", async (c) => {
  try {
    const analytics = await analyticsService.getCustomerAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/customers/top
 * Get top customers by spending
 * Query params: limit (number)
 */
analyticsRoutes.get("/customers/top", async (c) => {
  try {
    const { limit } = c.req.query();
    const limitValue = limit ? parseInt(limit, 10) : 10;

    const customers = await analyticsService.getTopCustomers(limitValue);
    return c.json({ success: true, data: customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch top customers";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/customers/geography
 * Get customer distribution by geography
 */
analyticsRoutes.get("/customers/geography", async (c) => {
  try {
    const geography = await analyticsService.getCustomerGeography();
    return c.json({ success: true, data: geography });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer geography";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== PRODUCT ANALYTICS ROUTES ====================

/**
 * GET /analytics/products
 * Get product analytics overview
 */
analyticsRoutes.get("/products", async (c) => {
  try {
    const analytics = await analyticsService.getProductAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/products/top-selling
 * Get top selling products
 * Query params: limit (number), sortBy (quantity|revenue)
 */
analyticsRoutes.get("/products/top-selling", async (c) => {
  try {
    const { limit, sortBy } = c.req.query();

    const limitValue = limit ? parseInt(limit, 10) : 10;
    const sortByValue = (sortBy === "quantity" || sortBy === "revenue") ? sortBy : "revenue";

    const products = await analyticsService.getTopSellingProducts(limitValue, sortByValue);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch top selling products";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/products/low-stock
 * Get low stock products
 * Query params: threshold (number), limit (number)
 */
analyticsRoutes.get("/products/low-stock", async (c) => {
  try {
    const { threshold, limit } = c.req.query();

    const thresholdValue = threshold ? parseInt(threshold, 10) : 10;
    const limitValue = limit ? parseInt(limit, 10) : 20;

    const products = await analyticsService.getLowStockProducts(thresholdValue, limitValue);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch low stock products";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/products/out-of-stock
 * Get out of stock products
 * Query params: limit (number)
 */
analyticsRoutes.get("/products/out-of-stock", async (c) => {
  try {
    const { limit } = c.req.query();
    const limitValue = limit ? parseInt(limit, 10) : 20;

    const products = await analyticsService.getOutOfStockProducts(limitValue);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch out of stock products";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== INVENTORY ANALYTICS ROUTES ====================

/**
 * GET /analytics/inventory
 * Get inventory analytics
 */
analyticsRoutes.get("/inventory", async (c) => {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch inventory analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== SALES TRENDS ROUTES ====================

/**
 * GET /analytics/sales/trends
 * Get sales trends over time (similar to revenue trends but with more metrics)
 * Query params: period (day|week|month), limit (number)
 */
analyticsRoutes.get("/sales/trends", async (c) => {
  try {
    const { period, limit } = c.req.query();

    const periodValue = (period === "day" || period === "week" || period === "month")
      ? period
      : "week";
    const limitValue = limit ? parseInt(limit, 10) : 30;

    const trends = await analyticsService.getSalesTrends(periodValue, limitValue);
    return c.json({ success: true, data: trends });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch sales trends";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== TAX & SHIPPING ANALYTICS ROUTES ====================

/**
 * GET /analytics/tax
 * Get tax analytics
 */
analyticsRoutes.get("/tax", async (c) => {
  try {
    const analytics = await analyticsService.getTaxAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tax analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/shipping
 * Get shipping analytics
 */
analyticsRoutes.get("/shipping", async (c) => {
  try {
    const analytics = await analyticsService.getShippingAnalytics();
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch shipping analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== CAMPAIGN MANAGEMENT ROUTES ====================

/**
 * POST /analytics/campaigns
 * Create a new campaign
 */
analyticsRoutes.post("/campaigns", zValidator('json', createCampaignSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await campaignsService.createCampaign(data);
    return c.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns
 * List all campaigns with optional filters
 * Query params: platform, isActive, parentCampaignId, search
 */
analyticsRoutes.get("/campaigns", async (c) => {
  try {
    const { platform, isActive, parentCampaignId, search } = c.req.query();

    const filters: any = {};
    if (platform) filters.platform = platform;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (parentCampaignId !== undefined) filters.parentCampaignId = parentCampaignId;
    if (search) filters.search = search;

    const campaigns = await campaignsService.listCampaigns(filters);
    return c.json({ success: true, data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list campaigns";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/leaderboard
 * Get campaign leaderboard
 * Query params: metric (roi|revenue|conversions|visits), limit
 */
analyticsRoutes.get("/campaigns/leaderboard", async (c) => {
  try {
    const { metric, limit } = c.req.query();

    const metricValue = (metric === 'roi' || metric === 'revenue' || metric === 'conversions' || metric === 'visits')
      ? metric
      : 'roi';
    const limitValue = limit ? parseInt(limit, 10) : 10;

    const leaderboard = await campaignsService.getCampaignLeaderboard(metricValue, limitValue);
    return c.json({ success: true, data: leaderboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaign leaderboard";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/overview
 * Get overview of all campaigns
 */
analyticsRoutes.get("/campaigns/overview", async (c) => {
  try {
    const overview = await campaignsService.getCampaignsOverview();
    return c.json({ success: true, data: overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaigns overview";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/:id
 * Get campaign by ID
 */
analyticsRoutes.get("/campaigns/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const campaign = await campaignsService.getCampaignById(id);

    if (!campaign) {
      return c.json({ success: false, error: "Campaign not found" }, 404);
    }

    return c.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/:id/children
 * Get child campaigns
 */
analyticsRoutes.get("/campaigns/:id/children", async (c) => {
  try {
    const id = c.req.param('id');
    const children = await campaignsService.getChildCampaigns(id);
    return c.json({ success: true, data: children });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch child campaigns";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * PUT /analytics/campaigns/:id
 * Update campaign
 */
analyticsRoutes.put("/campaigns/:id", zValidator('json', updateCampaignSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const campaign = await campaignsService.updateCampaign(id, data);
    return c.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * DELETE /analytics/campaigns/:id
 * Delete campaign
 */
analyticsRoutes.delete("/campaigns/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await campaignsService.deleteCampaign(id);
    return c.json({ success: true, data: { message: "Campaign deleted successfully" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * PUT /analytics/campaigns/:id/activate
 * Activate campaign
 */
analyticsRoutes.put("/campaigns/:id/activate", async (c) => {
  try {
    const id = c.req.param('id');
    const campaign = await campaignsService.activateCampaign(id);
    return c.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * PUT /analytics/campaigns/:id/deactivate
 * Deactivate campaign
 */
analyticsRoutes.put("/campaigns/:id/deactivate", async (c) => {
  try {
    const id = c.req.param('id');
    const campaign = await campaignsService.deactivateCampaign(id);
    return c.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deactivate campaign";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== VISIT TRACKING ROUTES ====================

/**
 * POST /analytics/campaigns/track-visit
 * Track a campaign visit (called by frontend)
 */
analyticsRoutes.post("/campaigns/track-visit", zValidator('json', trackVisitSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await campaignsService.trackVisit(data);
    return c.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to track visit";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * POST /analytics/campaigns/update-activity
 * Update visit activity (extend expiration)
 */
analyticsRoutes.post("/campaigns/update-activity", zValidator('json', updateActivitySchema), async (c) => {
  try {
    const { sessionId } = c.req.valid('json');
    await campaignsService.updateVisitActivity(sessionId);
    return c.json({ success: true, data: { message: "Activity updated" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update activity";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/:id/visits
 * Get all visits for a campaign
 */
analyticsRoutes.get("/campaigns/:id/visits", async (c) => {
  try {
    const id = c.req.param('id');
    const visits = await campaignsService.getVisitsForCampaign(id);
    return c.json({ success: true, data: visits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch visits";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== CAMPAIGN ANALYTICS ROUTES ====================

/**
 * GET /analytics/campaigns/:id/analytics
 * Get comprehensive campaign analytics
 * Query params: startDate, endDate, includeTimeline, includeProducts, includeDeviceBreakdown, includeGeographic
 */
analyticsRoutes.get("/campaigns/:id/analytics", async (c) => {
  try {
    const id = c.req.param('id');
    const {
      startDate,
      endDate,
      includeTimeline,
      includeProducts,
      includeDeviceBreakdown,
      includeGeographic,
    } = c.req.query();

    const analytics = await campaignsService.getCampaignAnalytics(id, {
      startDate,
      endDate,
      includeTimeline: includeTimeline === 'true',
      includeProducts: includeProducts === 'true',
      includeDeviceBreakdown: includeDeviceBreakdown === 'true',
      includeGeographic: includeGeographic === 'true',
    });

    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaign analytics";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/:id/conversions
 * Get all conversions for a campaign
 */
analyticsRoutes.get("/campaigns/:id/conversions", async (c) => {
  try {
    const id = c.req.param('id');
    const conversions = await campaignsService.getConversionsForCampaign(id);
    return c.json({ success: true, data: conversions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch conversions";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /analytics/campaigns/:id/parent-analytics
 * Get parent campaign analytics with children aggregation
 */
analyticsRoutes.get("/campaigns/:id/parent-analytics", async (c) => {
  try {
    const id = c.req.param('id');
    const analytics = await campaignsService.getParentCampaignAnalytics(id);
    return c.json({ success: true, data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch parent campaign analytics";
    return c.json({ success: false, error: message }, 500);
  }
});
