import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ordersService } from "./services";
import {
  updateOrderStatusSchema,
  updateOrderSchema,
} from "./orders.types";

export const ordersRoutes = new Hono();

// ==================== ORDERS ROUTES ====================

/**
 * GET /orders
 * Get all orders with optional filters
 */
ordersRoutes.get("/", async (c) => {
  try {
    const { customerId, status } = c.req.query();

    const filters = {
      customerId: customerId || undefined,
      status: status || undefined,
    };

    const orders = await ordersService.findAll(filters);
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /orders/pending
 * Get all pending orders
 */
ordersRoutes.get("/pending", async (c) => {
  try {
    const orders = await ordersService.findPendingOrders();
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pending orders";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /orders/processing
 * Get all processing orders
 */
ordersRoutes.get("/processing", async (c) => {
  try {
    const orders = await ordersService.findProcessingOrders();
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch processing orders";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /orders/status/:status
 * Get orders by status
 */
ordersRoutes.get("/status/:status", async (c) => {
  try {
    const status = c.req.param("status");
    const orders = await ordersService.findByStatus(status);
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * GET /orders/customer/:customerId
 * Get all orders for a customer
 */
ordersRoutes.get("/customer/:customerId", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const orders = await ordersService.findByCustomerId(customerId);
    return c.json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer orders";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/customer/:customerId/stats
 * Get order statistics for a customer
 */
ordersRoutes.get("/customer/:customerId/stats", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const stats = await ordersService.getCustomerOrderStats(customerId);
    return c.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer stats";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/number/:orderNumber
 * Get order by order number
 */
ordersRoutes.get("/number/:orderNumber", async (c) => {
  try {
    const orderNumber = c.req.param("orderNumber");
    const order = await ordersService.findByOrderNumber(orderNumber);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/:id
 * Get order by ID
 */
ordersRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.findById(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/:id/items
 * Get order with items
 */
ordersRoutes.get("/:id/items", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.findByIdWithItems(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/:id/details
 * Get order with all relations (customer, addresses, items, products)
 */
ordersRoutes.get("/:id/details", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.findByIdWithRelations(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /orders/:id/stats
 * Get order statistics
 */
ordersRoutes.get("/:id/stats", async (c) => {
  try {
    const id = c.req.param("id");
    const stats = await ordersService.getStats(id);
    return c.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /orders
 * Create a new order
 */
ordersRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const order = await ordersService.create(data);
    return c.json({ success: true, data: order }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /orders/:id/status
 * Update order status
 */
ordersRoutes.put("/:id/status", zValidator("json", updateOrderStatusSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = c.req.valid("json");
    const order = await ordersService.updateStatus(id, status);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /orders/:id
 * Update order (notes, etc)
 */
ordersRoutes.put("/:id", zValidator("json", updateOrderSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // If only status is being updated, use updateStatus
    if (data.status && Object.keys(data).length === 1) {
      const order = await ordersService.updateStatus(id, data.status);
      return c.json({ success: true, data: order });
    }

    // For notes updates, use addNotes
    if (data.notes) {
      const order = await ordersService.addNotes(id, data.notes);
      return c.json({ success: true, data: order });
    }

    return c.json({ success: false, error: "No valid fields to update" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /orders/:id/process
 * Mark order as processing
 */
ordersRoutes.put("/:id/process", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.markAsProcessing(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /orders/:id/ship
 * Mark order as shipped
 */
ordersRoutes.put("/:id/ship", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.markAsShipped(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ship order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /orders/:id/deliver
 * Mark order as delivered
 */
ordersRoutes.put("/:id/deliver", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await ordersService.markAsDelivered(id);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deliver order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /orders/:id/cancel
 * Cancel an order
 */
ordersRoutes.post("/:id/cancel", async (c) => {
  try {
    const id = c.req.param("id");
    const { reason } = await c.req.json();
    const order = await ordersService.cancel(id, reason);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /orders/:id/refund
 * Process a refund for an order
 */
ordersRoutes.post("/:id/refund", async (c) => {
  try {
    const id = c.req.param("id");
    const { reason } = await c.req.json();
    const order = await ordersService.refund(id, reason);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refund order";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /orders/:id/notes
 * Add notes to an order
 */
ordersRoutes.post("/:id/notes", async (c) => {
  try {
    const id = c.req.param("id");
    const { notes } = await c.req.json();

    if (!notes || notes.trim().length === 0) {
      return c.json({ success: false, error: "Notes cannot be empty" }, 400);
    }

    const order = await ordersService.addNotes(id, notes);
    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add notes";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /orders/:id
 * Delete an order (admin only - only cancelled/refunded orders)
 */
ordersRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await ordersService.delete(id);
    return c.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete order";
    return c.json({ success: false, error: message }, 400);
  }
});
