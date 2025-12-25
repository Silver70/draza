import { ordersRepo } from "../repo";
import { customersRepo } from "../../customers/repo/customers.repo";
import { addressesRepo } from "../../customers/repo/addresses.repo";
import { productVariantsRepo } from "../../products/repo/products.repo";
import { NewOrder } from "../orders.types";
import { calculateOrderTotals, generateOrderNumber } from "../utils/index";

export const ordersService = {
  /**
   * Get all orders with optional filtering
   */
  findAll: async (filters?: {
    customerId?: string;
    status?: string;
  }) => {
    let orders = await ordersRepo.getAllOrders();

    if (!orders || orders.length === 0) {
      return [];
    }

    // Apply filters
    if (filters?.customerId) {
      orders = orders.filter((o) => o.customerId === filters.customerId);
    }

    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }

    return orders;
  },

  /**
   * Get orders by customer ID
   */
  findByCustomerId: async (customerId: string) => {
    // Verify customer exists
    const customer = await customersRepo.getCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    return await ordersRepo.getOrdersByCustomerId(customerId);
  },

  /**
   * Get orders by status
   */
  findByStatus: async (status: string) => {
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    return await ordersRepo.getOrdersByStatus(status);
  },

  /**
   * Get pending orders
   */
  findPendingOrders: async () => {
    return await ordersRepo.getOrdersByStatus("pending");
  },

  /**
   * Get processing orders
   */
  findProcessingOrders: async () => {
    return await ordersRepo.getOrdersByStatus("processing");
  },

  /**
   * Get a single order by ID
   */
  findById: async (id: string) => {
    const order = await ordersRepo.getOrderById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Get order by order number
   */
  findByOrderNumber: async (orderNumber: string) => {
    const order = await ordersRepo.getOrderByOrderNumber(orderNumber);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Get order with items
   */
  findByIdWithItems: async (id: string) => {
    const order = await ordersRepo.getOrderWithItems(id);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Get order with all relations (customer, addresses, items with products)
   */
  findByIdWithRelations: async (id: string) => {
    const order = await ordersRepo.getOrderWithRelations(id);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Validate order items before creating order
   */
  validateOrderItems: async (items: Array<{ productVariantId: string; quantity: number }>): Promise<Array<{
    variantId: string;
    sku: string;
    price: string;
    available: number;
    requested: number;
    valid: boolean;
  }>> => {
    const validationResults = [];

    for (const item of items) {
      const variant = await productVariantsRepo.getProductVariantById(item.productVariantId);

      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} not found`);
      }

      // Check stock availability
      if (variant.quantityInStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product variant ${variant.sku}. Available: ${variant.quantityInStock}, Requested: ${item.quantity}`
        );
      }

      validationResults.push({
        variantId: variant.id,
        sku: variant.sku,
        price: variant.price,
        available: variant.quantityInStock,
        requested: item.quantity,
        valid: true,
      });
    }

    return validationResults;
  },

  /**
   * Create a new order with items
   */
  create: async (data: {
    customerId: string;
    shippingAddressId: string;
    billingAddressId: string;
    items: Array<{
      productVariantId: string;
      quantity: number;
    }>;
    taxRate?: number;
    shippingCost?: string;
    notes?: string;
  }) => {
    // Validate customer exists
    const customer = await customersRepo.getCustomerById(data.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Validate shipping address exists and belongs to customer
    const shippingAddress = await addressesRepo.getAddressById(data.shippingAddressId);
    if (!shippingAddress) {
      throw new Error("Shipping address not found");
    }
    if (shippingAddress.customerId !== data.customerId) {
      throw new Error("Shipping address does not belong to this customer");
    }

    // Validate billing address exists and belongs to customer
    const billingAddress = await addressesRepo.getAddressById(data.billingAddressId);
    if (!billingAddress) {
      throw new Error("Billing address not found");
    }
    if (billingAddress.customerId !== data.customerId) {
      throw new Error("Billing address does not belong to this customer");
    }

    // Validate items and check stock
    if (!data.items || data.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }
    //@ts-ignore
    await this.validateOrderItems(data.items);

    // Prepare order items with prices
    const orderItems: Array<{
      productVariantId: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
    }> = [];

    for (const item of data.items) {
      const variant = await productVariantsRepo.getProductVariantById(item.productVariantId);
      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} not found`);
      }

      const unitPrice = variant.price;
      const totalPrice = (parseFloat(unitPrice) * item.quantity).toFixed(2);

      orderItems.push({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(
      orderItems,
      data.taxRate || 0,
      data.shippingCost || "0"
    );

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Create order data
    const orderData: NewOrder = {
      orderNumber,
      customerId: data.customerId,
      shippingAddressId: data.shippingAddressId,
      billingAddressId: data.billingAddressId,
      status: "pending",
      subtotal: totals.subtotal,
      tax: totals.tax,
      shippingCost: totals.shippingCost,
      total: totals.total,
      notes: data.notes || null,
    };

    // Create order with items in transaction
    const order = await ordersRepo.createOrder(orderData, orderItems);

    // Deduct inventory (TODO: Consider moving this to a separate inventory service)
    for (const item of data.items) {
      const variant = await productVariantsRepo.getProductVariantById(item.productVariantId);
      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} not found`);
      }
      await productVariantsRepo.updateProductVariant(item.productVariantId, {
        quantityInStock: variant.quantityInStock - item.quantity,
      });
    }

    return order;
  },

  /**
   * Update order status
   */
  updateStatus: async (id: string, status: string): Promise<any> => {
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const order = await ordersRepo.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate status transitions
    if (order.status === "cancelled" && status !== "refunded") {
      throw new Error("Cannot change status of a cancelled order (except to refunded)");
    }

    if (order.status === "delivered" && status !== "refunded") {
      throw new Error("Cannot change status of a delivered order (except to refunded)");
    }

    // If cancelling order, restore inventory
    if (status === "cancelled" && order.status !== "cancelled") {
      const orderWithItems = await ordersRepo.getOrderWithItems(id);
      if (orderWithItems?.items) {
        for (const item of orderWithItems.items) {
          const variant = await productVariantsRepo.getProductVariantById(item.productVariantId);
          if (!variant) {
            throw new Error(`Product variant ${item.productVariantId} not found`);
          }
          await productVariantsRepo.updateProductVariant(item.productVariantId, {
            quantityInStock: variant.quantityInStock + item.quantity,
          });
        }
      }
    }

    const updatedOrder = await ordersRepo.updateOrderStatus(id, status);
    if (!updatedOrder) {
      throw new Error("Failed to update order status");
    }
    return updatedOrder;
  },

  /**
   * Mark order as processing (admin accepted the order)
   */
  markAsProcessing: async (id: string): Promise<any> => {
       //@ts-ignore
    return await this.updateStatus(id, "processing");
  },

  /**
   * Mark order as shipped
   */
  markAsShipped: async (id: string): Promise<any> => {
       //@ts-ignore
    return await this.updateStatus(id, "shipped");
  },

  /**
   * Mark order as delivered
   */
  markAsDelivered: async (id: string): Promise<any> => {
       //@ts-ignore
    return await this.updateStatus(id, "delivered");
  },

  /**
   * Cancel an order
   */
  cancel: async (id: string, reason?: string) => {
    const order = await ordersRepo.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Can only cancel pending or processing orders
    if (!["pending", "processing"].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Update status to cancelled (inventory will be restored in updateStatus)
       //@ts-ignore
    await this.updateStatus(id, "cancelled");

    // Optionally add cancellation reason to notes
    if (reason) {
      const notes = order.notes
        ? `${order.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;

      await ordersRepo.updateOrder(id, { notes });
    }

    // Return the updated order
    const updatedOrder = await ordersRepo.getOrderById(id);
    if (!updatedOrder) {
      throw new Error("Order not found after cancellation");
    }
    return updatedOrder;
  },

  /**
   * Process refund for an order
   */
  refund: async (id: string, reason?: string) => {
    const order = await ordersRepo.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Can only refund delivered or cancelled orders
    if (!["delivered", "cancelled"].includes(order.status)) {
      throw new Error("Can only refund delivered or cancelled orders");
    }

    // If refunding a delivered order, restore inventory
    if (order.status === "delivered") {
      const orderWithItems = await ordersRepo.getOrderWithItems(id);
      if (orderWithItems?.items) {
        for (const item of orderWithItems.items) {
          const variant = await productVariantsRepo.getProductVariantById(item.productVariantId);
          if (!variant) {
            throw new Error(`Product variant ${item.productVariantId} not found`);
          }
          await productVariantsRepo.updateProductVariant(item.productVariantId, {
            quantityInStock: variant.quantityInStock + item.quantity,
          });
        }
      }
    }

    // Update status to refunded
    const updatedOrder = await ordersRepo.updateOrderStatus(id, "refunded");

    // Add refund reason to notes
    if (reason) {
      const notes = order.notes
        ? `${order.notes}\n\nRefund reason: ${reason}`
        : `Refund reason: ${reason}`;

      await ordersRepo.updateOrder(id, { notes });
    }

    return updatedOrder;
  },

  /**
   * Add notes to an order
   */
  addNotes: async (id: string, notes: string) => {
    const order = await ordersRepo.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    const updatedNotes = order.notes
      ? `${order.notes}\n\n${notes}`
      : notes;

    return await ordersRepo.updateOrder(id, { notes: updatedNotes });
  },

  /**
   * Get order statistics
   */
  getStats: async (orderId: string) => {
    const order = await ordersRepo.getOrderWithItems(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const itemCount = order.items?.length || 0;
    const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      itemCount,
      totalQuantity,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      total: order.total,
      createdAt: order.createdAt,
    };
  },

  /**
   * Get customer order statistics
   */
  getCustomerOrderStats: async (customerId: string) => {
    const orders = await ordersRepo.getOrdersByCustomerId(customerId);

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      customerId,
      totalOrders,
      totalSpent: totalSpent.toFixed(2),
      ordersByStatus,
      lastOrderDate: orders[0]?.createdAt,
    };
  },

  /**
   * Delete an order (admin only, use with caution)
   */
  delete: async (id: string) => {
    const order = await ordersRepo.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only allow deleting cancelled or refunded orders
    if (!["cancelled", "refunded"].includes(order.status)) {
      throw new Error("Can only delete cancelled or refunded orders");
    }

    // Order items will be cascade deleted
    return await ordersRepo.deleteOrder(id);
  },
};
