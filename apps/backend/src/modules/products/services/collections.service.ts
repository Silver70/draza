import { collectionsRepo, collectionProductsRepo } from "../repo/collections.repo";
import { productsRepo } from "../repo";
import { NewCollection, UpdateCollection, NewCollectionProduct } from "../products.types";
import { generateSlug } from "../utils";

export const collectionsService = {
  /**
   * Get all collections
   */
  findAll: async () => {
    const collections = await collectionsRepo.getAllCollections();
    return collections;
  },

  /**
   * Get active collections only (for customer-facing views)
   */
  findActiveCollections: async () => {
    const collections = await collectionsRepo.getActiveCollections();
    return collections;
  },

  /**
   * Get a single collection by ID
   */
  findById: async (id: string) => {
    const collection = await collectionsRepo.getCollectionById(id);

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  },

  /**
   * Get collection by slug (for customer-facing URLs)
   */
  findBySlug: async (slug: string) => {
    const collection = await collectionsRepo.getCollectionBySlug(slug);

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  },

  /**
   * Get collection with its products
   */
  findByIdWithProducts: async (id: string) => {
    const collection = await collectionsRepo.getCollectionById(id);

    if (!collection) {
      throw new Error("Collection not found");
    }

    const collectionProducts = await collectionProductsRepo.getProductsByCollectionId(id);

    // Get full product details
    const productIds = collectionProducts.map((cp) => cp.productId);
    const products = await productsRepo.getAllProducts();
    const collectionProductDetails = products.filter((p) => productIds.includes(p.id));

    return {
      ...collection,
      products: collectionProductDetails,
      productCount: collectionProductDetails.length,
    };
  },

  /**
   * Create a new collection
   */
  create: async (data: NewCollection | (Omit<NewCollection, "slug"> & { slug?: string })) => {
    // Auto-generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingCollection = await collectionsRepo.getCollectionBySlug(slug);
    if (existingCollection) {
      throw new Error("Collection with this slug already exists");
    }

    return await collectionsRepo.createCollection({ ...data, slug });
  },

  /**
   * Update a collection
   */
  update: async (id: string, data: UpdateCollection) => {
    // Check if collection exists
    const existingCollection = await collectionsRepo.getCollectionById(id);
    if (!existingCollection) {
      throw new Error("Collection not found");
    }

    // If updating slug, check it's not already taken by another collection
    if (data.slug && data.slug !== existingCollection.slug) {
      const slugExists = await collectionsRepo.getCollectionBySlug(data.slug);
      if (slugExists && slugExists.id !== id) {
        throw new Error("Collection with this slug already exists");
      }
    }

    return await collectionsRepo.updateCollection(id, data);
  },

  /**
   * Delete a collection
   */
  delete: async (id: string) => {
    const collection = await collectionsRepo.getCollectionById(id);
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
  addProduct: async (collectionId: string, productId: string, position?: number) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify product exists
    const product = await productsRepo.getProductById(productId);
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
  removeProduct: async (collectionId: string, productId: string) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId);
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
    productIds: string[]
  ) => {
    // Verify collection exists
    const collection = await collectionsRepo.getCollectionById(collectionId);
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
        const product = await productsRepo.getProductById(productId);
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
  findCollectionsByProduct: async (productId: string) => {
    // Verify product exists
    const product = await productsRepo.getProductById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const collectionProducts = await collectionProductsRepo.getCollectionsByProductId(productId);
    const collectionIds = collectionProducts.map((cp) => cp.collectionId);

    const allCollections = await collectionsRepo.getAllCollections();
    return allCollections.filter((c) => collectionIds.includes(c.id));
  },

  /**
   * Activate a collection
   */
  activate: async (id: string) => {
    const collection = await collectionsRepo.getCollectionById(id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    return await collectionsRepo.updateCollection(id, { isActive: true });
  },

  /**
   * Deactivate a collection
   */
  deactivate: async (id: string) => {
    const collection = await collectionsRepo.getCollectionById(id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    return await collectionsRepo.updateCollection(id, { isActive: false });
  },

  /**
   * Get collection with product count
   */
  findAllWithProductCounts: async () => {
    const collections = await collectionsRepo.getAllCollections();

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
