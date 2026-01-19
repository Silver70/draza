import { productsRepo, productVariantsRepo } from "../repo";
import { categoriesRepo } from "../repo/catagories.repo";
import {
  NewProduct,
  UpdateProduct,
  NewProductVariant,
} from "../products.types";
import { generateSlug, generateSKU, generateUniqueSKU } from "../utils";
import {
  generateVariantCombinations,
  bulkCreateVariants,
  AttributeWithValues,
} from "../utils/variantGenerator";

export const productsService = {
  /**
   * Get all products with optional filtering
   */
  findAll: async (filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }, organizationId?: string) => {
    const products = await productsRepo.getAllProducts(organizationId!);

    if (!products || products.length === 0) {
      return [];
    }

    // Apply filters
    let filteredProducts = products;

    if (filters?.categoryId) {
      filteredProducts = filteredProducts.filter(
        (p) => p.categoryId === filters.categoryId
      );
    }

    if (filters?.isActive !== undefined) {
      filteredProducts = filteredProducts.filter(
        (p) => p.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredProducts;
  },

  /**
   * Get active products only (for customer-facing views)
   */
  findActiveProducts: async (organizationId: string) => {
    const products = await productsRepo.getAllProducts(organizationId);
    return products.filter((p) => p.isActive);
  },

  /**
   * Get a single product by ID
   */
  findById: async (id: string, organizationId: string) => {
    const product = await productsRepo.getProductById(id, organizationId);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  },

  /**
   * Get product with its variants
   */
  findByIdWithVariants: async (id: string, organizationId: string) => {
    const product = await productsRepo.getProductById(id, organizationId);

    if (!product) {
      throw new Error("Product not found");
    }

    const variants = await productVariantsRepo.getProductVariantsByProductId(id);

    return {
      ...product,
      variants,
    };
  },

  /**
   * Get product by slug (for customer-facing URLs)
   */
  findBySlug: async (slug: string, organizationId: string) => {
    const products = await productsRepo.getAllProducts(organizationId);
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  },

  /**
   * Get product by slug with variants (for product detail pages)
   */
  findBySlugWithVariants: async (slug: string, organizationId: string) => {
    const products = await productsRepo.getAllProducts(organizationId);
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      throw new Error("Product not found");
    }

    const variants = await productVariantsRepo.getProductVariantsByProductId(
      product.id
    );

    return {
      ...product,
      variants,
    };
  },

  /**
   * Create a new product
   */
  create: async (data: Omit<NewProduct, "organizationId"> | (Omit<NewProduct, "slug" | "organizationId"> & { slug?: string }), organizationId: string) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.categoryId, organizationId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Auto-generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const products = await productsRepo.getAllProducts(organizationId);
    const existingProduct = products.find((p) => p.slug === slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    return await productsRepo.createProduct({ ...data, slug }, organizationId);
  },

  /**
   * Create a product with variants in a single transaction
   */
  createWithVariants: async (data: {
    product: NewProduct | (Omit<NewProduct, "slug"> & { slug?: string });
    variants?: Array<Omit<NewProductVariant, "productId"> & { sku?: string }>;
  }, organizationId: string) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.product.categoryId, organizationId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Auto-generate slug if not provided
    const slug = data.product.slug || generateSlug(data.product.name);

    // Check if slug already exists
    const products = await productsRepo.getAllProducts(organizationId);
    const existingProduct = products.find((p) => p.slug === slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    // Create the product
    const product = await productsRepo.createProduct({ ...data.product, slug }, organizationId);

    // Create variants if provided
    const variants = [];
    if (data.variants && data.variants.length > 0) {
      for (const variantData of data.variants) {
        // Auto-generate SKU if not provided
        const sku = variantData.sku || generateUniqueSKU(slug, []);

        const variant = await productVariantsRepo.createProductVariant({
          ...variantData,
          sku,
          productId: product.id,
        });
        variants.push(variant);
      }
    }

    return {
      ...product,
      variants,
    };
  },

  /**
   * Update a product
   */
  update: async (id: string, data: UpdateProduct, organizationId: string) => {
    // Check if product exists
    const existingProduct = await productsRepo.getProductById(id, organizationId);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // If updating category, validate it exists
    if (data.categoryId) {
      const category = await categoriesRepo.getCategoryById(data.categoryId, organizationId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    // If updating slug, check it's not already taken by another product
    if (data.slug && data.slug !== existingProduct.slug) {
      const products = await productsRepo.getAllProducts(organizationId);
      const slugExists = products.find(
        (p) => p.slug === data.slug && p.id !== id
      );
      if (slugExists) {
        throw new Error("Product with this slug already exists");
      }
    }

    return await productsRepo.updateProduct(id, data);
  },

  /**
   * Activate a product (make it visible to customers)
   */
  activate: async (id: string, organizationId: string) => {
    const product = await productsRepo.getProductById(id, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product has at least one variant with stock
    const variants = await productVariantsRepo.getProductVariantsByProductId(id);
    if (!variants || variants.length === 0) {
      throw new Error("Cannot activate product without variants");
    }

    const hasStock = variants.some((v) => v.quantityInStock > 0);
    if (!hasStock) {
      throw new Error("Cannot activate product without stock");
    }

    return await productsRepo.updateProduct(id, { isActive: true });
  },

  /**
   * Deactivate a product (hide from customers)
   */
  deactivate: async (id: string, organizationId: string) => {
    const product = await productsRepo.getProductById(id, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    return await productsRepo.updateProduct(id, { isActive: false });
  },

  /**
   * 
   * Delete a product (soft delete by deactivating, or hard delete)
   */
  delete: async (id: string, organizationId: string, hard: boolean = false) => {
    const product = await productsRepo.getProductById(id, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (hard) {
      // Hard delete: remove from database
      // First delete all variants
      const variants = await productVariantsRepo.getProductVariantsByProductId(id);
      for (const variant of variants) {
        await productVariantsRepo.deleteProductVariant(variant.id);
      }

      // Then delete the product
      return await productsRepo.deleteProduct(id);
    } else {
      // Soft delete: just deactivate
      return await productsRepo.updateProduct(id, { isActive: false });
    }
  },

  /**
   * Get products by category
   */
  findByCategory: async (categoryId: string, organizationId: string, activeOnly: boolean = true) => {
    const products = await productsRepo.getAllProducts(organizationId);

    let filtered = products.filter((p) => p.categoryId === categoryId);

    if (activeOnly) {
      filtered = filtered.filter((p) => p.isActive);
    }

    return filtered;
  },

  /**
   * Check product availability (has active variants with stock)
   */
  checkAvailability: async (id: string, organizationId: string) => {
    const product = await productsRepo.getProductById(id, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.isActive) {
      return {
        available: false,
        reason: "Product is not active",
        inStock: false,
      };
    }

    const variants = await productVariantsRepo.getProductVariantsByProductId(id);

    if (!variants || variants.length === 0) {
      return {
        available: false,
        reason: "No variants available",
        inStock: false,
      };
    }

    const totalStock = variants.reduce((sum, v) => sum + v.quantityInStock, 0);
    const inStock = totalStock > 0;

    return {
      available: inStock,
      reason: inStock ? "Available" : "Out of stock",
      inStock,
      totalStock,
      variantsCount: variants.length,
    };
  },

  /**
   * Get low stock products (for inventory management)
   */
  findLowStockProducts: async (organizationId: string, threshold: number = 10) => {
    const products = await productsRepo.getAllProducts(organizationId);
    const lowStockProducts = [];

    for (const product of products) {
      const variants = await productVariantsRepo.getProductVariantsByProductId(
        product.id
      );
      const totalStock = variants.reduce((sum, v) => sum + v.quantityInStock, 0);

      if (totalStock <= threshold && totalStock > 0) {
        lowStockProducts.push({
          ...product,
          totalStock,
          variants,
        });
      }
    }

    return lowStockProducts;
  },

  /**
   * Get out of stock products
   */
  findOutOfStockProducts: async (organizationId: string) => {
    const products = await productsRepo.getAllProducts(organizationId);
    const outOfStockProducts = [];

    for (const product of products) {
      const variants = await productVariantsRepo.getProductVariantsByProductId(
        product.id
      );
      const totalStock = variants.reduce((sum, v) => sum + v.quantityInStock, 0);

      if (totalStock === 0) {
        outOfStockProducts.push({
          ...product,
          variants,
        });
      }
    }

    return outOfStockProducts;
  },

  /**
   * Preview variant combinations from attributes (without creating them)
   * Used for showing user what variants will be created before saving
   */
  previewVariantCombinations: async (
    productSlug: string,
    attributes: AttributeWithValues[],
    defaultPrice: number,
    defaultQuantity: number = 0
  ) => {
    return generateVariantCombinations(productSlug, attributes, defaultPrice, defaultQuantity);
  },

  /**
   * Generate variant combinations from attributes (without creating them)
   * For existing products
   */
  generateVariantCombinations: async (
    productId: string,
    organizationId: string,
    attributes: AttributeWithValues[],
    defaultPrice: number,
    defaultQuantity: number = 0
  ) => {
    const product = await productsRepo.getProductById(productId, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    return generateVariantCombinations(product.slug, attributes, defaultPrice, defaultQuantity);
  },

  /**
   * Generate and create variants from attribute combinations
   */
  generateAndCreateVariants: async (
    productId: string,
    organizationId: string,
    attributes: AttributeWithValues[],
    defaultPrice: number,
    defaultQuantity: number = 0
  ) => {
    const product = await productsRepo.getProductById(productId, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Generate all variant combinations
    const variantCombinations = generateVariantCombinations(
      product.slug,
      attributes,
      defaultPrice,
      defaultQuantity
    );

    if (variantCombinations.length === 0) {
      throw new Error("No variant combinations generated");
    }

    // Bulk create variants
    const result = await bulkCreateVariants(productId, variantCombinations, organizationId);

    return result;
  },

  /**
   * Create a product with pre-configured variants
   * Used when user has edited variant prices/quantities in the UI
   */
  createProductWithVariants: async (data: {
    product: NewProduct | (Omit<NewProduct, "slug"> & { slug?: string });
    variants: Array<{
      sku: string;
      price: number;
      quantityInStock: number;
      attributeValueIds: string[];
    }>;
  }, organizationId: string) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.product.categoryId, organizationId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Auto-generate slug if not provided
    const slug = data.product.slug || generateSlug(data.product.name);

    // Check if slug already exists
    const products = await productsRepo.getAllProducts(organizationId);
    const existingProduct = products.find((p) => p.slug === slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    // Create the product
    const product = await productsRepo.createProduct({ ...data.product, slug }, organizationId);

    // Transform variants to include empty attributeDetails for bulkCreateVariants
    const variantsWithDetails = data.variants.map(v => ({
      ...v,
      attributeDetails: [] as Array<{ attributeId: string; attributeName: string; value: string }>
    }));

    // Create variants with user-provided data
    const variantResult = await bulkCreateVariants(product.id, variantsWithDetails, organizationId);

    return {
      product,
      variantResult,
    };
  },

  /**
   * Create a product with auto-generated variants from attributes
   * DEPRECATED: Use createProductWithVariants instead for better control
   */
  createProductWithGeneratedVariants: async (data: {
    product: NewProduct | (Omit<NewProduct, "slug"> & { slug?: string });
    attributes: AttributeWithValues[];
    defaultPrice: number;
    defaultQuantity?: number;
  }, organizationId: string) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.product.categoryId, organizationId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Auto-generate slug if not provided
    const slug = data.product.slug || generateSlug(data.product.name);

    // Check if slug already exists
    const products = await productsRepo.getAllProducts(organizationId);
    const existingProduct = products.find((p) => p.slug === slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    // Create the product
    const product = await productsRepo.createProduct({ ...data.product, slug }, organizationId);

    // Generate and create variants
    const variantCombinations = generateVariantCombinations(
      slug,
      data.attributes,
      data.defaultPrice,
      data.defaultQuantity || 0
    );

    const variantResult = await bulkCreateVariants(product.id, variantCombinations, organizationId);

    return {
      product,
      variantResult,
    };
  },

  /**
   * Create a single variant with auto-generated SKU
   */
  createVariantWithAutoSKU: async (
    productId: string,
    organizationId: string,
    data: Omit<NewProductVariant, "productId" | "sku"> & { sku?: string; attributeValues?: string[] }
  ) => {
    const product = await productsRepo.getProductById(productId, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Auto-generate SKU if not provided
    const sku = data.sku || generateSKU(product.slug, data.attributeValues || []);

    // Check if SKU already exists
    const existingVariant = await productVariantsRepo.getProductVariantBySku(sku);
    if (existingVariant) {
      // If SKU exists, generate a unique one with timestamp
      const uniqueSKU = generateUniqueSKU(product.slug, data.attributeValues || []);
      return await productVariantsRepo.createProductVariant({
        productId,
        sku: uniqueSKU,
        price: data.price,
        quantityInStock: data.quantityInStock,
        organizationId,
      });
    }

    return await productVariantsRepo.createProductVariant({
      productId,
      sku,
      price: data.price,
      quantityInStock: data.quantityInStock,
      organizationId,
    });

  },
};
