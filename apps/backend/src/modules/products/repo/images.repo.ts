import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../../shared/db';
import {
  productImagesTable,
  productVariantImagesTable,
} from '../../../shared/db/catalogue';
import {
  NewProductImage,
  NewProductVariantImage,
  UpdateProductImage,
  UpdateProductVariantImage,
} from '../products.types';

export const productImagesRepo = {
  /**
   * Create a new product image
   */
  createProductImage: async (data: NewProductImage) => {
    const [image] = await db.insert(productImagesTable).values(data).returning();
    return image;
  },

  /**
   * Get all images for a product (ordered by position)
   */
  getProductImages: async (productId: string) => {
    return await db
      .select()
      .from(productImagesTable)
      .where(eq(productImagesTable.productId, productId))
      .orderBy(asc(productImagesTable.position));
  },

  /**
   * Get a single product image by ID
   */
  getProductImageById: async (id: string) => {
    const [image] = await db
      .select()
      .from(productImagesTable)
      .where(eq(productImagesTable.id, id));
    return image;
  },

  /**
   * Update a product image
   */
  updateProductImage: async (id: string, data: UpdateProductImage) => {
    const [image] = await db
      .update(productImagesTable)
      .set(data)
      .where(eq(productImagesTable.id, id))
      .returning();
    return image;
  },

  /**
   * Delete a product image
   */
  deleteProductImage: async (id: string) => {
    const [image] = await db
      .delete(productImagesTable)
      .where(eq(productImagesTable.id, id))
      .returning();
    return image;
  },

  /**
   * Delete all images for a product
   */
  deleteAllProductImages: async (productId: string) => {
    return await db
      .delete(productImagesTable)
      .where(eq(productImagesTable.productId, productId))
      .returning();
  },

  /**
   * Reorder product images
   */
  reorderProductImages: async (imageIds: string[], productId: string) => {
    // Update position for each image based on array order
    const updates = imageIds.map((id, index) =>
      db
        .update(productImagesTable)
        .set({ position: index })
        .where(and(eq(productImagesTable.id, id), eq(productImagesTable.productId, productId)))
    );

    await Promise.all(updates);
  },
};

export const productVariantImagesRepo = {
  /**
   * Create a new product variant image
   */
  createProductVariantImage: async (data: NewProductVariantImage) => {
    const [image] = await db
      .insert(productVariantImagesTable)
      .values(data)
      .returning();
    return image;
  },

  /**
   * Get all images for a product variant (ordered by position)
   */
  getProductVariantImages: async (variantId: string) => {
    return await db
      .select()
      .from(productVariantImagesTable)
      .where(eq(productVariantImagesTable.productVariantId, variantId))
      .orderBy(asc(productVariantImagesTable.position));
  },

  /**
   * Get a single product variant image by ID
   */
  getProductVariantImageById: async (id: string) => {
    const [image] = await db
      .select()
      .from(productVariantImagesTable)
      .where(eq(productVariantImagesTable.id, id));
    return image;
  },

  /**
   * Update a product variant image
   */
  updateProductVariantImage: async (id: string, data: UpdateProductVariantImage) => {
    const [image] = await db
      .update(productVariantImagesTable)
      .set(data)
      .where(eq(productVariantImagesTable.id, id))
      .returning();
    return image;
  },

  /**
   * Delete a product variant image
   */
  deleteProductVariantImage: async (id: string) => {
    const [image] = await db
      .delete(productVariantImagesTable)
      .where(eq(productVariantImagesTable.id, id))
      .returning();
    return image;
  },

  /**
   * Delete all images for a product variant
   */
  deleteAllProductVariantImages: async (variantId: string) => {
    return await db
      .delete(productVariantImagesTable)
      .where(eq(productVariantImagesTable.productVariantId, variantId))
      .returning();
  },

  /**
   * Reorder product variant images
   */
  reorderProductVariantImages: async (imageIds: string[], variantId: string) => {
    // Update position for each image based on array order
    const updates = imageIds.map((id, index) =>
      db
        .update(productVariantImagesTable)
        .set({ position: index })
        .where(
          and(
            eq(productVariantImagesTable.id, id),
            eq(productVariantImagesTable.productVariantId, variantId)
          )
        )
    );

    await Promise.all(updates);
  },
};
