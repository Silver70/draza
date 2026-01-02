import { supabase } from './client';

export type ImageUploadOptions = {
  bucket: string;
  path: string;
  file: File | Blob | Buffer;
  contentType?: string;
};

export type ImageUploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Supabase Storage Service
 * Handles all image upload/delete operations with Supabase Storage
 */
export const storageService = {
  /**
   * Upload an image to Supabase Storage
   */
  uploadImage: async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
    try {
      const { bucket, path, file, contentType } = options;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || 'image/jpeg',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete an image from Supabase Storage
   */
  deleteImage: async (bucket: string, path: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Extract path from Supabase Storage URL
   * Example: https://project.supabase.co/storage/v1/object/public/product-images/products/abc/image.jpg
   * Returns: products/abc/image.jpg
   */
  extractPathFromUrl: (url: string, bucket: string): string | null => {
    try {
      const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
      const match = url.match(pattern);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Delete multiple images
   */
  deleteImages: async (bucket: string, paths: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (error) {
        console.error('Supabase bulk delete error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Bulk delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Generate a unique filename with timestamp
   */
  generateUniqueFilename: (originalFilename: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalFilename.split('.').pop();
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    const sanitized = nameWithoutExt.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    return `${sanitized}-${timestamp}-${random}.${extension}`;
  },
};
