import { Hono } from "hono";
import { analyticsService } from "./services";

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
