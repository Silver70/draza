import { storageService } from '../../../shared/supabase';
import { productImagesRepo, productVariantImagesRepo } from '../repo';
import { productsRepo, productVariantsRepo } from '../repo/products.repo';
import type { NewProductImage, NewProductVariantImage } from '../products.types';

const BUCKET_NAME = 'product-images';

export type UploadProductImageData = {
  productId: string;
  file: File | Blob | Buffer;
  filename: string;
  altText?: string;
  type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom';
  position?: number;
};

export type UploadProductVariantImageData = {
  productVariantId: string;
  file: File | Blob | Buffer;
  filename: string;
  altText?: string;
  type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom';
  position?: number;
};

export const imagesService = {
  /**
   * Upload a product image (Storage + Database)
   */
  uploadProductImage: async (data: UploadProductImageData) => {
    const { productId, file, filename, altText, type = 'gallery', position = 0 } = data;

    // Verify product exists
    const product = await productsRepo.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Generate unique filename
    const uniqueFilename = storageService.generateUniqueFilename(filename);
    const storagePath = `products/${productId}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const uploadResult = await storageService.uploadImage({
      bucket: BUCKET_NAME,
      path: storagePath,
      file,
      contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
    });

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || 'Failed to upload image');
    }

    // Save to database
    const imageData: NewProductImage = {
      productId,
      url: uploadResult.url,
      altText: altText || null,
      type,
      position,
    };

    const dbImage = await productImagesRepo.createProductImage(imageData);

    return {
      image: dbImage,
      storagePath,
    };
  },

  /**
   * Upload a product variant image (Storage + Database)
   */
  uploadProductVariantImage: async (data: UploadProductVariantImageData) => {
    const { productVariantId, file, filename, altText, type = 'gallery', position = 0 } = data;

    // Verify variant exists
    const variant = await productVariantsRepo.getProductVariantById(productVariantId);
    if (!variant) {
      throw new Error('Product variant not found');
    }

    // Generate unique filename
    const uniqueFilename = storageService.generateUniqueFilename(filename);
    const storagePath = `variants/${productVariantId}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const uploadResult = await storageService.uploadImage({
      bucket: BUCKET_NAME,
      path: storagePath,
      file,
      contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
    });

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || 'Failed to upload image');
    }

    // Save to database
    const imageData: NewProductVariantImage = {
      productVariantId,
      url: uploadResult.url,
      altText: altText || null,
      type,
      position,
    };

    const dbImage = await productVariantImagesRepo.createProductVariantImage(imageData);

    return {
      image: dbImage,
      storagePath,
    };
  },

  /**
   * Delete a product image (Database + Storage)
   */
  deleteProductImage: async (imageId: string) => {
    // Get image from database
    const image = await productImagesRepo.getProductImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Extract storage path from URL
    const storagePath = storageService.extractPathFromUrl(image.url, BUCKET_NAME);

    // Delete from database first
    await productImagesRepo.deleteProductImage(imageId);

    // Then delete from storage (if path extraction succeeded)
    if (storagePath) {
      await storageService.deleteImage(BUCKET_NAME, storagePath);
    }

    return { success: true };
  },

  /**
   * Delete a product variant image (Database + Storage)
   */
  deleteProductVariantImage: async (imageId: string) => {
    // Get image from database
    const image = await productVariantImagesRepo.getProductVariantImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Extract storage path from URL
    const storagePath = storageService.extractPathFromUrl(image.url, BUCKET_NAME);

    // Delete from database first
    await productVariantImagesRepo.deleteProductVariantImage(imageId);

    // Then delete from storage (if path extraction succeeded)
    if (storagePath) {
      await storageService.deleteImage(BUCKET_NAME, storagePath);
    }

    return { success: true };
  },

  /**
   * Delete all images for a product (Database + Storage)
   */
  deleteAllProductImages: async (productId: string) => {
    // Get all images
    const images = await productImagesRepo.getProductImages(productId);

    if (images.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Extract storage paths
    const storagePaths = images
      .map((img) => storageService.extractPathFromUrl(img.url, BUCKET_NAME))
      .filter((path): path is string => path !== null);

    // Delete from database
    await productImagesRepo.deleteAllProductImages(productId);

    // Delete from storage
    if (storagePaths.length > 0) {
      await storageService.deleteImages(BUCKET_NAME, storagePaths);
    }

    return { success: true, deletedCount: images.length };
  },

  /**
   * Delete all images for a product variant (Database + Storage)
   */
  deleteAllProductVariantImages: async (variantId: string) => {
    // Get all images
    const images = await productVariantImagesRepo.getProductVariantImages(variantId);

    if (images.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Extract storage paths
    const storagePaths = images
      .map((img) => storageService.extractPathFromUrl(img.url, BUCKET_NAME))
      .filter((path): path is string => path !== null);

    // Delete from database
    await productVariantImagesRepo.deleteAllProductVariantImages(variantId);

    // Delete from storage
    if (storagePaths.length > 0) {
      await storageService.deleteImages(BUCKET_NAME, storagePaths);
    }

    return { success: true, deletedCount: images.length };
  },

  /**
   * Get all images for a product
   */
  getProductImages: async (productId: string) => {
    return await productImagesRepo.getProductImages(productId);
  },

  /**
   * Get all images for a product variant
   */
  getProductVariantImages: async (variantId: string) => {
    return await productVariantImagesRepo.getProductVariantImages(variantId);
  },

  /**
   * Reorder product images
   */
  reorderProductImages: async (productId: string, imageIds: string[]) => {
    await productImagesRepo.reorderProductImages(imageIds, productId);
    return { success: true };
  },

  /**
   * Reorder product variant images
   */
  reorderProductVariantImages: async (variantId: string, imageIds: string[]) => {
    await productVariantImagesRepo.reorderProductVariantImages(imageIds, variantId);
    return { success: true };
  },

  /**
   * Update product image metadata (alt text, type, position)
   */
  updateProductImage: async (
    imageId: string,
    updates: { altText?: string | null; type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom'; position?: number }
  ) => {
    const image = await productImagesRepo.getProductImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    return await productImagesRepo.updateProductImage(imageId, updates);
  },

  /**
   * Update product variant image metadata (alt text, type, position)
   */
  updateProductVariantImage: async (
    imageId: string,
    updates: { altText?: string | null; type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom'; position?: number }
  ) => {
    const image = await productVariantImagesRepo.getProductVariantImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    return await productVariantImagesRepo.updateProductVariantImage(imageId, updates);
  },
};
