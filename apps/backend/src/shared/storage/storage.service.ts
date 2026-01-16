import { PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { ensureS3Client } from './s3-client';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'draza-product-images';
const REGION = process.env.AWS_REGION || 'us-east-1';

export type ImageUploadOptions = {
  bucket?: string;
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
 * AWS S3 Storage Service
 * Handles all image upload/delete operations with AWS S3
 */
export const storageService = {
  /**
   * Upload an image to AWS S3
   */
  uploadImage: async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
    try {
      const s3 = ensureS3Client();
      const { path, file, contentType } = options;
      const bucket = options.bucket || BUCKET_NAME;

      // Convert file to buffer
      let buffer: Buffer;
      if (file instanceof Buffer) {
        buffer = file;
      } else if (file instanceof Blob || file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else {
        throw new Error('Unsupported file type');
      }

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: path,
          Body: buffer,
          ContentType: contentType || 'image/jpeg',
          // Make publicly accessible
          ACL: 'public-read',
        })
      );

      // Generate public URL
      const url = `https://${bucket}.s3.${REGION}.amazonaws.com/${path}`;

      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete an image from AWS S3
   */
  deleteImage: async (bucket: string, path: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const s3 = ensureS3Client();

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket || BUCKET_NAME,
          Key: path,
        })
      );

      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Extract path from S3 URL
   * Example: https://bucket.s3.us-east-1.amazonaws.com/products/abc/image.jpg
   * Returns: products/abc/image.jpg
   */
  extractPathFromUrl: (url: string, bucket?: string): string | null => {
    try {
      const bucketName = bucket || BUCKET_NAME;

      // S3 direct URL patterns
      const patterns = [
        // Virtual-hosted-style: https://bucket.s3.region.amazonaws.com/path
        new RegExp(`https://${bucketName}\\.s3\\.${REGION}\\.amazonaws\\.com/(.+)$`),
        // Virtual-hosted-style (legacy): https://bucket.s3.amazonaws.com/path
        new RegExp(`https://${bucketName}\\.s3\\.amazonaws\\.com/(.+)$`),
        // Path-style: https://s3.region.amazonaws.com/bucket/path
        new RegExp(`https://s3\\.${REGION}\\.amazonaws\\.com/${bucketName}/(.+)$`),
        // Path-style (legacy): https://s3.amazonaws.com/bucket/path
        new RegExp(`https://s3\\.amazonaws\\.com/${bucketName}/(.+)$`),
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return decodeURIComponent(match[1]);
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Delete multiple images
   */
  deleteImages: async (bucket: string, paths: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const s3 = ensureS3Client();

      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket || BUCKET_NAME,
          Delete: {
            Objects: paths.map((path) => ({ Key: path })),
          },
        })
      );

      return { success: true };
    } catch (error) {
      console.error('S3 bulk delete error:', error);
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
