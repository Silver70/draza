import { collectionsRepo, collectionProductsRepo } from "../repo/collections.repo";
import { productsRepo } from "../repo";
import { NewCollection, UpdateCollection, NewCollectionProduct } from "../products.types";
import { generateSlug } from "../utils";

export const collectionsService = {
  /**
   * Get all collections
   */
  findAll: async (organizationId: string) => {
    const collections = await collectionsRepo.getAllCollections(organizationId);
    return collections;
  },

  /**
   * Get active collections only (for customer-facing views)
   */
  findActiveCollections: async (organizationId: string) => {
    const collections = await collectionsRepo.getActiveCollections(organizationId);
    return collections;
  },

  /**
   * Get a single collection by ID
   */
  findById: async (id: string, organizationId: string) => {
    const collection = await collectionsRepo.getCollectionById(id, organizationId);

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  },

  /**
   * Get collection by slug (for customer-facing URLs)
   */
  findBySlug: async (slug: string, organizationId: string) => {
    const collection = await collectionsRepo.getCollectionBySlug(slug, organizationId);

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  },

  /**
   * Get collection with its products
   */
  findByIdWithProducts: async (id: string, organizationId: string, activeOnly: boolean = false) => {
    const collection = await collectionsRepo.getCollectionById(id, organizationId);

    if (!collection) {
      throw new Error("Collection not found");
    }

    const collectionProducts = await collectionProductsRepo.getProductsByCollectionId(id);

    // Get full product details
    const productIds = collectionProducts.map((cp) => cp.productId);
    const products = await productsRepo.getAllProducts(organizationId);
    let collectionProductDetails = products.filter((p) => productIds.includes(p.id));

    // Filter by active status if requested
    if (activeOnly) {
      collectionProductDetails = collectionProductDetails.filter((p) => p.isActive);
    }

    return {
      ...collection,
      products: collectionProductDetails,
      productCount: collectionProductDetails.length,
    };
  },

  /**
   * Create a new collection
   */
  create: async (data: Omit<NewCollection, "organizationId"> | (Omit<NewCollection, "slug" | "organizationId"> & { slug?: string }), organizationId: string) => {
    // Auto-generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingCollection = await collectionsRepo.getCollectionBySlug(slug, organizationId);
    if (existingCollection) {
      throw new Error("Collection with this slug already exists");
    }

    return await collectionsRepo.createCollection({ ...data, slug }, organizationId);
  },

  /**
   * Update a collection
   */
  update: async (id: string, data: UpdateCollection, organizationId: string) => {
    // Check if collection exists
    const existingCollection = await collectionsRepo.getCollectionById(id, organizationId);
    if (!existingCollection) {
      throw new Error("Collection not found");
    }

    // If updating slug, check it's not already taken by another collection
    if (data.slug && data.slug !== existingCollection.slug) {
      const slugExists = await collectionsRepo.getCollectionBySlug(data.slug, organizationId);
      if (slugExists && slugExists.id !== id) {
        throw new Error("Collection with this slug already exists");
      }
    }

    return await collectionsRepo.updateCollection(id, data);
  },

  /**
   * Delete a collection
   */
  delete: async (id: string, organizationId: string) => {
    const collection = await collectionsRepo.getCollectionById(id, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Remove all product associations first
    const collectionProducts = await collectionProductsRepo.getProductsByCollectionId(id);
    for (const cp of collectionProducts) {
      await collectionProductsRepo.removeProductFromCollection(id, cp.productId);
    }

    return await collectionsRepo.deleteCollection(id);
  },

  /**
   * Add product to collection
   */
  addProduct: async (collectionId: string, productId: string, organizationId: string, position?: number) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify product exists
    const product = await productsRepo.getProductById(productId, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product already in collection
    const existingProducts = await collectionProductsRepo.getProductsByCollectionId(collectionId);
    const alreadyExists = existingProducts.some((cp) => cp.productId === productId);

    if (alreadyExists) {
      throw new Error("Product already in this collection");
    }

    return await collectionProductsRepo.addProductToCollection({
      collectionId,
      productId,
      position: position ?? null,
    });
  },

  /**
   * Remove product from collection
   */
  removeProduct: async (collectionId: string, productId: string, organizationId: string) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    return await collectionProductsRepo.removeProductFromCollection(collectionId, productId);
  },

  /**
   * Add multiple products to collection
   */
  addMultipleProducts: async (
    collectionId: string,
    productIds: string[],
    organizationId: string
  ) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get existing products in collection
    const existingProducts = await collectionProductsRepo.getProductsByCollectionId(collectionId);
    const existingProductIds = new Set(existingProducts.map((cp) => cp.productId));

    for (const productId of productIds) {
      try {
        // Check if product exists
        const product = await productsRepo.getProductById(productId, organizationId);
        if (!product) {
          results.errors.push(`Product ${productId} not found`);
          continue;
        }

        // Skip if already in collection
        if (existingProductIds.has(productId)) {
          results.skipped++;
          continue;
        }

        await collectionProductsRepo.addProductToCollection({
          collectionId,
          productId,
          position: null,
        });

        results.added++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Failed to add product ${productId}: ${errorMessage}`);
      }
    }

    return results;
  },

  /**
   * Get collections that contain a specific product
   */
  findCollectionsByProduct: async (productId: string, organizationId: string) => {
    // Verify product exists
    const product = await productsRepo.getProductById(productId, organizationId);
    if (!product) {
      throw new Error("Product not found");
    }

    const collectionProducts = await collectionProductsRepo.getCollectionsByProductId(productId);
    const collectionIds = collectionProducts.map((cp) => cp.collectionId);

    const allCollections = await collectionsRepo.getAllCollections(organizationId);
    return allCollections.filter((c) => collectionIds.includes(c.id));
  },

  /**
   * Activate a collection
   */
  activate: async (id: string, organizationId: string) => {
    const collection = await collectionsRepo.getCollectionById(id, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    return await collectionsRepo.updateCollection(id, { isActive: true });
  },

  /**
   * Deactivate a collection
   */
  deactivate: async (id: string, organizationId: string) => {
    const collection = await collectionsRepo.getCollectionById(id, organizationId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    return await collectionsRepo.updateCollection(id, { isActive: false });
  },

  /**
   * Get collection with product count
   */
  findAllWithProductCounts: async (organizationId: string) => {
    const collections = await collectionsRepo.getAllCollections(organizationId);

    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const products = await collectionProductsRepo.getProductsByCollectionId(collection.id);
        return {
          ...collection,
          productCount: products.length,
        };
      })
    );

    return collectionsWithCounts;
  },
};
