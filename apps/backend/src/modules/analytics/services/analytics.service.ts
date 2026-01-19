import { analyticsRepo } from "../repo";
import type {
  DashboardOverview,
  RevenueAnalytics,
  RevenueTrend,
  OrderAnalytics,
  RecentOrder,
  CustomerAnalytics,
  TopCustomer,
  CustomerGeography,
  ProductAnalytics,
  TopSellingProduct,
  LowStockProduct,
  InventoryAnalytics,
  SalesTrend,
  TaxAnalytics,
  ShippingAnalytics,
} from "../analytics.types";

export const analyticsService = {
  // ==================== DASHBOARD OVERVIEW ====================

  /**
   * Get comprehensive dashboard overview
   * This is the main endpoint for the dashboard homepage
   */
  getDashboardOverview: async (organizationId: string): Promise<DashboardOverview> => {
    // Fetch all data in parallel for performance
    const [
      revenueData,
      revenueByStatusData,
      totalOrders,
      ordersByStatusData,
      totalCustomers,
      customerBreakdownData,
      lowStockCount,
      outOfStockCount,
    ] = await Promise.all([
      analyticsRepo.getTotalRevenue(organizationId),
      analyticsRepo.getRevenueByStatus(organizationId),
      analyticsRepo.getTotalOrders(organizationId),
      analyticsRepo.getOrdersByStatus(organizationId),
      analyticsRepo.getTotalCustomers(organizationId),
      analyticsRepo.getCustomerBreakdown(organizationId),
      analyticsRepo.getLowStockCount(organizationId),
      analyticsRepo.getOutOfStockCount(organizationId),
    ]);

    // Process revenue by status
    const revenueByStatus = {
      pending: "0.00",
      processing: "0.00",
      shipped: "0.00",
      delivered: "0.00",
      cancelled: "0.00",
      refunded: "0.00",
    };

    revenueByStatusData.forEach((item: { status: string; revenue: string }) => {
      revenueByStatus[item.status as keyof typeof revenueByStatus] = parseFloat(item.revenue).toFixed(2);
    });

    // Process orders by status
    const ordersByStatus = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };

    ordersByStatusData.forEach((item: { status: string; count: number }) => {
      ordersByStatus[item.status as keyof typeof ordersByStatus] = item.count;
    });

    // Process customer breakdown
    const customerBreakdown = {
      registered: 0,
      guest: 0,
    };

    customerBreakdownData.forEach((item: { isGuest: boolean; count: number }) => {
      if (item.isGuest) {
        customerBreakdown.guest = item.count;
      } else {
        customerBreakdown.registered = item.count;
      }
    });

    // Calculate average order value
    const averageOrderValue = totalOrders > 0
      ? (parseFloat(revenueData.totalRevenue) / totalOrders).toFixed(2)
      : "0.00";

    return {
      totalRevenue: parseFloat(revenueData.totalRevenue).toFixed(2),
      totalOrders,
      totalCustomers,
      averageOrderValue,
      revenueByStatus,
      ordersByStatus,
      customerBreakdown,
      lowStockCount,
      outOfStockCount,
      taxCollected: parseFloat(revenueData.totalTax).toFixed(2),
      shippingCollected: parseFloat(revenueData.totalShipping).toFixed(2),
    };
  },

  // ==================== REVENUE ANALYTICS ====================

  /**
   * Get detailed revenue analytics
   */
  getRevenueAnalytics: async (organizationId: string): Promise<RevenueAnalytics> => {
    const [revenueData, revenueByStatusData, totalOrders] = await Promise.all([
      analyticsRepo.getTotalRevenue(organizationId),
      analyticsRepo.getRevenueByStatus(organizationId),
      analyticsRepo.getTotalOrders(organizationId),
    ]);

    const revenueByStatus: Record<string, string> = {};
    revenueByStatusData.forEach((item) => {
      revenueByStatus[item.status] = parseFloat(item.revenue).toFixed(2);
    });

    const averageOrderValue = totalOrders > 0
      ? (parseFloat(revenueData.totalRevenue) / totalOrders).toFixed(2)
      : "0.00";

    return {
      totalRevenue: parseFloat(revenueData.totalRevenue).toFixed(2),
      subtotal: parseFloat(revenueData.totalSubtotal).toFixed(2),
      taxCollected: parseFloat(revenueData.totalTax).toFixed(2),
      shippingCollected: parseFloat(revenueData.totalShipping).toFixed(2),
      averageOrderValue,
      revenueByStatus,
    };
  },

  /**
   * Get revenue trends over time
   */
  getRevenueTrend: async (
    organizationId: string,
    period: "day" | "week" | "month" = "week",
    limit: number = 30
  ): Promise<RevenueTrend[]> => {
    const trends = await analyticsRepo.getRevenueTrend(organizationId, period, limit);

    return trends.map((trend) => ({
      date: trend.date,
      revenue: parseFloat(trend.revenue).toFixed(2),
      orderCount: trend.orderCount,
    }));
  },

  // ==================== ORDER ANALYTICS ====================

  /**
   * Get detailed order analytics
   */
  getOrderAnalytics: async (organizationId: string): Promise<OrderAnalytics> => {
    const [totalOrders, ordersByStatusData, averageItems] = await Promise.all([
      analyticsRepo.getTotalOrders(organizationId),
      analyticsRepo.getOrdersByStatus(organizationId),
      analyticsRepo.getAverageItemsPerOrder(organizationId),
    ]);

    const ordersByStatus: Record<string, number> = {};
    let cancelledCount = 0;
    let refundedCount = 0;

    ordersByStatusData.forEach((item) => {
      ordersByStatus[item.status] = item.count;
      if (item.status === "cancelled") cancelledCount = item.count;
      if (item.status === "refunded") refundedCount = item.count;
    });

    const cancelledRate = totalOrders > 0
      ? ((cancelledCount / totalOrders) * 100).toFixed(2)
      : "0.00";

    const refundRate = totalOrders > 0
      ? ((refundedCount / totalOrders) * 100).toFixed(2)
      : "0.00";

    return {
      totalOrders,
      ordersByStatus,
      averageItemsPerOrder: parseFloat(averageItems).toFixed(2),
      cancelledRate,
      refundRate,
    };
  },

  /**
   * Get recent orders
   */
  getRecentOrders: async (organizationId: string, limit: number = 10): Promise<RecentOrder[]> => {
    const orders = await analyticsRepo.getRecentOrders(organizationId, limit);

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.customerFirstName} ${order.customerLastName}`,
      total: parseFloat(order.total).toFixed(2),
      status: order.status,
      createdAt: order.createdAt,
    }));
  },

  // ==================== CUSTOMER ANALYTICS ====================

  /**
   * Get detailed customer analytics
   */
  getCustomerAnalytics: async (organizationId: string): Promise<CustomerAnalytics> => {
    const [
      totalCustomers,
      customerBreakdownData,
      repeatCustomerCount,
      averageLTV,
    ] = await Promise.all([
      analyticsRepo.getTotalCustomers(organizationId),
      analyticsRepo.getCustomerBreakdown(organizationId),
      analyticsRepo.getRepeatCustomerCount(organizationId),
      analyticsRepo.getAverageCustomerLifetimeValue(organizationId),
    ]);

    let registeredCustomers = 0;
    let guestCustomers = 0;

    customerBreakdownData.forEach((item) => {
      if (item.isGuest) {
        guestCustomers = item.count;
      } else {
        registeredCustomers = item.count;
      }
    });

    const repeatCustomerRate = totalCustomers > 0
      ? ((repeatCustomerCount / totalCustomers) * 100).toFixed(2)
      : "0.00";

    return {
      totalCustomers,
      registeredCustomers,
      guestCustomers,
      repeatCustomerRate,
      averageCustomerLifetimeValue: parseFloat(averageLTV).toFixed(2),
    };
  },

  /**
   * Get top customers by spending
   */
  getTopCustomers: async (organizationId: string, limit: number = 10): Promise<TopCustomer[]> => {
    const customers = await analyticsRepo.getTopCustomers(organizationId, limit);

    return customers.map((customer) => ({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      totalOrders: customer.totalOrders,
      totalSpent: parseFloat(customer.totalSpent).toFixed(2),
    }));
  },

  /**
   * Get customer geography distribution
   */
  getCustomerGeography: async (organizationId: string): Promise<CustomerGeography[]> => {
    const geography = await analyticsRepo.getCustomerGeography(organizationId);

    return geography.map((item) => ({
      country: item.country,
      state: item.state,
      customerCount: item.customerCount,
    }));
  },

  // ==================== PRODUCT ANALYTICS ====================

  /**
   * Get product analytics overview
   */
  getProductAnalytics: async (organizationId: string): Promise<ProductAnalytics> => {
    const stats = await analyticsRepo.getProductStats(organizationId);

    return {
      totalProducts: stats.totalProducts,
      activeProducts: stats.activeProducts,
      totalVariants: stats.totalVariants,
      averagePrice: parseFloat(stats.averagePrice).toFixed(2),
    };
  },

  /**
   * Get top selling products
   */
  getTopSellingProducts: async (
    organizationId: string,
    limit: number = 10,
    sortBy: "quantity" | "revenue" = "revenue"
  ): Promise<TopSellingProduct[]> => {
    const products = await analyticsRepo.getTopSellingProducts(organizationId, limit, sortBy);

    return products.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      variantId: product.variantId,
      sku: product.sku,
      quantitySold: product.quantitySold,
      revenue: parseFloat(product.revenue).toFixed(2),
    }));
  },

  /**
   * Get low stock products
   */
  getLowStockProducts: async (
    organizationId: string,
    threshold: number = 10,
    limit: number = 20
  ): Promise<LowStockProduct[]> => {
    const products = await analyticsRepo.getLowStockProducts(organizationId, threshold, limit);

    return products.map((product) => ({
      variantId: product.variantId,
      productName: product.productName,
      sku: product.sku,
      quantityInStock: product.quantityInStock,
      price: parseFloat(product.price).toFixed(2),
    }));
  },

  /**
   * Get out of stock products
   */
  getOutOfStockProducts: async (organizationId: string, limit: number = 20): Promise<LowStockProduct[]> => {
    const products = await analyticsRepo.getOutOfStockProducts(organizationId, limit);

    return products.map((product) => ({
      variantId: product.variantId,
      productName: product.productName,
      sku: product.sku,
      quantityInStock: product.quantityInStock,
      price: parseFloat(product.price).toFixed(2),
    }));
  },

  // ==================== INVENTORY ANALYTICS ====================

  /**
   * Get inventory analytics
   */
  getInventoryAnalytics: async (organizationId: string): Promise<InventoryAnalytics> => {
    const [totalValue, lowStockCount, outOfStockCount, productStats] =
      await Promise.all([
        analyticsRepo.getTotalInventoryValue(organizationId),
        analyticsRepo.getLowStockCount(organizationId),
        analyticsRepo.getOutOfStockCount(organizationId),
        analyticsRepo.getProductStats(organizationId),
      ]);

    return {
      totalInventoryValue: parseFloat(totalValue).toFixed(2),
      lowStockCount,
      outOfStockCount,
      totalVariants: productStats.totalVariants,
    };
  },

  // ==================== SALES TRENDS ====================

  /**
   * Get sales trends (alias for revenue trends with additional metrics)
   */
  getSalesTrends: async (
    organizationId: string,
    period: "day" | "week" | "month" = "week",
    limit: number = 30
  ): Promise<SalesTrend[]> => {
    const trends = await analyticsRepo.getRevenueTrend(organizationId, period, limit);

    return trends.map((trend) => {
      const revenue = parseFloat(trend.revenue);
      const orders = trend.orderCount;
      const averageOrderValue = orders > 0 ? (revenue / orders).toFixed(2) : "0.00";

      return {
        period: trend.date,
        revenue: revenue.toFixed(2),
        orders,
        averageOrderValue,
      };
    });
  },

  // ==================== TAX & SHIPPING ANALYTICS ====================

  /**
   * Get tax analytics
   */
  getTaxAnalytics: async (organizationId: string): Promise<TaxAnalytics> => {
    const [totalRevenue, taxByJurisdiction] = await Promise.all([
      analyticsRepo.getTotalRevenue(organizationId),
      analyticsRepo.getTaxByJurisdiction(organizationId),
    ]);

    return {
      totalTaxCollected: parseFloat(totalRevenue.totalTax).toFixed(2),
      taxByJurisdiction: taxByJurisdiction.map((item) => ({
        jurisdictionName: item.jurisdictionName || "Unknown",
        taxCollected: parseFloat(item.taxCollected).toFixed(2),
        orderCount: item.orderCount,
      })),
    };
  },

  /**
   * Get shipping analytics
   */
  getShippingAnalytics: async (organizationId: string): Promise<ShippingAnalytics> => {
    const [totalRevenue, shippingByMethod, freeShippingCount, averageShipping] =
      await Promise.all([
        analyticsRepo.getTotalRevenue(organizationId),
        analyticsRepo.getShippingByMethod(organizationId),
        analyticsRepo.getFreeShippingOrdersCount(organizationId),
        analyticsRepo.getAverageShippingCost(organizationId),
      ]);

    return {
      totalShippingRevenue: parseFloat(totalRevenue.totalShipping).toFixed(2),
      averageShippingCost: parseFloat(averageShipping).toFixed(2),
      shippingByMethod: shippingByMethod.map((item) => ({
        methodName: item.methodName || "Unknown",
        orderCount: item.orderCount,
        revenue: parseFloat(item.revenue).toFixed(2),
      })),
      freeShippingOrders: freeShippingCount,
    };
  },
};
