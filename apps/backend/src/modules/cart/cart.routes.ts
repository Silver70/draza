import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cartService } from "./services/cart.service";
import { getOrganizationId } from "../../shared/middleware/tenant.middleware";
import {
  getCartSchema,
  addItemToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyDiscountCodeSchema,
  removeDiscountCodeSchema,
  calculateTotalsSchema,
  clearCartSchema,
  checkoutSchema,
  mergeCartsSchema,
  abandonedCartsQuerySchema,
} from "./cart.types";

export const cartRoutes = new Hono();

// ==================== CART ROUTES ====================

/**
 * GET /cart
 * Get or create cart by sessionId
 */
cartRoutes.get("/", zValidator("query", getCartSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const { sessionId, customerId } = c.req.valid("query");

    const cart = await cartService.getOrCreateCart(organizationId, sessionId, customerId);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get cart";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /cart/items
 * Add item to cart
 */
cartRoutes.post("/items", zValidator("json", addItemToCartSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");

    const cart = await cartService.addItem(organizationId, data);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add item to cart";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /cart/items/:itemId
 * Update cart item quantity
 */
cartRoutes.put("/items/:itemId", zValidator("json", updateCartItemSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const itemId = c.req.param("itemId");
    const { sessionId, quantity } = c.req.valid("json");

    const cart = await cartService.updateItemQuantity(organizationId, sessionId, itemId, { sessionId, quantity });

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart item";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /cart/items/:itemId
 * Remove item from cart
 */
cartRoutes.delete("/items/:itemId", zValidator("query", removeCartItemSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const itemId = c.req.param("itemId");
    const { sessionId } = c.req.valid("query");

    const cart = await cartService.removeItem(organizationId, sessionId, itemId);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove cart item";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /cart/discount
 * Apply discount code to cart
 */
cartRoutes.post("/discount", zValidator("json", applyDiscountCodeSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");

    const result = await cartService.applyDiscountCode(organizationId, data);

    return c.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply discount code";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /cart/discount
 * Remove discount code from cart
 */
cartRoutes.delete("/discount", zValidator("query", removeDiscountCodeSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const { sessionId } = c.req.valid("query");

    const cart = await cartService.removeDiscountCode(organizationId, sessionId);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove discount code";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /cart/calculate
 * Calculate cart totals with tax and shipping preview
 */
cartRoutes.post("/calculate", zValidator("json", calculateTotalsSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");

    const totals = await cartService.calculateTotals(organizationId, data);

    return c.json({ success: true, data: totals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to calculate cart totals";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /cart/clear
 * Clear all items from cart
 */
cartRoutes.delete("/clear", zValidator("query", clearCartSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const { sessionId } = c.req.valid("query");

    const cart = await cartService.clearCart(organizationId, sessionId);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /cart/checkout
 * Checkout - convert cart to order
 */
cartRoutes.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");

    const order = await cartService.checkout(organizationId, data);

    return c.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /cart/merge
 * Merge guest cart into user cart
 */
cartRoutes.post("/merge", zValidator("json", mergeCartsSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");

    const cart = await cartService.mergeGuestCart(organizationId, data);

    return c.json({ success: true, data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to merge carts";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /cart/admin/active
 * Get all active carts (admin)
 */
cartRoutes.get("/admin/active", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const carts = await cartService.getActiveCarts(organizationId);

    return c.json({ success: true, data: carts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch active carts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /cart/admin/abandoned
 * Get abandoned carts (admin)
 */
cartRoutes.get("/admin/abandoned", zValidator("query", abandonedCartsQuerySchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const { hoursAgo, minValue } = c.req.valid("query");

    const carts = await cartService.getAbandonedCarts(organizationId, hoursAgo, minValue);

    return c.json({ success: true, data: carts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch abandoned carts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /cart/admin/metrics
 * Get cart metrics for dashboard (admin)
 */
cartRoutes.get("/admin/metrics", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const metrics = await cartService.getCartMetrics(organizationId);

    return c.json({ success: true, data: metrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cart metrics";
    return c.json({ success: false, error: message }, 500);
  }
});
