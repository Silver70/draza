# Image Management Setup Guide

This guide will help you set up Supabase Storage for product image management.

## Quick Setup

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)

### 2. Create Storage Bucket

1. In your Supabase dashboard, navigate to **Storage**
2. Click **Create a new bucket**
3. Name it: `product-images`
4. Set it to **Public bucket** (images need to be publicly accessible)
5. Click **Create bucket**

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
- In Supabase dashboard → Settings → API
- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon/public key (not the service_role key)

### 4. Test the Connection

Create a simple test to verify everything works:

```bash
bun run dev
```

The Supabase client will initialize on startup. If credentials are missing, you'll see an error.

## Image Storage Structure

Images are organized as follows:

```
product-images/  (bucket)
├── products/
│   └── {productId}/
│       ├── hero-image-1234567890-abc123.jpg
│       └── gallery-1234567891-def456.jpg
└── variants/
    └── {variantId}/
        ├── front-1234567892-ghi789.jpg
        └── back-1234567893-jkl012.jpg
```

## Usage Examples

### Upload Product Image

```typescript
import { imagesService } from './services/images.service';

const result = await imagesService.uploadProductImage({
  productId: 'uuid-here',
  file: imageBuffer,  // File, Blob, or Buffer
  filename: 'product-hero.jpg',
  altText: 'Main product image',
  type: 'hero',
  position: 0
});

// Returns: { image: {...}, storagePath: 'products/uuid/...' }
```

### Upload Variant Image

```typescript
const result = await imagesService.uploadProductVariantImage({
  productVariantId: 'variant-uuid',
  file: imageBuffer,
  filename: 'red-variant.jpg',
  altText: 'Red color variant',
  type: 'gallery',
  position: 0
});
```

### Get Images

```typescript
// Get all product images (ordered by position)
const images = await imagesService.getProductImages(productId);

// Get all variant images
const variantImages = await imagesService.getProductVariantImages(variantId);
```

### Delete Image

```typescript
// Deletes from both database and Supabase Storage
await imagesService.deleteProductImage(imageId);
await imagesService.deleteProductVariantImage(imageId);
```

### Reorder Images

```typescript
// Update display order
await imagesService.reorderProductImages(productId, [
  'image-id-1',  // position 0
  'image-id-2',  // position 1
  'image-id-3',  // position 2
]);
```

## Image Types

- `thumbnail` - Small preview images (for listing pages, cart)
- `gallery` - Main product page carousel images
- `hero` - Large banner/feature images
- `zoom` - High-resolution images for zoom functionality

## Image Transformations

Supabase supports on-the-fly image transformations via URL parameters:

```typescript
// Original URL from database
const url = 'https://project.supabase.co/storage/v1/object/public/product-images/products/123/image.jpg';

// Resize to 300x300
const thumbnail = url + '?width=300&height=300';

// Optimize quality
const optimized = url + '?quality=80';

// Combine transformations
const resizedOptimized = url + '?width=800&height=800&quality=85';
```

## Security Notes

- The bucket is **public** - anyone with the URL can view images
- For private images, use RLS policies in Supabase
- The `SUPABASE_ANON_KEY` is safe to use client-side
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to clients

## Troubleshooting

**Error: Missing Supabase credentials**
- Check your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Restart your dev server after adding env variables

**Upload fails with 404**
- Verify the bucket `product-images` exists
- Check bucket is set to public

**Images not displaying**
- Verify the bucket is public
- Check CORS settings in Supabase if loading from different domain

**Storage path extraction fails**
- Ensure URLs match pattern: `/storage/v1/object/public/product-images/...`
- Check bucket name is correct in URLs

## Cost Considerations

**Supabase Free Tier:**
- 1GB storage
- 2GB bandwidth/month

**Beyond free tier:**
- Storage: ~$0.021/GB/month
- Bandwidth: ~$0.09/GB

For production, consider:
- Image compression before upload
- Using transformations to serve appropriate sizes
- CDN caching (Supabase includes CDN)
