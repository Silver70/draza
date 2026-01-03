# Image Upload Integration - Product Creation Form

This document describes the complete image upload integration for the product creation flow.

## What Was Implemented

### Backend (Completed Previously)
- ✅ Image upload API endpoints (`POST /products/images/upload`, `POST /products/variants/images/upload`)
- ✅ Supabase Storage integration
- ✅ Image repository and service layers
- ✅ Automatic cleanup on deletion

### Frontend (Just Implemented)

#### 1. **Image Upload Utilities** (`src/utils/products.ts`)

Added client-side upload functions:
```typescript
uploadProductImages(productId, files[])      // Upload multiple product images
uploadVariantImages(variantImagesMap)        // Upload images for variants
fetchProductImages(productId)                // Get product images
fetchVariantImages(variantId)                // Get variant images
```

#### 2. **State Management**

Added to product create form:
- `productImages` - Array of File objects for product images
- `productImagePreviews` - Array of blob URLs for previewing
- `variantImages` - Map of variantSku → File[] for variant-specific images
- `isUploadingImages` - Loading state during upload

#### 3. **UI Components**

**Product Images Card** - New card between basic info and variants:
- File input with multiple file support
- Image previews with hover-to-delete
- "Main" badge on first image
- Grid layout (responsive: 2/3/4 columns)

**Variant Images** - Added to variant preview table:
- New "Images" column in variant table
- File input per variant row
- Badge display showing selected files
- Click-to-remove functionality

#### 4. **Upload Flow**

Sequential upload after product creation:

```
1. User fills form + selects images
   ↓
2. Click "Create Product"
   ↓
3. Create product + variants (existing flow)
   ↓
4. Upload product images (if any)
   ↓
5. Upload variant images (if any)
   ↓
6. Show success toast with image count
   ↓
7. Navigate to product list
```

**Error Handling:**
- If product creation fails → Show error, no image upload attempted
- If product succeeds but images fail → Show warning toast, product still created
- Image uploads don't block product creation success

## How to Use

### For Users (Product Creation)

1. **Fill Basic Product Info**
   - Name, description, category, price, stock

2. **Upload Product Images** (optional)
   - Click "Upload Images" input
   - Select multiple files (JPG, PNG, WebP, GIF)
   - First image = main/hero image
   - Preview all selected images
   - Hover over preview to remove image

3. **Create Variants** (optional)
   - Add attributes (Size, Color, etc.)
   - Generate variant preview
   - For each variant row:
     - Click image icon or file input
     - Select images for that specific variant
     - Selected files shown as badges

4. **Submit Form**
   - Button shows "Uploading Images..." during upload
   - Success toast shows: "X variants created. Y images uploaded."
   - Automatically redirects to product list

### For Developers

**Adding Image Upload to Another Form:**

```tsx
import { uploadProductImages, uploadVariantImages } from '~/utils/products'

// 1. Add state
const [productImages, setProductImages] = useState<File[]>([])
const [isUploading, setIsUploading] = useState(false)

// 2. Handle file selection
const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  setProductImages(prev => [...prev, ...files])
}

// 3. Upload after product creation
const createProduct = async () => {
  const result = await createProductWithVariants(...)

  try {
    setIsUploading(true)
    if (productImages.length > 0) {
      await uploadProductImages(result.product.id, productImages)
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsUploading(false)
  }
}

// 4. UI
<input type="file" accept="image/*" multiple onChange={handleImagesChange} />
```

## Image Storage Structure

```
Supabase Bucket: product-images
├── products/{productId}/
│   ├── hero-{timestamp}-{random}.jpg
│   └── gallery-{timestamp}-{random}.jpg
└── variants/{variantId}/
    ├── gallery-{timestamp}-{random}.jpg
    └── gallery-{timestamp}-{random}.jpg
```

## Key Features

**Performance:**
- Parallel uploads (all images upload simultaneously)
- Non-blocking (product creation doesn't wait for images)
- Progress indication (button shows uploading state)

**UX:**
- Image previews before upload
- Easy removal of selected images
- First image automatically set as "hero"
- Variant images grouped by variant SKU

**Error Handling:**
- Product creation never fails due to images
- Clear error messages if upload fails
- Option to retry upload later

**Memory Management:**
- Blob URLs properly revoked on cleanup
- Image state cleared on form reset
- No memory leaks from preview URLs

## Environment Setup Required

To enable image uploads, add to `apps/backend/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Then create a public bucket named `product-images` in Supabase Storage.

See `apps/backend/IMAGE_SETUP.md` for complete setup instructions.

## API Response Examples

**Upload Success:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "url": "https://project.supabase.co/storage/v1/object/public/product-images/products/123/image.jpg",
    "altText": null,
    "type": "gallery",
    "position": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Upload Error:**
```json
{
  "success": false,
  "error": "File and productId are required"
}
```

## Testing

**Manual Testing Steps:**

1. **Basic Product with Images:**
   - Create product without variants
   - Upload 3 product images
   - Submit form
   - Verify images appear in Supabase Storage
   - Check product ID in database has 3 image records

2. **Product with Variant Images:**
   - Create product with 2 variants (e.g., Red, Blue)
   - Upload 2 product images
   - Upload 2 images for Red variant
   - Upload 1 image for Blue variant
   - Submit form
   - Verify 5 total images uploaded

3. **Error Cases:**
   - Try uploading without Supabase configured (should warn)
   - Create product, trigger image error (check warning toast)
   - Verify product still created successfully

4. **UI/UX:**
   - Preview images before upload
   - Remove image from preview
   - Reset form (verify images cleared)
   - Check responsive layout (mobile, tablet, desktop)

## Troubleshooting

**Images not uploading:**
- Check backend logs for Supabase credentials
- Verify `product-images` bucket exists
- Check bucket is set to public
- Verify API_BASE_URL is correct in frontend

**Images upload but don't display:**
- Check Supabase bucket CORS settings
- Verify image URLs in database
- Check browser console for CORS errors

**Form feels slow:**
- Normal - images upload sequentially
- Check file sizes (large files take longer)
- Consider adding progress bar for better UX

## Future Enhancements

Potential improvements:
- [ ] Drag-and-drop image reordering
- [ ] Image cropping/editing before upload
- [ ] Progress bar showing upload percentage
- [ ] Image compression before upload
- [ ] Bulk image upload from URL
- [ ] Image gallery lightbox preview
- [ ] Automatic thumbnail generation
