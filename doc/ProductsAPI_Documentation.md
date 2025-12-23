# Products API Documentation

## Base URL: `/products`

## Products Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | Get all products with optional filters | `?categoryId=uuid&isActive=true/false&search=term` |
| GET | `/active` | Get only active products (customer-facing) | - |
| GET | `/low-stock` | Get products with low stock | `?threshold=10` (default: 10) |
| GET | `/out-of-stock` | Get products that are out of stock | - |
| GET | `/:id` | Get product by ID | - |
| GET | `/:id/variants` | Get product with its variants | - |
| GET | `/:id/availability` | Check product availability and stock | - |
| GET | `/slug/:slug` | Get product by slug (SEO-friendly) | - |
| GET | `/slug/:slug/variants` | Get product by slug with variants | - |
| POST | `/` | Create a new product | Body: `createProductSchema` |
| POST | `/with-variants` | Create product with variants | Body: `{ product, variants[] }` |
| POST | `/generate-variants` | Create product with auto-generated variants | Body: `{ product, attributes[], defaultQuantity }` |
| POST | `/:id/variants/generate` | Generate variants for existing product | Body: `{ attributes[], defaultQuantity }` |
| PUT | `/:id` | Update a product | Body: `updateProductSchema` |
| PUT | `/:id/activate` | Activate a product | - |
| PUT | `/:id/deactivate` | Deactivate a product | - |
| DELETE | `/:id` | Delete a product | `?hard=true` (soft delete by default) |

---

## Categories Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/categories` | Get all categories | - |
| GET | `/categories/tree` | Get hierarchical category tree | - |
| GET | `/categories/root` | Get root categories (no parent) | - |
| GET | `/categories/with-products` | Get categories with product counts (excludes empty categories) | `?activeOnly=true/false` |
| GET | `/categories/with-counts` | Get all categories with product counts (includes categories with 0 products) | `?activeOnly=true/false` |
| GET | `/categories/:id` | Get category by ID | - |
| GET | `/categories/:id/children` | Get category with its children | - |
| GET | `/categories/:id/breadcrumb` | Get category breadcrumb path | - |
| GET | `/categories/slug/:slug` | Get category by slug | - |
| POST | `/categories` | Create a new category | Body: `createCategorySchema` |
| PUT | `/categories/:id` | Update a category | Body: `updateCategorySchema` |
| PUT | `/categories/:id/move` | Move category to different parent | Body: `{ newParentId }` |
| DELETE | `/categories/:id` | Delete a category | `?deleteChildren=true&moveChildrenTo=uuid` |

---

## Collections Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/collections` | Get all collections | - |
| GET | `/collections/active` | Get active collections | - |
| GET | `/collections/:id` | Get collection by ID | - |
| GET | `/collections/:id/products` | Get collection with products | - |
| GET | `/collections/slug/:slug` | Get collection by slug | - |
| POST | `/collections` | Create a new collection | Body: `createCollectionSchema` |
| POST | `/collections/:id/products` | Add product to collection | Body: `{ productId, position? }` |
| POST | `/collections/:id/products/bulk` | Add multiple products to collection | Body: `{ productIds[] }` |
| PUT | `/collections/:id` | Update a collection | Body: `updateCollectionSchema` |
| PUT | `/collections/:id/activate` | Activate a collection | - |
| PUT | `/collections/:id/deactivate` | Deactivate a collection | - |
| DELETE | `/collections/:id` | Delete a collection | - |
| DELETE | `/collections/:collectionId/products/:productId` | Remove product from collection | - |

---

## Attributes Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/attributes` | Get all attributes | `?withValues=true/false` |
| GET | `/attributes/:id` | Get attribute by ID | `?withValues=true/false` |
| GET | `/attributes/:id/values` | Get all values for an attribute | - |
| POST | `/attributes` | Create a new attribute | Body: `createAttributeSchema` |
| POST | `/attributes/with-values` | Create attribute with values | Body: `{ attribute, values[] }` |
| POST | `/attributes/:id/values` | Add value to attribute | Body: `{ value }` |
| POST | `/attributes/:id/values/bulk` | Add multiple values to attribute | Body: `{ values[] }` |
| PUT | `/attributes/:id` | Update an attribute | Body: `updateAttributeSchema` |
| PUT | `/attribute-values/:id` | Update an attribute value | Body: `updateAttributeValueSchema` |
| DELETE | `/attributes/:id` | Delete an attribute | - |
| DELETE | `/attribute-values/:id` | Delete an attribute value | - |

---

## Variant Attributes Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/variants/:id/attributes` | Get all attributes for a variant | - |
| POST | `/variants/:id/attributes` | Link attribute to variant | Body: `{ attributeValueId }` |
| PUT | `/variants/:id/attributes` | Update variant attributes (replace all) | Body: `{ attributeValueIds[] }` |
| DELETE | `/variants/:variantId/attributes/:valueId` | Remove attribute from variant | - |

---

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Common Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Key Features

- **Auto-slug generation**: Slug is optional in POST requests; will be auto-generated from name
- **Auto-SKU generation**: SKU can be auto-generated for variants
- **Variant generation**: Automatically create all combinations of attributes (Size x Color, etc.)
- **Zod validation**: All POST/PUT requests are validated using Zod schemas
- **Soft delete**: Products can be soft-deleted (deactivated) or hard-deleted
- **Hierarchical categories**: Support for nested categories with breadcrumb navigation
- **Collections**: Group products into collections for marketing/display purposes
- **Inventory tracking**: Track stock levels, low stock alerts, and availability

---

## Example Usage

### Create a Product with Auto-generated Slug
```bash
POST /products
{
  "name": "Cool T-Shirt",
  "categoryId": "uuid-here",
  "description": "A cool t-shirt",
  "isActive": true
}
# Slug will be auto-generated as "cool-t-shirt"
```

### Create Product with Auto-generated Variants
```bash
POST /products/generate-variants
{
  "product": {
    "name": "Cool T-Shirt",
    "categoryId": "uuid-here"
  },
  "attributes": [
    {
      "attributeId": "size-attr-id",
      "attributeName": "Size",
      "values": [
        { "id": "small-id", "value": "Small" },
        { "id": "large-id", "value": "Large" }
      ]
    },
    {
      "attributeId": "color-attr-id",
      "attributeName": "Color",
      "values": [
        { "id": "red-id", "value": "Red" },
        { "id": "blue-id", "value": "Blue" }
      ]
    }
  ],
  "defaultQuantity": 10
}
# Creates 4 variants: Small-Red, Small-Blue, Large-Red, Large-Blue
```

### Create Category with Hierarchy
```bash
POST /products/categories
{
  "name": "Men's Clothing",
  "parentId": null  # Root category
}

POST /products/categories
{
  "name": "T-Shirts",
  "parentId": "mens-clothing-id"  # Subcategory
}
```

### Add Products to Collection
```bash
POST /products/collections/summer-2025/products/bulk
{
  "productIds": ["product-1", "product-2", "product-3"]
}
```
