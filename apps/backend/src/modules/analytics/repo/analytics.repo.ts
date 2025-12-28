import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { db } from "../../../shared/db";
import { ordersTable, orderItemsTable } from "../../../shared/db/order";
import { customersTable } from "../../../shared/db/customer";
import { productsTable, productVariantsTable } from "../../../shared/db/catalogue";
import { addressesTable } from "../../../shared/db/address";

export const analyticsRepo = {
  // ==================== DASHBOARD OVERVIEW ====================

  /**
   * Get total revenue across all orders
   */
  async getTotalRevenue() {
    const result = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(CAST(${ordersTable.total} AS DECIMAL)), 0)`,
        totalSubtotal: sql<string>`COALESCE(SUM(CAST(${ordersTable.subtotal} AS DECIMAL)), 0)`,
        totalTax: sql<string>`COALESCE(SUM(CAST(${ordersTable.tax} AS DECIMAL)), 0)`,
        totalShipping: sql<string>`COALESCE(SUM(CAST(${ordersTable.shippingCost} AS DECIMAL)), 0)`,
      })
      .from(ordersTable);

    return result[0];
  },

  /**
   * Get revenue breakdown by order status
   */
  async getRevenueByStatus() {
    const result = await db
      .select({
        status: ordersTable.status,
        revenue: sql<string>`COALESCE(SUM(CAST(${ordersTable.total} AS DECIMAL)), 0)`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    return result;
  },

  /**
   * Get total number of orders
   */
  async getTotalOrders() {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable);

    return result[0].count;
  },

  /**
   * Get order count breakdown by status
   */
  async getOrdersByStatus() {
    const result = await db
      .select({
        status: ordersTable.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    return result;
  },

  /**
   * Get total number of customers
   */
  async getTotalCustomers() {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(customersTable);

    return result[0].count;
  },

  /**
   * Get customer breakdown (registered vs guest)
   */
  async getCustomerBreakdown() {
    const result = await db
      .select({
        isGuest: customersTable.is_guest,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(customersTable)
      .groupBy(customersTable.is_guest);

    return result;
  },

  /**
   * Get low stock count
   */
  async getLowStockCount(threshold: number = 10) {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(productVariantsTable)
      .where(
        and(
          sql`${productVariantsTable.quantityInStock} > 0`,
          sql`${productVariantsTable.quantityInStock} <= ${threshold}`
        )
      );

    return result[0].count;
  },

  /**
   * Get out of stock count
   */
  async getOutOfStockCount() {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(productVariantsTable)
      .where(eq(productVariantsTable.quantityInStock, 0));

    return result[0].count;
  },

  // ==================== REVENUE ANALYTICS ====================

  /**
   * Get revenue trends over time
   */
  async getRevenueTrend(period: "day" | "week" | "month" = "week", limit: number = 30) {
    let dateFormat: string;

    switch (period) {
      case "day":
        dateFormat = "YYYY-MM-DD";
        break;
      case "week":
        dateFormat = "IYYY-IW";
        break;
      case "month":
        dateFormat = "YYYY-MM";
        break;
      default:
        dateFormat = "YYYY-MM-DD";
    }

    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${ordersTable.createdAt}, ${dateFormat})`,
        revenue: sql<string>`COALESCE(SUM(CAST(${ordersTable.total} AS DECIMAL)), 0)`,
        orderCount: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable)
      .groupBy(sql`TO_CHAR(${ordersTable.createdAt}, ${dateFormat})`)
      .orderBy(sql`TO_CHAR(${ordersTable.createdAt}, ${dateFormat}) DESC`)
      .limit(limit);

    return result;
  },

  // ==================== ORDER ANALYTICS ====================

  /**
   * Get average items per order
   */
  async getAverageItemsPerOrder() {
    const result = await db
      .select({
        averageItems: sql<string>`COALESCE(AVG(item_count), 0)`,
      })
      .from(
        db
          .select({
            orderId: orderItemsTable.orderId,
            item_count: sql<number>`SUM(${orderItemsTable.quantity})`,
          })
          .from(orderItemsTable)
          .groupBy(orderItemsTable.orderId)
          .as("order_items_summary")
      );

    return result[0].averageItems;
  },

  /**
   * Get recent orders with customer info
   */
  async getRecentOrders(limit: number = 10) {
    const result = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        customerFirstName: customersTable.first_name,
        customerLastName: customersTable.last_name,
        total: ordersTable.total,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit);

    return result;
  },

  // ==================== CUSTOMER ANALYTICS ====================

  /**
   * Get customers with repeat purchases
   */
  async getRepeatCustomerCount() {
    const result = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${ordersTable.customerId})::int`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.customerId)
      .having(sql`COUNT(*) > 1`);

    return result.length;
  },

  /**
   * Get top customers by total spending
   */
  async getTopCustomers(limit: number = 10) {
    const result = await db
      .select({
        id: customersTable.id,
        firstName: customersTable.first_name,
        lastName: customersTable.last_name,
        email: customersTable.email,
        totalOrders: sql<number>`COUNT(${ordersTable.id})::int`,
        totalSpent: sql<string>`COALESCE(SUM(CAST(${ordersTable.total} AS DECIMAL)), 0)`,
      })
      .from(customersTable)
      .innerJoin(ordersTable, eq(customersTable.id, ordersTable.customerId))
      .groupBy(customersTable.id, customersTable.first_name, customersTable.last_name, customersTable.email)
      .orderBy(desc(sql`SUM(CAST(${ordersTable.total} AS DECIMAL))`))
      .limit(limit);

    return result;
  },

  /**
   * Get customer lifetime value average
   */
  async getAverageCustomerLifetimeValue() {
    const result = await db
      .select({
        averageLTV: sql<string>`COALESCE(AVG(customer_total), 0)`,
      })
      .from(
        db
          .select({
            customerId: ordersTable.customerId,
            customer_total: sql<number>`SUM(CAST(${ordersTable.total} AS DECIMAL))`,
          })
          .from(ordersTable)
          .groupBy(ordersTable.customerId)
          .as("customer_totals")
      );

    return result[0].averageLTV;
  },

  /**
   * Get customer geography distribution
   */
  async getCustomerGeography() {
    const result = await db
      .select({
        country: addressesTable.country,
        state: addressesTable.state,
        customerCount: sql<number>`COUNT(DISTINCT ${addressesTable.customerId})::int`,
      })
      .from(addressesTable)
      .groupBy(addressesTable.country, addressesTable.state)
      .orderBy(desc(sql`COUNT(DISTINCT ${addressesTable.customerId})`))
      .limit(20);

    return result;
  },

  // ==================== PRODUCT ANALYTICS ====================

  /**
   * Get total products and variants
   */
  async getProductStats() {
    const productCount = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${productsTable.isActive} = true)::int`,
      })
      .from(productsTable);

    const variantCount = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
        averagePrice: sql<string>`COALESCE(AVG(CAST(${productVariantsTable.price} AS DECIMAL)), 0)`,
      })
      .from(productVariantsTable);

    return {
      totalProducts: productCount[0].total,
      activeProducts: productCount[0].active,
      totalVariants: variantCount[0].count,
      averagePrice: variantCount[0].averagePrice,
    };
  },

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10, sortBy: "quantity" | "revenue" = "revenue") {
    const orderByClause = sortBy === "quantity"
      ? desc(sql`SUM(${orderItemsTable.quantity})`)
      : desc(sql`SUM(CAST(${orderItemsTable.totalPrice} AS DECIMAL))`);

    const result = await db
      .select({
        productId: productsTable.id,
        productName: productsTable.name,
        variantId: productVariantsTable.id,
        sku: productVariantsTable.sku,
        quantitySold: sql<number>`COALESCE(SUM(${orderItemsTable.quantity}), 0)::int`,
        revenue: sql<string>`COALESCE(SUM(CAST(${orderItemsTable.totalPrice} AS DECIMAL)), 0)`,
      })
      .from(orderItemsTable)
      .innerJoin(productVariantsTable, eq(orderItemsTable.productVariantId, productVariantsTable.id))
      .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
      .groupBy(productsTable.id, productsTable.name, productVariantsTable.id, productVariantsTable.sku)
      .orderBy(orderByClause)
      .limit(limit);

    return result;
  },

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10, limit: number = 20) {
    const result = await db
      .select({
        variantId: productVariantsTable.id,
        productName: productsTable.name,
        sku: productVariantsTable.sku,
        quantityInStock: productVariantsTable.quantityInStock,
        price: productVariantsTable.price,
      })
      .from(productVariantsTable)
      .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
      .where(
        and(
          sql`${productVariantsTable.quantityInStock} > 0`,
          sql`${productVariantsTable.quantityInStock} <= ${threshold}`
        )
      )
      .orderBy(productVariantsTable.quantityInStock)
      .limit(limit);

    return result;
  },

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(limit: number = 20) {
    const result = await db
      .select({
        variantId: productVariantsTable.id,
        productName: productsTable.name,
        sku: productVariantsTable.sku,
        quantityInStock: productVariantsTable.quantityInStock,
        price: productVariantsTable.price,
      })
      .from(productVariantsTable)
      .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
      .where(eq(productVariantsTable.quantityInStock, 0))
      .orderBy(productsTable.name)
      .limit(limit);

    return result;
  },

  // ==================== INVENTORY ANALYTICS ====================

  /**
   * Get total inventory value
   */
  async getTotalInventoryValue() {
    const result = await db
      .select({
        totalValue: sql<string>`COALESCE(SUM(CAST(${productVariantsTable.price} AS DECIMAL) * ${productVariantsTable.quantityInStock}), 0)`,
      })
      .from(productVariantsTable);

    return result[0].totalValue;
  },

  // ==================== TAX & SHIPPING ANALYTICS ====================

  /**
   * Get tax collected by jurisdiction
   */
  async getTaxByJurisdiction() {
    const result = await db
      .select({
        jurisdictionName: ordersTable.taxJurisdictionName,
        taxCollected: sql<string>`COALESCE(SUM(CAST(${ordersTable.tax} AS DECIMAL)), 0)`,
        orderCount: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable)
      .where(sql`${ordersTable.taxJurisdictionName} IS NOT NULL`)
      .groupBy(ordersTable.taxJurisdictionName)
      .orderBy(desc(sql`SUM(CAST(${ordersTable.tax} AS DECIMAL))`));

    return result;
  },

  /**
   * Get shipping analytics by method
   */
  async getShippingByMethod() {
    const result = await db
      .select({
        methodName: ordersTable.shippingMethodName,
        orderCount: sql<number>`COUNT(*)::int`,
        revenue: sql<string>`COALESCE(SUM(CAST(${ordersTable.shippingCost} AS DECIMAL)), 0)`,
      })
      .from(ordersTable)
      .where(sql`${ordersTable.shippingMethodName} IS NOT NULL`)
      .groupBy(ordersTable.shippingMethodName)
      .orderBy(desc(sql`COUNT(*)`));

    return result;
  },

  /**
   * Get free shipping orders count
   */
  async getFreeShippingOrdersCount() {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable)
      .where(eq(ordersTable.shippingCost, "0.00"));

    return result[0].count;
  },

  /**
   * Get average shipping cost
   */
  async getAverageShippingCost() {
    const result = await db
      .select({
        average: sql<string>`COALESCE(AVG(CAST(${ordersTable.shippingCost} AS DECIMAL)), 0)`,
      })
      .from(ordersTable);

    return result[0].average;
  },
};
