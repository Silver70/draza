# Image Management API Endpoints

All image endpoints are available under `/products` prefix.

## Upload Images

### Upload Product Image
```http
POST /products/images/upload
Content-Type: multipart/form-data

Form Data:
- file: File (required) - Image file
- productId: string (required) - UUID of product
- altText: string (optional) - Alt text for accessibility
- type: "thumbnail" | "gallery" | "hero" | "zoom" (optional, default: "gallery")
- position: number (optional, default: 0)

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "url": "https://project.supabase.co/storage/v1/object/public/product-images/...",
    "altText": "Image description",
    "type": "gallery",
    "position": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Upload Product Variant Image
```http
POST /products/variants/images/upload
Content-Type: multipart/form-data

Form Data:
- file: File (required) - Image file
- productVariantId: string (required) - UUID of variant
- altText: string (optional) - Alt text for accessibility
- type: "thumbnail" | "gallery" | "hero" | "zoom" (optional, default: "gallery")
- position: number (optional, default: 0)

Response: Same as product image
```

## Get Images

### Get Product Images
```http
GET /products/images/:productId

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "url": "https://...",
      "altText": "Image description",
      "type": "gallery",
      "position": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Variant Images
```http
GET /products/variants/images/:variantId

Response: Same as product images
```

## Update Image Metadata

### Update Product Image
```http
PUT /products/images/:imageId
Content-Type: application/json

Body:
{
  "altText": "Updated description",
  "type": "hero",
  "position": 1
}

Response:
{
  "success": true,
  "data": {
    // Updated image object
  }
}
```

### Update Variant Image
```http
PUT /products/variants/images/:imageId
Content-Type: application/json

Body: Same as product image
Response: Same as product image
```

## Reorder Images

### Reorder Product Images
```http
PUT /products/images/:productId/reorder
Content-Type: application/json

Body:
{
  "imageIds": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
  "success": true,
  "message": "Images reordered successfully"
}
```

### Reorder Variant Images
```http
PUT /products/variants/images/:variantId/reorder
Content-Type: application/json

Body: Same as product images
Response: Same as product images
```

## Delete Images

### Delete Product Image
```http
DELETE /products/images/:imageId

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Delete Variant Image
```http
DELETE /products/variants/images/:imageId

Response:
{
  "success": true,
  "message": "Variant image deleted successfully"
}
```

## Complete Flow Example (JavaScript)

### 1. Create Product
```javascript
// Create product first
const productResponse = await fetch('http://localhost:3000/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Cotton T-Shirt',
    categoryId: 'category-uuid',
    description: 'Comfortable cotton t-shirt',
    isActive: false // Keep inactive until images are uploaded
  })
});

const { data: product } = await productResponse.json();
```

### 2. Upload Product Images
```javascript
// Upload main product image
const formData = new FormData();
formData.append('file', imageFile); // File from input
formData.append('productId', product.id);
formData.append('altText', 'Front view of cotton t-shirt');
formData.append('type', 'hero');
formData.append('position', '0');

const imageResponse = await fetch('http://localhost:3000/products/images/upload', {
  method: 'POST',
  body: formData
});

const { data: image } = await imageResponse.json();
```

### 3. Upload Variant Images
```javascript
// After creating variants, upload variant-specific images
const variantFormData = new FormData();
variantFormData.append('file', redVariantFile);
variantFormData.append('productVariantId', variant.id);
variantFormData.append('altText', 'Red color variant');
variantFormData.append('type', 'gallery');

const variantImageResponse = await fetch('http://localhost:3000/products/variants/images/upload', {
  method: 'POST',
  body: variantFormData
});
```

### 4. Reorder Images
```javascript
// Update display order
await fetch(`http://localhost:3000/products/images/${product.id}/reorder`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageIds: ['image-uuid-1', 'image-uuid-2', 'image-uuid-3']
  })
});
```

### 5. Activate Product
```javascript
// Once images are uploaded, activate the product
await fetch(`http://localhost:3000/products/${product.id}/activate`, {
  method: 'PUT'
});
```

## Frontend React Example

```tsx
import { useState } from 'react';

function ProductImageUpload({ productId }: { productId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('type', 'gallery');

    try {
      const response = await fetch('http://localhost:3000/products/images/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('Image uploaded:', result.data.url);
        // Refresh images list or update UI
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `400` - Bad request (missing fields, invalid data)
- `404` - Product/variant/image not found
- `500` - Server error (Supabase connection issues, etc.)

## Notes

- Images are automatically deleted from Supabase Storage when deleted from database
- Maximum file size depends on your Supabase plan (default: 50MB)
- Supported formats: JPG, PNG, WebP, GIF
- Images are ordered by `position` field (ascending)
- First image (position 0) is typically the main/hero image
