# Product Creation Flow Documentation

## Overview
This document explains how the product creation system works, including the variant generation flow with preview and edit capabilities.

---

## Architecture Principle

**Core Concept:** Every product MUST have at least one variant. There are no "standalone products" - even simple products without attributes get a single default variant.

### Why This Approach?
- **Simplified data model:** Price and stock are always stored at the variant level
- **Consistency:** All pricing/inventory logic works the same way
- **Flexibility:** Easy to add variants later without data migration
- **Industry standard:** Follows patterns used by Shopify, WooCommerce, etc.

---

## Database Schema

```sql
-- Products table (no price field!)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Product Variants table (contains price!)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10, 2) NOT NULL,  -- Price is here!
  quantity_in_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Attributes table
CREATE TABLE attributes (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- e.g., "Size", "Color"
);

-- Attribute Values table
CREATE TABLE attribute_values (
  id UUID PRIMARY KEY,
  attribute_id UUID NOT NULL,
  value TEXT NOT NULL  -- e.g., "Small", "Red"
);

-- Junction table linking variants to attribute values
CREATE TABLE product_variant_attributes (
  product_variant_id UUID NOT NULL,
  attribute_value_id UUID NOT NULL,
  PRIMARY KEY (product_variant_id, attribute_value_id)
);
```

---

## Backend API Endpoints

### 1. Preview Variants (No DB Changes)
```http
POST /products/preview-variants
```

**Request Body:**
```json
{
  "productSlug": "t-shirt",
  "attributes": [
    {
      "attributeId": "attr-uuid-1",
      "attributeName": "Size",
      "values": [
        { "id": "val-uuid-1", "value": "Small" },
        { "id": "val-uuid-2", "value": "Large" }
      ]
    },
    {
      "attributeId": "attr-uuid-2",
      "attributeName": "Color",
      "values": [
        { "id": "val-uuid-3", "value": "Red" },
        { "id": "val-uuid-4", "value": "Blue" }
      ]
    }
  ],
  "defaultPrice": 19.99,
  "defaultQuantity": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "sku": "t-shirt-small-red",
        "price": 19.99,
        "quantityInStock": 10,
        "attributeValueIds": ["val-uuid-1", "val-uuid-3"],
        "attributeDetails": [
          { "attributeId": "attr-uuid-1", "attributeName": "Size", "value": "Small" },
          { "attributeId": "attr-uuid-2", "attributeName": "Color", "value": "Red" }
        ]
      },
      {
        "sku": "t-shirt-small-blue",
        "price": 19.99,
        "quantityInStock": 10,
        "attributeValueIds": ["val-uuid-1", "val-uuid-4"],
        "attributeDetails": [
          { "attributeId": "attr-uuid-1", "attributeName": "Size", "value": "Small" },
          { "attributeId": "attr-uuid-2", "attributeName": "Color", "value": "Blue" }
        ]
      },
      // ... 2 more variants (Large-Red, Large-Blue)
    ]
  }
}
```

**What it does:**
- Generates all possible combinations (Cartesian product) of attribute values
- Creates auto-generated SKUs for each combination
- Applies default price and quantity to all variants
- **Does NOT save anything to the database** - this is just a preview

---

### 2. Create Product with Variants (Saves to DB)
```http
POST /products/with-variants
```

**Request Body:**
```json
{
  "product": {
    "name": "T-Shirt",
    "description": "Amazing branded shirts",
    "categoryId": "cat-uuid",
    "isActive": true
  },
  "variants": [
    {
      "sku": "t-shirt-small-red",
      "price": 19.99,
      "quantityInStock": 10,
      "attributeValueIds": ["val-uuid-1", "val-uuid-3"]
    },
    {
      "sku": "t-shirt-small-blue",
      "price": 24.99,  // User edited this price!
      "quantityInStock": 5,   // User edited this quantity!
      "attributeValueIds": ["val-uuid-1", "val-uuid-4"]
    }
    // ... more variants
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": { /* product object */ },
    "variantResult": {
      "success": true,
      "createdCount": 4,
      "failedCount": 0,
      "variants": [ /* created variant objects */ ]
    }
  }
}
```

**What it does:**
1. Creates the product in the `products` table
2. Creates all variants in the `product_variants` table
3. Links each variant to its attribute values in the `product_variant_attributes` junction table
4. Returns the created product and variant creation summary

---

## Frontend User Flow

### Step-by-Step Process

1. **Fill Basic Product Info**
   - Name (required, min 3 chars)
   - Description (required, min 10 chars)
   - Category (required, select from dropdown)
   - Active status (checkbox, default true)

2. **Enable Variant Creation** (Optional)
   - Check "Create Product with Variants" checkbox
   - This reveals the variants section

3. **Set Default Price** (Required if variants enabled)
   - Enter base price (e.g., 19.99)
   - This will be applied to all variants by default

4. **Set Default Quantity** (Optional)
   - Enter base stock quantity (e.g., 10)
   - This will be applied to all variants by default

5. **Add Attributes**

   **Option A: Use Existing Attribute**
   - Browse list of existing attributes with their values
   - Click "Add" button to include in variant generation

   **Option B: Create New Attribute**
   - Click "New Attribute" button
   - Enter attribute name (e.g., "Size")
   - Add multiple values (e.g., "Small", "Medium", "Large")
   - Click "Create Attribute"
   - Attribute is automatically added to selected attributes

6. **Generate Preview**
   - System shows badge with variant count (e.g., "6 variants will be generated")
   - Click "Generate Variant Preview" button
   - System calls `POST /products/preview-variants` API
   - Shows loading state while generating

7. **Review & Edit Variants** (IMPORTANT!)
   - A table appears showing all generated variants
   - Columns:
     - **SKU:** Auto-generated, read-only
     - **Attributes:** Badge list showing attribute values
     - **Price:** Editable input (defaults to defaultPrice)
     - **Stock:** Editable input (defaults to defaultQuantity)
   - User can edit individual prices and quantities

8. **Submit**
   - Click "Create Product with X Variants" button
   - System validates and submits to `POST /products/with-variants`
   - Shows success toast
   - Resets form
   - Navigates to `/inventory/products` page

---

## Frontend Component Structure

### File: `apps/frontend/src/routes/inventory/products/create.tsx`

#### State Management
```typescript
// Form data (basic product info)
const form = useForm({ name, description, categoryId, isActive })

// Variant-related state
const [createWithVariants, setCreateWithVariants] = useState(false)
const [defaultPrice, setDefaultPrice] = useState(0)
const [defaultQuantity, setDefaultQuantity] = useState(0)

// Selected attributes (before preview)
const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>([])

// Preview state (after generation)
const [previewedVariants, setPreviewedVariants] = useState<PreviewVariant[]>([])
const [isLoadingPreview, setIsLoadingPreview] = useState(false)

// New attribute creation state
const [isAddingNewAttribute, setIsAddingNewAttribute] = useState(false)
const [newAttributeName, setNewAttributeName] = useState('')
const [newAttributeValues, setNewAttributeValues] = useState<string[]>([''])
```

#### Key Functions

**`handleGeneratePreview()`**
- Validates product name, attributes, and default price
- Generates product slug from name
- Calls `previewVariants()` API
- Stores result in `previewedVariants` state
- Shows success toast

**`handleVariantPriceChange(index, newPrice)`**
- Updates the price of a specific variant in the preview
- Modifies `previewedVariants` state

**`handleVariantQuantityChange(index, newQuantity)`**
- Updates the stock quantity of a specific variant
- Modifies `previewedVariants` state

**`form.onSubmit()`**
- Validates form data
- If variants enabled: Sends `previewedVariants` to API
- If no variants: Creates basic product (future: will need default variant)
- Resets all state
- Navigates to products list

---

## Backend Service Architecture

### File: `apps/backend/src/modules/products/services/products.service.ts`

#### Key Service Methods

**`previewVariantCombinations(productSlug, attributes, defaultPrice, defaultQuantity)`**
- Calls `generateVariantCombinations()` utility
- Returns variant combinations without saving
- Used by preview endpoint

**`createProductWithVariants(data)`**
- Validates category exists
- Generates slug if not provided
- Creates product in database
- Calls `bulkCreateVariants()` to create all variants
- Links variants to attribute values
- Returns product and variant creation result

**`bulkCreateVariants(productId, variants)`**
- Loops through variant array
- Creates each variant in `product_variants` table
- Links variant to attribute values in junction table
- Returns creation summary (success count, failures)

---

## Variant Generator Utility

### File: `apps/backend/src/modules/products/utils/variantGenerator.ts`

**`generateVariantCombinations(productSlug, attributes, defaultPrice, defaultQuantity)`**

**Algorithm:**
1. Extract value arrays from each attribute
2. Compute Cartesian product of all value arrays
3. For each combination:
   - Generate SKU from slug + attribute values (e.g., "t-shirt-small-red")
   - Set price and quantity
   - Store attribute value IDs
   - Store attribute details for display
4. Return array of variant objects

**Example:**
```
Input:
  slug: "t-shirt"
  attributes: [Size: [Small, Large], Color: [Red, Blue]]
  defaultPrice: 19.99
  defaultQuantity: 10

Output: [
  { sku: "t-shirt-small-red", price: 19.99, quantity: 10, ... },
  { sku: "t-shirt-small-blue", price: 19.99, quantity: 10, ... },
  { sku: "t-shirt-large-red", price: 19.99, quantity: 10, ... },
  { sku: "t-shirt-large-blue", price: 19.99, quantity: 10, ... }
]
```

---

## Common Patterns & Conventions

### SKU Generation
- Format: `{product-slug}-{value1}-{value2}-...`
- All lowercase, hyphen-separated
- Example: `t-shirt-small-red`

### Slug Generation
```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/[\s_-]+/g, '-')   // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')    // Trim hyphens from ends
}
```

### Price Handling
- Stored as `NUMERIC(10, 2)` in PostgreSQL (supports up to $99,999,999.99)
- Frontend: `parseFloat()` for parsing, `step="0.01"` for inputs
- Backend: Convert to string when inserting (`variant.price.toString()`)

---

## Troubleshooting Guide

### Issue: "Create Product" button disabled
**Check:**
- Is product name at least 3 characters?
- Is description at least 10 characters?
- Is category selected?
- If variants enabled: Have you generated a preview?

### Issue: Variants not showing in preview
**Check:**
- Did you add at least one attribute?
- Do all attributes have at least one value?
- Did you enter a default price?
- Check browser console for API errors

### Issue: Form doesn't reset after submit
**Solution:**
- Form now explicitly resets all state in `onSubmit`
- Check that all state variables are being cleared
- Look for `form.reset()` and state setters in success handler

### Issue: Navigation not working after submit
**Solution:**
- Added `setTimeout(() => navigate(...), 100)` for timing
- Ensures state updates complete before navigation

---

## Future Enhancements

### Potential Improvements
1. **Bulk Price Editing**
   - "Apply to All" button to set same price for all variants
   - Percentage-based pricing (e.g., Large = +10%)

2. **Image Upload**
   - Product images
   - Variant-specific images

3. **Import/Export**
   - CSV import for bulk variant creation
   - Excel template download

4. **Variant Filtering**
   - Disable specific variant combinations
   - Example: Don't create "Small" size for "Winter Coat"

5. **Price Rules**
   - Conditional pricing based on attributes
   - Example: "+$5 for Large, +$2 for Blue"

---

## API Reference Quick Links

**Preview Variants:**
- Endpoint: `POST /products/preview-variants`
- Service: `productsService.previewVariantCombinations()`
- Frontend: `previewVariants({ data })`

**Create Product:**
- Endpoint: `POST /products/with-variants`
- Service: `productsService.createProductWithVariants()`
- Frontend: `createProductWithVariants({ data })`

**Fetch Attributes:**
- Endpoint: `GET /products/attributes?withValues=true`
- Service: `attributesService.findAll()`
- Frontend: `fetchAttributes()`

**Create Attribute:**
- Endpoint: `POST /products/attributes`
- Service: `attributesService.create()`
- Frontend: `createAttribute({ data })`

---

## Testing Checklist

### Manual Testing Steps

1. **Basic Product Creation (No Variants)**
   - [ ] Fill all required fields
   - [ ] Submit without enabling variants
   - [ ] Verify product created with default variant
   - [ ] Check database for product and variant records

2. **Product with Variants - Simple Case**
   - [ ] Enable "Create Product with Variants"
   - [ ] Enter default price and quantity
   - [ ] Add one attribute with 2 values
   - [ ] Generate preview
   - [ ] Verify 2 variants shown
   - [ ] Submit and verify creation

3. **Product with Variants - Multiple Attributes**
   - [ ] Add 2 attributes (e.g., Size + Color)
   - [ ] Size: 2 values, Color: 3 values
   - [ ] Generate preview
   - [ ] Verify 6 variants shown (2 × 3)
   - [ ] Edit prices for some variants
   - [ ] Submit and verify custom prices saved

4. **Create New Attribute**
   - [ ] Click "New Attribute"
   - [ ] Enter name and multiple values
   - [ ] Create attribute
   - [ ] Verify it appears in "Selected Attributes"
   - [ ] Generate preview and submit

5. **Error Handling**
   - [ ] Try submitting without required fields
   - [ ] Try generating preview without attributes
   - [ ] Try generating preview without default price
   - [ ] Verify appropriate error messages

6. **Form Reset**
   - [ ] Fill form partially
   - [ ] Click "Reset Form"
   - [ ] Verify all fields cleared

7. **Navigation**
   - [ ] Submit product
   - [ ] Verify navigation to `/inventory/products`
   - [ ] Verify form is reset if returning to create page

---

## Code Locations Reference

**Frontend:**
- Main component: `apps/frontend/src/routes/inventory/products/create.tsx`
- API functions: `apps/frontend/src/utils/products.ts`
- UI components: `apps/frontend/src/components/ui/*`

**Backend:**
- Routes: `apps/backend/src/modules/products/products.routes.ts`
- Services: `apps/backend/src/modules/products/services/products.service.ts`
- Types: `apps/backend/src/modules/products/products.types.ts`
- Variant generator: `apps/backend/src/modules/products/utils/variantGenerator.ts`
- Database schema: `apps/backend/src/shared/db/catalogue.ts`
- Migration: `apps/backend/drizzle/migrations/0002_silent_iron_man.sql`

---

*Last Updated: 2025-12-22*
*Version: 1.0*
