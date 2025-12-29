# Discount System - Complete Implementation Guide

**Status:** ✅ Backend Complete | ⏳ Frontend In Progress
**Last Updated:** December 29, 2024

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Testing & Seeded Data](#testing--seeded-data)
8. [Next Steps](#next-steps)

---

## Overview

The discount system provides flexible pricing rules with support for:

- ✅ **Store-wide discounts** - Apply to all products
- ✅ **Collection discounts** - Apply to entire collections
- ✅ **Product-specific discounts** - Apply to selected products
- ✅ **Discount codes** - Redeemable codes with usage limits
- ✅ **Priority system** - Control which discount applies when multiple are eligible
- ✅ **Date ranges** - Schedule discounts with start/end dates
- ✅ **Usage tracking** - Monitor code redemptions and limits
- ✅ **Order integration** - Automatic discount application during checkout

### Discount Types

1. **Percentage** - e.g., 10% off
2. **Fixed Amount** - e.g., $20 off

### Calculation Flow

```
Subtotal (from product prices)
  ↓
- Discount Amount (applied here)
  ↓
= Taxable Amount
  ↓
+ Tax (calculated on discounted amount)
  ↓
+ Shipping
  ↓
= Total
```

**Example:**
```
Subtotal:          $100.00
Discount (10%):    -$10.00
---
Taxable:           $90.00
Tax (8%):          $7.20
Shipping:          $5.00
---
Total:             $102.20
```

---

## Architecture

### Backend Structure

```
apps/backend/src/
├── shared/db/
│   ├── discount.ts          # Discount schema definitions
│   ├── order.ts             # Updated with discountAmount field
│   └── schema.ts            # Exports all schemas
│
└── modules/discounts/
    ├── repo/
    │   ├── discounts.repo.ts       # Database operations
    │   └── index.ts
    ├── services/
    │   ├── discounts.service.ts    # Business logic
    │   ├── discount-codes.service.ts
    │   └── index.ts
    ├── discounts.types.ts          # TypeScript types
    └── discounts.routes.ts         # API endpoints
```

### Frontend Structure

```
apps/frontend/src/
├── types/
│   └── discountTypes.ts     # TypeScript types
├── utils/
│   └── discounts.ts         # API client & utilities
├── components/
│   └── discounts-columns.tsx    # Data table columns
└── routes/discounts/
    └── index.tsx            # Discounts list page
```

---

## Backend Implementation

### 1. Database Schema

**File:** `apps/backend/src/shared/db/discount.ts`

#### Tables Created

**`discountsTable`**
```typescript
{
  id: UUID (PK)
  name: string
  description: string | null
  discountType: 'percentage' | 'fixed_amount'
  value: numeric(10, 2)
  scope: 'store_wide' | 'collection' | 'product' | 'code'
  isActive: boolean
  priority: integer (default: 10)
  startsAt: timestamp
  endsAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

**`discountCodesTable`**
```typescript
{
  id: UUID (PK)
  discountId: UUID (FK → discounts)
  code: string (unique)
  usageLimit: integer | null
  usageCount: integer (default: 0)
  minimumOrderValue: numeric(10, 2) | null
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**`discountProductsTable`** (Junction)
```typescript
{
  discountId: UUID (FK → discounts)
  productId: UUID (FK → products)
  PK: (discountId, productId)
}
```

**`discountCollectionsTable`** (Junction)
```typescript
{
  discountId: UUID (FK → discounts)
  collectionId: UUID (FK → collections)
  PK: (discountId, collectionId)
}
```

**`orderDiscountsTable`**
```typescript
{
  id: UUID (PK)
  orderId: UUID (FK → orders)
  discountId: UUID | null (FK → discounts)
  code: string | null
  discountType: 'percentage' | 'fixed_amount'
  value: numeric(10, 2)
  appliedAmount: numeric(10, 2)
  description: string
  createdAt: timestamp
}
```

#### Updated Tables

**`ordersTable`**
```typescript
// Added field:
discountAmount: numeric(10, 2) (default: 0)

// Updated total calculation:
total = subtotal - discountAmount + tax + shippingCost
```

### 2. Repository Layer

**File:** `apps/backend/src/modules/discounts/repo/discounts.repo.ts`

Provides CRUD operations for:
- `discountsRepo` - Core discount operations
- `discountCodesRepo` - Code management
- `discountProductsRepo` - Product associations
- `discountCollectionsRepo` - Collection associations
- `orderDiscountsRepo` - Order discount tracking

**Key Methods:**
```typescript
// Discounts
discountsRepo.createDiscount(data)
discountsRepo.getDiscountById(id)
discountsRepo.getAllDiscounts()
discountsRepo.getActiveDiscounts()
discountsRepo.updateDiscount(id, data)
discountsRepo.deleteDiscount(id)
discountsRepo.getDiscountWithDetails(id)

// Codes
discountCodesRepo.createDiscountCode(data)
discountCodesRepo.getDiscountCodeByCode(code)
discountCodesRepo.incrementUsageCount(id)

// Associations
discountProductsRepo.addProductToDiscount(data)
discountCollectionsRepo.addCollectionToDiscount(data)
```

### 3. Service Layer

**File:** `apps/backend/src/modules/discounts/services/discounts.service.ts`

**Business Logic:**
```typescript
// Discount Management
discountsService.create(input)
discountsService.update(id, input)
discountsService.delete(id)
discountsService.findAll(filters?)
discountsService.findActiveDiscounts()

// Product/Collection Association
discountsService.addProducts(discountId, productIds)
discountsService.addCollections(discountId, collectionIds)

// Discount Calculation
discountsService.getProductDiscounts(productId)
discountsService.calculateDiscountAmount(price, type, value)
discountsService.getBestDiscountForProduct(productId, price)
```

**File:** `apps/backend/src/modules/discounts/services/discount-codes.service.ts`

```typescript
// Code Management
discountCodesService.create(input)
discountCodesService.validateCode(code, orderTotal)
discountCodesService.calculateCodeDiscount(code, orderTotal)
discountCodesService.incrementUsage(id)
```

### 4. API Routes

**File:** `apps/backend/src/modules/discounts/discounts.routes.ts`

Registered at: `/discounts`

See [API Reference](#api-reference) section below for complete endpoint list.

### 5. Order Integration

**File:** `apps/backend/src/modules/orders/services/orders.service.ts`

**Modified `create()` method:**

```typescript
async create(data: {
  customerId: string
  shippingAddressId: string
  billingAddressId: string
  items: CreateOrderItemInput[]
  shippingMethodId: string
  discountCode?: string  // NEW
  notes?: string
})
```

**Flow:**
1. Calculate subtotal from items
2. **Validate and calculate discount if code provided**
3. Apply discount: `taxableAmount = subtotal - discountAmount`
4. Calculate tax on discounted amount
5. Calculate shipping
6. Final total: `subtotal - discountAmount + tax + shipping`
7. **Record applied discount in `orderDiscountsTable`**
8. **Increment code usage count**

**Added method:**
```typescript
ordersService.getOrderDiscounts(orderId)
```

---

## Frontend Implementation

### 1. Types

**File:** `apps/frontend/src/types/discountTypes.ts`

Complete TypeScript definitions for:
- `Discount` - Base discount type
- `DiscountCode` - Code type with usage tracking
- `DiscountWithDetails` - Full discount with relations
- `CreateDiscountInput` / `UpdateDiscountInput` - Form inputs
- All API response types

### 2. API Client & Utilities

**File:** `apps/frontend/src/utils/discounts.ts`

**TanStack Query Functions:**
```typescript
// Fetch operations
fetchDiscounts(filters?)
fetchActiveDiscounts()
fetchDiscount(id)
fetchDiscountWithDetails(id)

// Mutations
createDiscount(input)
updateDiscount(id, input)
deleteDiscount(id)

// Codes
fetchDiscountCodes(discountId)
createDiscountCode(discountId, input)
validateDiscountCode(code, orderTotal)

// Associations
addProductsToDiscount(discountId, productIds)
addCollectionsToDiscount(discountId, collectionIds)
```

**Query Options:**
```typescript
discountsQueryOptions(filters?)
discountQueryOptions(id)
discountCodesQueryOptions(discountId)
orderDiscountsQueryOptions(orderId)
```

**Utility Functions:**
```typescript
formatDiscountValue(type, value)        // → "10%" or "$20.00"
calculateDiscountAmount(subtotal, type, value)
generateDiscountCode(length)            // Random code generator
isDiscountActive(discount)              // Check date ranges
getDiscountStatusText(discount)         // "Active", "Scheduled", "Expired"
getDiscountScopeLabel(scope)            // Human-readable labels
```

### 3. Components

**File:** `apps/frontend/src/components/discounts-columns.tsx`

Data table column definitions with:
- Checkbox selection
- Sortable columns (Name, Type & Value, Priority, Dates)
- Status badges (Active, Inactive, Scheduled, Expired)
- Scope badges with icons (Store-wide, Collection, Product, Code)
- Actions dropdown (Edit, Manage Codes, Duplicate, Toggle Active, Delete)

### 4. Discounts List Page

**File:** `apps/frontend/src/routes/discounts/index.tsx`

**Features:**
- ✅ Data fetching with suspense
- ✅ Search functionality
- ✅ Empty state with CTA
- ✅ Create discount button
- ✅ Toggle active/inactive
- ✅ Delete with confirmation dialog
- ✅ Toast notifications

**Status:** ✅ Complete

### 5. Updated Order Types

**File:** `apps/frontend/src/types/orderTypes.ts`

```typescript
// Added to Order type:
discountAmount: string

// Added to CreateOrderInput:
discountCode?: string
```

---

## API Reference

### Base URL
```
http://localhost:3000/discounts
```

### Admin Endpoints

#### List Discounts
```http
GET /discounts
Query params:
  - scope?: 'store_wide' | 'collection' | 'product' | 'code'
  - isActive?: boolean
  - search?: string

Response: {
  success: boolean
  data: Discount[]
}
```

#### Get Active Discounts
```http
GET /discounts/active

Response: {
  success: boolean
  data: Discount[]
}
```

#### Get Single Discount
```http
GET /discounts/:id

Response: {
  success: boolean
  data: Discount
}
```

#### Get Discount Details
```http
GET /discounts/:id/details

Response: {
  success: boolean
  data: {
    ...Discount
    codes: DiscountCode[]
    discountProducts: DiscountProduct[]
    discountCollections: DiscountCollection[]
  }
}
```

#### Create Discount
```http
POST /discounts

Body: {
  name: string
  description?: string
  discountType: 'percentage' | 'fixed_amount'
  value: number
  scope: 'store_wide' | 'collection' | 'product' | 'code'
  isActive?: boolean
  priority?: number
  startsAt?: string (ISO date)
  endsAt?: string | null (ISO date)
}

Response: {
  success: boolean
  data: Discount
}
```

#### Update Discount
```http
PUT /discounts/:id

Body: {
  name?: string
  description?: string
  discountType?: 'percentage' | 'fixed_amount'
  value?: number
  isActive?: boolean
  priority?: number
  startsAt?: string
  endsAt?: string | null
}

Response: {
  success: boolean
  data: Discount
}
```

#### Delete Discount
```http
DELETE /discounts/:id

Response: {
  success: boolean
  message: string
}
```

### Product/Collection Management

#### Add Products to Discount
```http
POST /discounts/:id/products

Body: {
  productIds: string[]
}

Response: {
  success: boolean
  data: DiscountProduct[]
}
```

#### Remove Product from Discount
```http
DELETE /discounts/:id/products/:productId

Response: {
  success: boolean
  message: string
}
```

#### Add Collections to Discount
```http
POST /discounts/:id/collections

Body: {
  collectionIds: string[]
}

Response: {
  success: boolean
  data: DiscountCollection[]
}
```

#### Remove Collection from Discount
```http
DELETE /discounts/:id/collections/:collectionId

Response: {
  success: boolean
  message: string
}
```

### Discount Codes

#### Get Codes for Discount
```http
GET /discounts/:id/codes

Response: {
  success: boolean
  data: DiscountCode[]
}
```

#### Create Discount Code
```http
POST /discounts/:id/codes

Body: {
  code: string (uppercase alphanumeric with _ or -)
  usageLimit?: number | null
  minimumOrderValue?: number | null
  isActive?: boolean
}

Response: {
  success: boolean
  data: DiscountCode
}
```

#### Update Discount Code
```http
PUT /discounts/codes/:codeId

Body: {
  code?: string
  usageLimit?: number | null
  minimumOrderValue?: number | null
  isActive?: boolean
}

Response: {
  success: boolean
  data: DiscountCode
}
```

#### Delete Discount Code
```http
DELETE /discounts/codes/:codeId

Response: {
  success: boolean
  message: string
}
```

### Customer-Facing Endpoints

#### Validate Discount Code
```http
POST /discounts/validate-code

Body: {
  code: string
  orderTotal: number
}

Response (Success): {
  success: true
  data: {
    valid: true
    discountAmount: number
    finalTotal: number
    discount: {
      name: string
      description: string | null
      type: 'percentage' | 'fixed_amount'
      value: string
    }
  }
}

Response (Error): {
  success: false
  error: string
  data: {
    valid: false
  }
}
```

#### Get Product Discounts
```http
GET /discounts/products/:productId

Response: {
  success: boolean
  data: Discount[]
}
```

#### Get Collection Discounts
```http
GET /discounts/collections/:collectionId

Response: {
  success: boolean
  data: Discount[]
}
```

### Order Endpoints

#### Get Order Discounts
```http
GET /orders/:orderId/discounts

Response: {
  success: boolean
  data: OrderDiscount[]
}
```

#### Create Order with Discount
```http
POST /orders

Body: {
  customerId: string
  shippingAddressId: string
  billingAddressId: string
  items: CreateOrderItemInput[]
  shippingMethodId: string
  discountCode?: string  // NEW
  notes?: string
}

Response: {
  success: boolean
  data: Order  // includes discountAmount field
}
```

---

## Database Schema

### Migration Files

Run migrations:
```bash
cd apps/backend
bun run drizzle-kit generate
bun run drizzle-kit migrate
```

### Schema Exports

**File:** `apps/backend/src/shared/db/schema.ts`

```typescript
export * from './discount'  // Added
```

### Relations

```typescript
// Discount → Codes (one-to-many)
// Discount → Products (many-to-many)
// Discount → Collections (many-to-many)
// Discount → Order Discounts (one-to-many)
// Order → Order Discounts (one-to-many)
```

---

## Testing & Seeded Data

### Seed Script

**File:** `apps/backend/seed-discounts.sh`

**Run seeding:**
```bash
cd apps/backend
./seed-discounts.sh
```

### Seeded Discounts

The script creates:

1. **Store-Wide 15% Off**
   - Type: Percentage
   - Scope: Store-wide
   - Priority: 10

2. **Welcome Discount (10%)**
   - Type: Percentage
   - Scope: Code
   - Codes: `WELCOME10` (min: $50, limit: 100), `SAVE10` (min: $30, limit: 50)
   - Priority: 50

3. **Holiday Special ($20)**
   - Type: Fixed Amount
   - Scope: Code
   - Code: `HOLIDAY20` (min: $100, limit: 200)
   - Priority: 60

4. **Early Bird (5%)**
   - Type: Percentage
   - Scope: Code
   - Code: `EARLYBIRD` (no restrictions)
   - Priority: 40

5. **Featured Product Sale (25%)**
   - Type: Percentage
   - Scope: Product
   - Applies to first 2 active products
   - Priority: 100

6. **Collection Clearance (20%)**
   - Type: Percentage
   - Scope: Collection
   - Applies to first active collection
   - Priority: 75

### Testing Discount Codes

```bash
# Valid code
curl -X POST http://localhost:3000/discounts/validate-code \
  -H 'Content-Type: application/json' \
  -d '{"code": "WELCOME10", "orderTotal": 100}'

# Response:
# {
#   "success": true,
#   "data": {
#     "valid": true,
#     "discountAmount": 10,
#     "finalTotal": 90,
#     "discount": { ... }
#   }
# }

# Invalid - below minimum
curl -X POST http://localhost:3000/discounts/validate-code \
  -H 'Content-Type: application/json' \
  -d '{"code": "WELCOME10", "orderTotal": 30}'

# Response:
# {
#   "success": false,
#   "error": "Order total must be at least $50.00",
#   "data": { "valid": false }
# }
```

---

## Next Steps

### Immediate (Required for MVP)

#### 1. Create/Edit Discount Form
**Priority:** High
**File:** `apps/frontend/src/routes/discounts/create.tsx`

Implement 2-column layout form with:
- **Column 1:** Basic info (name, description, type, value, dates, priority)
- **Column 2:** Scope selection (store-wide/collection/product/code)
- Conditional fields based on scope
- Form validation
- Success/error handling

**Acceptance Criteria:**
- [ ] Can create new discount
- [ ] Form validates all required fields
- [ ] Date picker for start/end dates
- [ ] Priority slider
- [ ] Redirects to discount list on success

#### 2. Product Selector Modal
**Priority:** High
**File:** `apps/frontend/src/components/discounts/ProductSelector.tsx`

Modal for selecting products when `scope = "product"`:
- Search/filter products
- Checkbox selection
- Display selected products
- Add/remove products

#### 3. Collection Selector Modal
**Priority:** High
**File:** `apps/frontend/src/components/discounts/CollectionSelector.tsx`

Modal for selecting collections when `scope = "collection"`:
- List all collections
- Checkbox selection
- Display selected collections

#### 4. Discount Code Management
**Priority:** High
**File:** `apps/frontend/src/routes/discounts/$discountId/codes.tsx`

Page for managing codes when `scope = "code"`:
- List existing codes
- Add new code dialog
- Edit code (usage limit, minimum order)
- Delete code
- Display usage stats (used/total)
- Code generator button

#### 5. Edit Discount Page
**Priority:** High
**File:** `apps/frontend/src/routes/discounts/$discountId/edit.tsx`

Reuse create form with:
- Pre-populated fields
- Update instead of create
- Can't change scope after creation (show warning)

### Future Enhancements

#### 6. Checkout Integration
**Priority:** Medium
**Files:**
- `apps/frontend/src/routes/orders/create.tsx`
- `apps/frontend/src/components/checkout/DiscountCodeInput.tsx`

Add discount code input to checkout:
- Input field for code
- Validate button
- Show discount amount in order summary
- Apply to order on submit

#### 7. Discount Analytics
**Priority:** Low

Dashboard showing:
- Total discounts given
- Most used codes
- Revenue impact
- Code performance metrics

#### 8. Advanced Features
**Priority:** Low

- **Duplicate discount** - Clone existing discount
- **Bulk operations** - Activate/deactivate multiple
- **Discount scheduling** - Queue future discounts
- **Customer segments** - Limit to specific customer groups
- **Buy X Get Y** - Bundle discounts
- **Discount stacking rules** - Custom combination logic

### Testing Checklist

Before deployment:

**Backend:**
- [ ] All API endpoints return correct data
- [ ] Code validation works (min order, usage limits)
- [ ] Discount calculation is correct
- [ ] Priority system works as expected
- [ ] Order integration calculates discounts properly
- [ ] Tax calculated on discounted amount
- [ ] Usage count increments correctly

**Frontend:**
- [ ] List page displays all discounts
- [ ] Search/filter works
- [ ] Can create new discount
- [ ] Can edit existing discount
- [ ] Can delete discount (with confirmation)
- [ ] Can toggle active/inactive
- [ ] Can manage codes
- [ ] Can select products/collections
- [ ] Form validation prevents invalid data
- [ ] Toast notifications show appropriately

### Known Issues

None currently.

### Breaking Changes

None currently.

---

## Developer Notes

### Priority System

When multiple discounts could apply, priority determines which one is used:

```
Higher number = Higher priority

100+ = Product-specific (highest)
50-99 = Collection-specific
10-49 = Code-based
1-9 = Store-wide (lowest)
```

Only ONE automatic discount applies per product (highest priority wins).
Code-based discounts apply to the entire order total.

### Date Validation

Discounts are considered active when:
1. `isActive = true`
2. Current date >= `startsAt`
3. Current date <= `endsAt` (or `endsAt` is null)

Status labels:
- **Active** - Currently valid
- **Inactive** - Manually deactivated
- **Scheduled** - Not started yet
- **Expired** - Past end date

### Code Format

Discount codes must be:
- Uppercase letters A-Z
- Numbers 0-9
- Hyphens (-) or underscores (_)
- 3-50 characters

Valid: `SUMMER10`, `WELCOME_2024`, `SAVE-20`
Invalid: `summer10`, `save 20`, `discount!`

### Usage Limits

- `usageLimit = null` → Unlimited uses
- `usageLimit = 100` → Can be used 100 times
- `usageCount` increments on each successful order
- Code becomes invalid when `usageCount >= usageLimit`

### Minimum Order Value

- `minimumOrderValue = null` → No minimum
- `minimumOrderValue = 50` → Order must be >= $50
- Validation happens BEFORE tax/shipping

---

## Support & Troubleshooting

### Common Issues

**Q: Discount not applying to order**
A: Check:
1. Discount is active (`isActive = true`)
2. Current date is within range
3. Code hasn't exceeded usage limit
4. Order total meets minimum requirement
5. Code spelling is correct (case-sensitive)

**Q: Wrong discount amount calculated**
A: Verify:
1. Discount type (percentage vs fixed)
2. Value is correct in database
3. Tax is calculated AFTER discount
4. Check console logs for calculation details

**Q: Can't delete discount**
A: Discounts with existing orders can't be deleted. Deactivate instead.

---

## Changelog

### 2024-12-29 - Initial Implementation

**Backend:**
- ✅ Created discount schema (5 tables)
- ✅ Built discounts module (repo, services, routes)
- ✅ Integrated with orders module
- ✅ Added API endpoints (28 endpoints)
- ✅ Created seed script with test data

**Frontend:**
- ✅ Created types and API client
- ✅ Built discounts list page
- ✅ Implemented table with columns
- ✅ Added CRUD operations (list, delete, toggle)
- ⏳ Create/edit form (pending)
- ⏳ Product/collection selectors (pending)
- ⏳ Code management (pending)

---

## Contributors

- Backend: Implemented discount system with full CRUD
- Frontend: Discounts list page
- Documentation: This file

---

## Related Documentation

- [Orders API Documentation](./OrdersAPI_Documentation.md)
- [Products API Documentation](./ProductsAPI_Documentation.md)
- [Customers API Documentation](./CustomersAPI_Documentation.md)

---

**End of Documentation**
