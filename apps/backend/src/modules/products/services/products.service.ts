import { productsRepo, productVariantsRepo } from "../repo";
import { categoriesRepo } from "../repo/catagories.repo";
import {
  NewProduct,
  UpdateProduct,
  NewProductVariant,
  UpdateProductVariant,
} from "../products.types";

export const productsService = {
  /**
   * Get all products with optional filtering
   */
  findAll: async (filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }) => {
    const products = await productsRepo.getAllProducts();

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
  findActiveProducts: async () => {
    const products = await productsRepo.getAllProducts();
    return products.filter((p) => p.isActive);
  },

  /**
   * Get a single product by ID
   */
  findById: async (id: string) => {
    const product = await productsRepo.getProductById(id);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  },

  /**
   * Get product with its variants
   */
  findByIdWithVariants: async (id: string) => {
    const product = await productsRepo.getProductById(id);

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
  findBySlug: async (slug: string) => {
    const products = await productsRepo.getAllProducts();
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  },

  /**
   * Get product by slug with variants (for product detail pages)
   */
  findBySlugWithVariants: async (slug: string) => {
    const products = await productsRepo.getAllProducts();
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
  create: async (data: NewProduct) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if slug already exists
    const products = await productsRepo.getAllProducts();
    const existingProduct = products.find((p) => p.slug === data.slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    return await productsRepo.createProduct(data);
  },

  /**
   * Create a product with variants in a single transaction
   */
  createWithVariants: async (data: {
    product: NewProduct;
    variants?: Array<Omit<NewProductVariant, "productId">>;
  }) => {
    // Validate category exists
    const category = await categoriesRepo.getCategoryById(data.product.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if slug already exists
    const products = await productsRepo.getAllProducts();
    const existingProduct = products.find((p) => p.slug === data.product.slug);
    if (existingProduct) {
      throw new Error("Product with this slug already exists");
    }

    // Create the product
    const product = await productsRepo.createProduct(data.product);

    // Create variants if provided
    const variants = [];
    if (data.variants && data.variants.length > 0) {
      for (const variantData of data.variants) {
        const variant = await productVariantsRepo.createProductVariant({
          ...variantData,
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
  update: async (id: string, data: UpdateProduct) => {
    // Check if product exists
    const existingProduct = await productsRepo.getProductById(id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // If updating category, validate it exists
    if (data.categoryId) {
      const category = await categoriesRepo.getCategoryById(data.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    // If updating slug, check it's not already taken by another product
    if (data.slug && data.slug !== existingProduct.slug) {
      const products = await productsRepo.getAllProducts();
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
  activate: async (id: string) => {
    const product = await productsRepo.getProductById(id);
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
  deactivate: async (id: string) => {
    const product = await productsRepo.getProductById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    return await productsRepo.updateProduct(id, { isActive: false });
  },

  /**
   * Delete a product (soft delete by deactivating, or hard delete)
   */
  delete: async (id: string, hard: boolean = false) => {
    const product = await productsRepo.getProductById(id);
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
  findByCategory: async (categoryId: string, activeOnly: boolean = true) => {
    const products = await productsRepo.getAllProducts();

    let filtered = products.filter((p) => p.categoryId === categoryId);

    if (activeOnly) {
      filtered = filtered.filter((p) => p.isActive);
    }

    return filtered;
  },

  /**
   * Check product availability (has active variants with stock)
   */
  checkAvailability: async (id: string) => {
    const product = await productsRepo.getProductById(id);
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
  findLowStockProducts: async (threshold: number = 10) => {
    const products = await productsRepo.getAllProducts();
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
  findOutOfStockProducts: async () => {
    const products = await productsRepo.getAllProducts();
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
};
