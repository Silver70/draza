import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getOrganizationId } from "../../shared/middleware/tenant.middleware";
import { productsService } from "./services/products.service";
import { categoriesService } from "./services/categories.service";
import { collectionsService } from "./services/collections.service";
import { attributesService } from "./services/attributes.service";
import { imagesService } from "./services/images.service";
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createCollectionSchema,
  updateCollectionSchema,
  createAttributeSchema,
  updateAttributeSchema,
  createAttributeValueSchema,
  updateAttributeValueSchema,
  createProductImageSchema,
  updateProductImageSchema,
  createProductVariantImageSchema,
  updateProductVariantImageSchema,
} from "./products.types";

export const productsRoutes = new Hono();

// ==================== PRODUCTS ROUTES ====================

/**
 * GET /products
 * Get all products with optional filters (scoped to organization)
 */
productsRoutes.get("/", async (c) => {
  try {
    const organizationId = getOrganizationId(c); // Extract organization from context
    const { categoryId, isActive, search } = c.req.query();

    const filters = {
      categoryId: categoryId || undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      search: search || undefined,
    };

    const products = await productsService.findAll(filters, organizationId);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/active
 * Get only active products (customer-facing, scoped to organization)
 */
productsRoutes.get("/active", async (c) => {
  try {
    const organizationId = getOrganizationId(c); // Extract organization from context
    const products = await productsService.findActiveProducts(organizationId);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch active products";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/low-stock
 * Get products with low stock
 */
productsRoutes.get("/low-stock", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const threshold = parseInt(c.req.query("threshold") || "10");
    const products = await productsService.findLowStockProducts(organizationId, threshold);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch low stock products";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/out-of-stock
 * Get products that are out of stock
 */
productsRoutes.get("/out-of-stock", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const products = await productsService.findOutOfStockProducts(organizationId);
    return c.json({ success: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch out of stock products";
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== CATEGORIES ROUTES ====================
// NOTE: These must come BEFORE /products/:id to avoid route conflicts

/**
 * GET /products/categories
 * Get all categories
 */
productsRoutes.get("/categories", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const categories = await categoriesService.findAll(organizationId);
    return c.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/categories/tree
 * Get category tree (hierarchical)
 */
productsRoutes.get("/categories/tree", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const tree = await categoriesService.getCategoryTree(organizationId);
    return c.json({ success: true, data: tree });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch category tree";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/categories/root
 * Get root categories (no parent)
 */
productsRoutes.get("/categories/root", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const categories = await categoriesService.findRootCategories(organizationId);
    return c.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch root categories";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/categories/with-products
 * Get categories with product counts (filters out empty categories)
 */
productsRoutes.get("/categories/with-products", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const activeOnly = c.req.query("activeOnly") === "true";
    const categories = await categoriesService.findCategoriesWithProducts(organizationId, activeOnly);
    return c.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/categories/with-counts
 * Get all categories with product counts (includes categories with 0 products)
 */
productsRoutes.get("/categories/with-counts", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const activeOnly = c.req.query("activeOnly") === "true";
    const categories = activeOnly
      ? await categoriesService.findAllWithActiveProductCounts(organizationId)
      : await categoriesService.findAllWithProductCounts(organizationId);
    return c.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories with counts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/categories/:id
 * Get category by ID
 */
productsRoutes.get("/categories/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const category = await categoriesService.findById(id, organizationId);
    return c.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/categories/:id/children
 * Get category with its children
 */
productsRoutes.get("/categories/:id/children", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const category = await categoriesService.findByIdWithChildren(id, organizationId);
    return c.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/categories/:id/breadcrumb
 * Get category breadcrumb path
 */
productsRoutes.get("/categories/:id/breadcrumb", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const breadcrumb = await categoriesService.getBreadcrumb(id, organizationId);
    return c.json({ success: true, data: breadcrumb });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/categories/slug/:slug
 * Get category by slug
 */
productsRoutes.get("/categories/slug/:slug", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const slug = c.req.param("slug");
    const category = await categoriesService.findBySlug(slug, organizationId);
    return c.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /products/categories
 * Create a new category
 */
productsRoutes.post("/categories", zValidator("json", createCategorySchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");
    const category = await categoriesService.create(data, organizationId);
    return c.json({ success: true, data: category }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/categories/:id
 * Update a category
 */
productsRoutes.put("/categories/:id", zValidator("json", updateCategorySchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const category = await categoriesService.update(id, data, organizationId);
    return c.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/categories/:id/move
 * Move category to different parent
 */
productsRoutes.put("/categories/:id/move", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const { newParentId } = await c.req.json();
    const category = await categoriesService.moveCategory(id, newParentId, organizationId);
    return c.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move category";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/categories/:id
 * Delete a category
 */
productsRoutes.delete("/categories/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const { deleteChildren, moveChildrenTo } = c.req.query();

    const options = {
      deleteChildren: deleteChildren === "true",
      moveChildrenTo: moveChildrenTo || undefined,
    };

    await categoriesService.delete(id, organizationId, options);
    return c.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== COLLECTIONS ROUTES ====================
// NOTE: These must come BEFORE /products/:id to avoid route conflicts

/**
 * GET /products/collections
 * Get all collections
 */
productsRoutes.get("/collections", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const collections = await collectionsService.findAll(organizationId);
    return c.json({ success: true, data: collections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch collections";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/collections/active
 * Get active collections
 */
productsRoutes.get("/collections/active", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const collections = await collectionsService.findActiveCollections(organizationId);
    return c.json({ success: true, data: collections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch active collections";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/collections/with-counts
 * Get all collections with product counts
 */
productsRoutes.get("/collections/with-counts", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const collections = await collectionsService.findAllWithProductCounts(organizationId);
    return c.json({ success: true, data: collections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch collections with counts";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/collections/:id
 * Get collection by ID
 */
productsRoutes.get("/collections/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const collection = await collectionsService.findById(id, organizationId);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/collections/:id/products
 * Get collection with products
 */
productsRoutes.get("/collections/:id/products", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const activeOnly = c.req.query("activeOnly") === "true";
    const collection = await collectionsService.findByIdWithProducts(id, organizationId, activeOnly);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/collections/slug/:slug
 * Get collection by slug
 */
productsRoutes.get("/collections/slug/:slug", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const slug = c.req.param("slug");
    const collection = await collectionsService.findBySlug(slug, organizationId);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /products/collections
 * Create a new collection
 */
productsRoutes.post("/collections", zValidator("json", createCollectionSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");
    const collection = await collectionsService.create(data, organizationId);
    return c.json({ success: true, data: collection }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/collections/:id/products
 * Add product to collection
 */
productsRoutes.post("/collections/:id/products", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const { productId, position } = await c.req.json();
    const result = await collectionsService.addProduct(id, productId, organizationId, position);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add product to collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/collections/:id/products/bulk
 * Add multiple products to collection
 */
productsRoutes.post("/collections/:id/products/bulk", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const { productIds } = await c.req.json();
    const result = await collectionsService.addMultipleProducts(id, productIds, organizationId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add products to collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/collections/:id
 * Update a collection
 */
productsRoutes.put("/collections/:id", zValidator("json", updateCollectionSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const collection = await collectionsService.update(id, data, organizationId);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/collections/:id/activate
 * Activate a collection
 */
productsRoutes.put("/collections/:id/activate", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const collection = await collectionsService.activate(id, organizationId);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/collections/:id/deactivate
 * Deactivate a collection
 */
productsRoutes.put("/collections/:id/deactivate", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const collection = await collectionsService.deactivate(id, organizationId);
    return c.json({ success: true, data: collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deactivate collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/collections/:id
 * Delete a collection
 */
productsRoutes.delete("/collections/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    await collectionsService.delete(id, organizationId);
    return c.json({ success: true, message: "Collection deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete collection";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/collections/:collectionId/products/:productId
 * Remove product from collection
 */
productsRoutes.delete("/collections/:collectionId/products/:productId", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const collectionId = c.req.param("collectionId");
    const productId = c.req.param("productId");
    await collectionsService.removeProduct(collectionId, productId, organizationId);
    return c.json({ success: true, message: "Product removed from collection" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove product from collection";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== ATTRIBUTES ROUTES ====================
// NOTE: These must come BEFORE /products/:id to avoid route conflicts

/**
 * GET /products/attributes
 * Get all attributes
 */
productsRoutes.get("/attributes", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const withValues = c.req.query("withValues") === "true";

    const attributes = withValues
      ? await attributesService.findAllAttributesWithValues(organizationId)
      : await attributesService.findAllAttributes(organizationId);

    return c.json({ success: true, data: attributes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch attributes";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/attributes/:id
 * Get attribute by ID
 */
productsRoutes.get("/attributes/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const withValues = c.req.query("withValues") === "true";

    const attribute = withValues
      ? await attributesService.findAttributeWithValues(id, organizationId)
      : await attributesService.findAttributeById(id, organizationId);

    return c.json({ success: true, data: attribute });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attribute not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/attributes/:id/values
 * Get all values for an attribute
 */
productsRoutes.get("/attributes/:id/values", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const values = await attributesService.findValuesByAttributeId(id, organizationId);
    return c.json({ success: true, data: values });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch attribute values";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * POST /products/attributes
 * Create a new attribute
 */
productsRoutes.post("/attributes", zValidator("json", createAttributeSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");
    const attribute = await attributesService.createAttribute(data, organizationId);
    return c.json({ success: true, data: attribute }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create attribute";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/attributes/with-values
 * Create attribute with values
 */
productsRoutes.post("/attributes/with-values", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = await c.req.json();
    const attribute = await attributesService.createAttributeWithValues(data, organizationId);
    return c.json({ success: true, data: attribute }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create attribute with values";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/attributes/:id/values
 * Add value to attribute
 */
productsRoutes.post("/attributes/:id/values", zValidator("json", createAttributeValueSchema.omit({ attributeId: true })), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const attributeId = c.req.param("id");
    const data = c.req.valid("json");
    const value = await attributesService.createAttributeValue({ ...data, attributeId }, organizationId);
    return c.json({ success: true, data: value }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create attribute value";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/attributes/:id/values/bulk
 * Add multiple values to attribute
 */
productsRoutes.post("/attributes/:id/values/bulk", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const attributeId = c.req.param("id");
    const { values } = await c.req.json();
    const result = await attributesService.createMultipleAttributeValues(attributeId, values, organizationId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create attribute values";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/attributes/:id
 * Update an attribute
 */
productsRoutes.put("/attributes/:id", zValidator("json", updateAttributeSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const attribute = await attributesService.updateAttribute(id, data, organizationId);
    return c.json({ success: true, data: attribute });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attribute";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/attribute-values/:id
 * Update an attribute value
 */
productsRoutes.put("/attribute-values/:id", zValidator("json", updateAttributeValueSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const value = await attributesService.updateAttributeValue(id, data);
    return c.json({ success: true, data: value });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attribute value";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/attributes/:id
 * Delete an attribute
 */
productsRoutes.delete("/attributes/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    await attributesService.deleteAttribute(id, organizationId);
    return c.json({ success: true, message: "Attribute deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete attribute";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/attribute-values/:id
 * Delete an attribute value
 */
productsRoutes.delete("/attribute-values/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await attributesService.deleteAttributeValue(id);
    return c.json({ success: true, message: "Attribute value deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete attribute value";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== VARIANT ATTRIBUTES ROUTES ====================

/**
 * GET /products/variants/:id/attributes
 * Get all attributes for a variant
 */
productsRoutes.get("/variants/:id/attributes", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const attributes = await attributesService.getVariantAttributes(id, organizationId);
    return c.json({ success: true, data: attributes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch variant attributes";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * POST /products/variants/:id/attributes
 * Link attribute to variant
 */
productsRoutes.post("/variants/:id/attributes", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const productVariantId = c.req.param("id");
    const { attributeValueId } = await c.req.json();
    const result = await attributesService.linkAttributeToVariant({
      productVariantId,
      attributeValueId,
    }, organizationId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to link attribute to variant";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/variants/:id/attributes
 * Update variant attributes (replace all)
 */
productsRoutes.put("/variants/:id/attributes", async (c) => {
  try {
    const id = c.req.param("id");
    const { attributeValueIds } = await c.req.json();
    const result = await attributesService.updateVariantAttributes(id, attributeValueIds);
    return c.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update variant attributes";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/variants/:variantId/attributes/:valueId
 * Remove attribute from variant
 */
productsRoutes.delete("/variants/:variantId/attributes/:valueId", async (c) => {
  try {
    const variantId = c.req.param("variantId");
    const valueId = c.req.param("valueId");
    await attributesService.removeAttributeFromVariant(variantId, valueId);
    return c.json({ success: true, message: "Attribute removed from variant" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove attribute from variant";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== IMAGE MANAGEMENT ROUTES ====================
// NOTE: These must come BEFORE /products/:id to avoid route conflicts

/**
 * POST /products/images/upload
 * Upload a product image
 * Expects multipart/form-data with: productId, file, altText?, type?, position?
 */
productsRoutes.post("/images/upload", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const body = await c.req.parseBody();
    const file = body.file as File;
    const productId = body.productId as string;
    const altText = body.altText as string | undefined;
    const type = (body.type as 'thumbnail' | 'gallery' | 'hero' | 'zoom') || 'gallery';
    const position = body.position ? parseInt(body.position as string) : 0;

    if (!file || !productId) {
      return c.json({ success: false, error: "File and productId are required" }, 400);
    }

    const buffer = await file.arrayBuffer();
    const result = await imagesService.uploadProductImage({
      productId,
      organizationId,
      file: Buffer.from(buffer),
      filename: file.name,
      altText,
      type,
      position,
    });

    return c.json({ success: true, data: result.image }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/variants/images/upload
 * Upload a product variant image
 * Expects multipart/form-data with: productVariantId, file, altText?, type?, position?
 */
productsRoutes.post("/variants/images/upload", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const body = await c.req.parseBody();
    const file = body.file as File;
    const productVariantId = body.productVariantId as string;
    const altText = body.altText as string | undefined;
    const type = (body.type as 'thumbnail' | 'gallery' | 'hero' | 'zoom') || 'gallery';
    const position = body.position ? parseInt(body.position as string) : 0;

    if (!file || !productVariantId) {
      return c.json({ success: false, error: "File and productVariantId are required" }, 400);
    }

    const buffer = await file.arrayBuffer();
    const result = await imagesService.uploadProductVariantImage({
      productVariantId,
      organizationId,
      file: Buffer.from(buffer),
      filename: file.name,
      altText,
      type,
      position,
    });

    return c.json({ success: true, data: result.image }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload variant image";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * GET /products/images/:productId
 * Get all images for a product
 */
productsRoutes.get("/images/:productId", async (c) => {
  try {
    const productId = c.req.param("productId");
    const images = await imagesService.getProductImages(productId);
    return c.json({ success: true, data: images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product images";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /products/variants/images/:variantId
 * Get all images for a product variant
 */
productsRoutes.get("/variants/images/:variantId", async (c) => {
  try {
    const variantId = c.req.param("variantId");
    const images = await imagesService.getProductVariantImages(variantId);
    return c.json({ success: true, data: images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch variant images";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * PUT /products/images/:imageId
 * Update product image metadata
 */
productsRoutes.put("/images/:imageId", zValidator("json", updateProductImageSchema), async (c) => {
  try {
    const imageId = c.req.param("imageId");
    const data = c.req.valid("json");
    const image = await imagesService.updateProductImage(imageId, data);
    return c.json({ success: true, data: image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update image";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/variants/images/:imageId
 * Update product variant image metadata
 */
productsRoutes.put("/variants/images/:imageId", zValidator("json", updateProductVariantImageSchema), async (c) => {
  try {
    const imageId = c.req.param("imageId");
    const data = c.req.valid("json");
    const image = await imagesService.updateProductVariantImage(imageId, data);
    return c.json({ success: true, data: image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update variant image";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/images/:productId/reorder
 * Reorder product images
 * Expects JSON: { imageIds: string[] }
 */
productsRoutes.put("/images/:productId/reorder", async (c) => {
  try {
    const productId = c.req.param("productId");
    const { imageIds } = await c.req.json();

    if (!Array.isArray(imageIds)) {
      return c.json({ success: false, error: "imageIds must be an array" }, 400);
    }

    await imagesService.reorderProductImages(productId, imageIds);
    return c.json({ success: true, message: "Images reordered successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder images";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/variants/images/:variantId/reorder
 * Reorder product variant images
 * Expects JSON: { imageIds: string[] }
 */
productsRoutes.put("/variants/images/:variantId/reorder", async (c) => {
  try {
    const variantId = c.req.param("variantId");
    const { imageIds } = await c.req.json();

    if (!Array.isArray(imageIds)) {
      return c.json({ success: false, error: "imageIds must be an array" }, 400);
    }

    await imagesService.reorderProductVariantImages(variantId, imageIds);
    return c.json({ success: true, message: "Variant images reordered successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder variant images";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/images/:imageId
 * Delete a product image
 */
productsRoutes.delete("/images/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    await imagesService.deleteProductImage(imageId);
    return c.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete image";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/variants/images/:imageId
 * Delete a product variant image
 */
productsRoutes.delete("/variants/images/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    await imagesService.deleteProductVariantImage(imageId);
    return c.json({ success: true, message: "Variant image deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete variant image";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== PRODUCTS BY ID ROUTES ====================
// NOTE: These MUST come LAST to avoid catching specific routes above

/**
 * GET /products/:id
 * Get product by ID
 */
productsRoutes.get("/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const product = await productsService.findById(id, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/:id/variants
 * Get product with its variants
 */
productsRoutes.get("/:id/variants", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const product = await productsService.findByIdWithVariants(id, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/:id/availability
 * Check product availability
 */
productsRoutes.get("/:id/availability", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const availability = await productsService.checkAvailability(id, organizationId);
    return c.json({ success: true, data: availability });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/slug/:slug
 * Get product by slug
 */
productsRoutes.get("/slug/:slug", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const slug = c.req.param("slug");
    const product = await productsService.findBySlug(slug, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /products/slug/:slug/variants
 * Get product by slug with variants
 */
productsRoutes.get("/slug/:slug/variants", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const slug = c.req.param("slug");
    const product = await productsService.findBySlugWithVariants(slug, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /products
 * Create a new product
 */
productsRoutes.post("/", zValidator("json", createProductSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid("json");
    const product = await productsService.create(data, organizationId);
    return c.json({ success: true, data: product }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/preview-variants
 * Preview variant combinations without creating them
 */
productsRoutes.post("/preview-variants", async (c) => {
  try {
    const { productSlug, attributes, defaultPrice, defaultQuantity } = await c.req.json();
    const variants = await productsService.previewVariantCombinations(
      productSlug,
      attributes,
      defaultPrice,
      defaultQuantity
    );
    return c.json({ success: true, data: { variants } }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to preview variants";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/with-variants
 * Create product with pre-configured variants (after user edits in UI)
 */
productsRoutes.post("/with-variants", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = await c.req.json();
    const result = await productsService.createProductWithVariants(data, organizationId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product with variants";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/generate-variants
 * Create product with auto-generated variants from attributes
 * DEPRECATED: Use /products/with-variants for better control
 */
productsRoutes.post("/generate-variants", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const data = await c.req.json();
    const result = await productsService.createProductWithGeneratedVariants(data, organizationId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate variants";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /products/:id/variants/generate
 * Generate and create variants for existing product
 */
productsRoutes.post("/:id/variants/generate", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const { attributes, defaultPrice, defaultQuantity } = await c.req.json();
    const result = await productsService.generateAndCreateVariants(id, organizationId, attributes, defaultPrice, defaultQuantity);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate variants";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/:id
 * Update a product
 */
productsRoutes.put("/:id", zValidator("json", updateProductSchema), async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const product = await productsService.update(id, data, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/:id/activate
 * Activate a product
 */
productsRoutes.put("/:id/activate", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const product = await productsService.activate(id, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate product";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /products/:id/deactivate
 * Deactivate a product
 */
productsRoutes.put("/:id/deactivate", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const product = await productsService.deactivate(id, organizationId);
    return c.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deactivate product";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /products/:id
 * Delete a product
 */
productsRoutes.delete("/:id", async (c) => {
  try {
    const organizationId = getOrganizationId(c);
    const id = c.req.param("id");
    const hard = c.req.query("hard") === "true";
    await productsService.delete(id, organizationId, hard);
    return c.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return c.json({ success: false, error: message }, 400);
  }
});
