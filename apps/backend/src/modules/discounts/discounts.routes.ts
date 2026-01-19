import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { discountsService, discountCodesService } from "./services";
import {
  createDiscountSchema,
  updateDiscountSchema,
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
  createDiscountProductSchema,
  createDiscountCollectionSchema,
  validateDiscountCodeSchema,
} from "./discounts.types";
import { z } from "zod";
import { getOrganizationId } from "../../shared/middleware/tenant.middleware";

export const discountsRoutes = new Hono();

// ==================== DISCOUNTS ROUTES ====================

/**
 * GET /discounts
 * Get all discounts with optional filters
 */
discountsRoutes.get("/", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const { scope, isActive, search } = c.req.query();

    const filters = {
      scope: scope || undefined,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      search: search || undefined,
    };

    const discounts = await discountsService.findAll(organizationId, filters);
    return c.json({ success: true, data: discounts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch discounts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /discounts/active
 * Get all currently active discounts (within date range)
 */
discountsRoutes.get("/active", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const discounts = await discountsService.findActiveDiscounts(organizationId);
    return c.json({ success: true, data: discounts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch active discounts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /discounts/:id
 * Get a single discount by ID
 */
discountsRoutes.get("/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const discount = await discountsService.findById(organizationId, id);
    return c.json({ success: true, data: discount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch discount";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /discounts/:id/details
 * Get discount with all details (codes, products, collections)
 */
discountsRoutes.get("/:id/details", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const discount = await discountsService.findByIdWithDetails(organizationId, id);
    return c.json({ success: true, data: discount });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch discount details";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * POST /discounts
 * Create a new discount
 */
discountsRoutes.post(
  "/",
  zValidator("json", createDiscountSchema),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const data = c.req.valid("json");
      const discount = await discountsService.create({
        ...data,
        organizationId,
        value: data.value.toString(),
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      });
      return c.json({ success: true, data: discount }, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create discount";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * PUT /discounts/:id
 * Update a discount
 */
discountsRoutes.put(
  "/:id",
  zValidator("json", updateDiscountSchema),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const discount = await discountsService.update(organizationId, id, {
        ...data,
        value: data.value !== undefined ? data.value.toString() : undefined,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt:
          data.endsAt !== undefined
            ? data.endsAt
              ? new Date(data.endsAt)
              : null
            : undefined,
      });
      return c.json({ success: true, data: discount });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update discount";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * DELETE /discounts/:id
 * Delete a discount
 */
discountsRoutes.delete("/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    await discountsService.delete(organizationId, id);
    return c.json({ success: true, message: "Discount deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete discount";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== DISCOUNT PRODUCTS ROUTES ====================

/**
 * POST /discounts/:id/products
 * Add products to a discount
 */
discountsRoutes.post(
  "/:id/products",
  zValidator(
    "json",
    z.object({
      productIds: z.array(z.string().uuid()).min(1, "At least one product ID required"),
    })
  ),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const id = c.req.param("id");
      const { productIds } = c.req.valid("json");
      const result = await discountsService.addProducts(organizationId, id, productIds);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add products to discount";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * DELETE /discounts/:id/products/:productId
 * Remove a product from a discount
 */
discountsRoutes.delete("/:id/products/:productId", async (c) => {
  try {
    const id = c.req.param("id");
    const productId = c.req.param("productId");
    await discountsService.removeProduct(id, productId);
    return c.json({
      success: true,
      message: "Product removed from discount successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove product from discount";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== DISCOUNT COLLECTIONS ROUTES ====================

/**
 * POST /discounts/:id/collections
 * Add collections to a discount
 */
discountsRoutes.post(
  "/:id/collections",
  zValidator(
    "json",
    z.object({
      collectionIds: z.array(z.string().uuid()).min(1, "At least one collection ID required"),
    })
  ),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const id = c.req.param("id");
      const { collectionIds } = c.req.valid("json");
      const result = await discountsService.addCollections(organizationId, id, collectionIds);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add collections to discount";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * DELETE /discounts/:id/collections/:collectionId
 * Remove a collection from a discount
 */
discountsRoutes.delete("/:id/collections/:collectionId", async (c) => {
  try {
    const id = c.req.param("id");
    const collectionId = c.req.param("collectionId");
    await discountsService.removeCollection(id, collectionId);
    return c.json({
      success: true,
      message: "Collection removed from discount successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove collection from discount";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== DISCOUNT VARIANTS ROUTES ====================

/**
 * POST /discounts/:id/variants
 * Add product variants to a discount
 */
discountsRoutes.post(
  "/:id/variants",
  zValidator(
    "json",
    z.object({
      variantIds: z.array(z.string().uuid()).min(1, "At least one variant ID required"),
    })
  ),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const id = c.req.param("id");
      const { variantIds } = c.req.valid("json");
      const result = await discountsService.addVariants(organizationId, id, variantIds);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add variants to discount";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * DELETE /discounts/:id/variants/:variantId
 * Remove a product variant from a discount
 */
discountsRoutes.delete("/:id/variants/:variantId", async (c) => {
  try {
    const id = c.req.param("id");
    const variantId = c.req.param("variantId");
    await discountsService.removeVariant(id, variantId);
    return c.json({
      success: true,
      message: "Variant removed from discount successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove variant from discount";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== DISCOUNT CODES ROUTES ====================

/**
 * GET /discounts/:id/codes
 * Get all codes for a discount
 */
discountsRoutes.get("/:id/codes", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const codes = await discountCodesService.findByDiscountId(organizationId, id);
    return c.json({ success: true, data: codes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch discount codes";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * POST /discounts/:id/codes
 * Create a new discount code
 */
discountsRoutes.post(
  "/:id/codes",
  zValidator("json", createDiscountCodeSchema.omit({ discountId: true })),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const discountId = c.req.param("id");
      const data = c.req.valid("json");
      const code = await discountCodesService.create(organizationId, {
        ...data,
        organizationId,
        discountId,
        minimumOrderValue: data.minimumOrderValue !== null && data.minimumOrderValue !== undefined
          ? data.minimumOrderValue.toString()
          : null,
      });
      return c.json({ success: true, data: code }, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create discount code";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * PUT /discounts/codes/:codeId
 * Update a discount code
 */
discountsRoutes.put(
  "/codes/:codeId",
  zValidator("json", updateDiscountCodeSchema),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const codeId = c.req.param("codeId");
      const data = c.req.valid("json");
      const code = await discountCodesService.update(organizationId, codeId, {
        ...data,
        minimumOrderValue: data.minimumOrderValue !== null && data.minimumOrderValue !== undefined
          ? data.minimumOrderValue.toString()
          : undefined,
      });
      return c.json({ success: true, data: code });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update discount code";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

/**
 * DELETE /discounts/codes/:codeId
 * Delete a discount code
 */
discountsRoutes.delete("/codes/:codeId", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const codeId = c.req.param("codeId");
    await discountCodesService.delete(organizationId, codeId);
    return c.json({
      success: true,
      message: "Discount code deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete discount code";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== PUBLIC/CUSTOMER ROUTES ====================

/**
 * POST /discounts/validate-code
 * Validate a discount code (for customers during checkout)
 */
discountsRoutes.post(
  "/validate-code",
  zValidator("json", validateDiscountCodeSchema),
  async (c) => {
    try {
      const organizationId = getOrganizationId(c);
      const { code, orderTotal } = c.req.valid("json");
      const result = await discountCodesService.calculateCodeDiscount(
        organizationId,
        code,
        orderTotal
      );
      return c.json({
        success: true,
        data: {
          valid: true,
          discountAmount: result.discountAmount,
          finalTotal: result.finalTotal,
          discount: {
            name: result.discount.name,
            description: result.discount.description,
            type: result.discount.discountType,
            value: result.discount.value,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid code";
      return c.json({ success: false, error: message, data: { valid: false } }, 400);
    }
  }
);

/**
 * GET /discounts/products/:productId
 * Get applicable discounts for a product (customer-facing)
 */
discountsRoutes.get("/products/:productId", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const productId = c.req.param("productId");
    const discounts = await discountsService.getProductDiscounts(organizationId, productId);
    return c.json({ success: true, data: discounts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch product discounts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /discounts/collections/:collectionId
 * Get applicable discounts for a collection (customer-facing)
 */
discountsRoutes.get("/collections/:collectionId", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const collectionId = c.req.param("collectionId");
    const discounts =
      await discountsService.getCollectionDiscounts(organizationId, collectionId);
    return c.json({ success: true, data: discounts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch collection discounts";
    return c.json({ success: false, error: message }, 500);
  }
});
