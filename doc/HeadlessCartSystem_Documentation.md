# Headless Cart System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Service Layer](#service-layer)
7. [Repository Layer](#repository-layer)
8. [Integration with Existing Services](#integration-with-existing-services)
9. [Admin Dashboard UI](#admin-dashboard-ui)
10. [Storefront Integration Guide](#storefront-integration-guide)
11. [Implementation Checklist](#implementation-checklist)

---

## Overview

This is a **headless e-commerce cart system** designed for maximum flexibility. The backend provides a stateless API for cart management without imposing any requirements on how storefronts implement authentication, session management, or user experience.

### Key Principles

- **Headless First**: No opinions on frontend framework, auth system, or session storage
- **Stateless API**: Backend doesn't manage sessions; accepts `sessionId` as parameter
- **Flexible Customer Linking**: Optional `customerId` for storefronts that want customer records
- **Admin Analytics Only**: Admin dashboard views/analyzes carts but doesn't create them
- **Reuse Existing Services**: Integrates with existing discount, tax, and shipping logic

### Use Cases

**For Storefronts (API Consumers):**
- Guest checkout (sessionId only)
- Authenticated checkout (sessionId + customerId)
- Cart persistence across sessions
- Cart merging on login (optional)
- Real-time cart totals with tax/shipping preview
- Discount code application
- Seamless conversion to orders

**For Admin Dashboard:**
- View active carts
- Monitor abandoned carts
- Cart analytics (count, value, abandonment rate)
- Customer behavior insights

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard (TanStack Start + Clerk)               │
│  - Manage products, orders, discounts                   │
│  - View cart analytics                                  │
│  - Monitor abandoned carts                              │
│  - Clerk auth for ADMIN users only                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Headless Cart API (Hono + Drizzle + PostgreSQL)        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes Layer (cart.routes.ts)                  │   │
│  │  - GET/POST/PUT/DELETE endpoints                │   │
│  │  - Zod validation                               │   │
│  │  - JSON responses                               │   │
│  └─────────────────────────────────────────────────┘   │
│                      ↓                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Service Layer (cart.service.ts)                │   │
│  │  - Business logic                               │   │
│  │  - Orchestration                                │   │
│  │  - Integrates with discount/tax/shipping        │   │
│  └─────────────────────────────────────────────────┘   │
│                      ↓                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Repository Layer (cart.repo.ts)                │   │
│  │  - Database queries                             │   │
│  │  - Drizzle ORM                                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │
┌─────────────────────────────────────────────────────────┐
│  Storefront (Customer's Choice)                         │
│  - Next.js, Remix, SvelteKit, Vue, etc.                 │
│  - Any auth system (Clerk, Auth0, Supabase, custom)     │
│  - Any session storage (localStorage, cookies, etc.)    │
│  - Generates and manages sessionId                      │
│  - Calls cart API endpoints                             │
└─────────────────────────────────────────────────────────┘
```

### Three-Tier Architecture

**1. Routes Layer** (`cart.routes.ts`)
- HTTP request/response handling
- Input validation with Zod
- Delegates to service layer
- Returns standardized JSON responses

**2. Service Layer** (`cart.service.ts`)
- Business logic and orchestration
- Integrates with existing services (discounts, tax, shipping)
- Transaction management
- Cart calculations and conversions

**3. Repository Layer** (`cart.repo.ts`)
- Direct database access via Drizzle ORM
- CRUD operations
- Query building
- Relational data loading

---

## Technology Stack

### Backend

- **Runtime:** Bun
- **Framework:** Hono (lightweight, fast web framework)
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **Validation:** Zod schemas with @hono/zod-validator
- **API Pattern:** RESTful JSON API

### Dependencies

```json
{
  "hono": "^4.x",
  "@hono/zod-validator": "^0.x",
  "drizzle-orm": "^0.x",
  "@neondatabase/serverless": "^0.x",
  "zod": "^3.x"
}
```

### Frontend (Admin Dashboard)

- **Framework:** TanStack Start
- **Router:** TanStack Router
- **Data Fetching:** TanStack Query
- **HTTP Client:** Redaxios
- **UI:** Radix UI + shadcn/ui + Tailwind CSS
- **Auth:** Clerk (admin only)

---

## Database Schema

### File Location
`apps/backend/src/shared/db/cart.ts`

### Tables

#### Carts Table

```typescript
import { pgTable, uuid, integer, timestamp, numeric, text, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { customersTable } from './customer'
import { productVariantsTable } from './catalogue'
import { discountCodesTable } from './discount'

// Cart status enum
export const cartStatusEnum = pgEnum('cart_status', [
  'active',      // Cart in use
  'abandoned',   // Inactive for X days
  'converted',   // Successfully checked out
  'merged'       // Guest cart merged into user cart
])

// Carts table
export const cartsTable = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Session identifier (required, generated by storefront)
  sessionId: text('session_id').notNull().unique(),

  // Optional customer linking (set by storefront if they want customer records)
  customerId: uuid('customer_id').references(() => customersTable.id, {
    onDelete: 'set null'
  }),

  // Cart status
  status: cartStatusEnum('status').notNull().default('active'),

  // Calculated totals (updated via calculateTotals service method)
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  discountTotal: numeric('discount_total', { precision: 10, scale: 2 }).notNull().default('0'),
  taxTotal: numeric('tax_total', { precision: 10, scale: 2 }).notNull().default('0'),
  shippingTotal: numeric('shipping_total', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),

  // Applied discount code
  discountCodeId: uuid('discount_code_id').references(() => discountCodesTable.id, {
    onDelete: 'set null'
  }),

  // Tracking timestamps
  expiresAt: timestamp('expires_at').notNull()
    .default(sql`NOW() + INTERVAL '30 days'`),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
    .$onUpdate(() => new Date()),
})

// Indexes for performance
// CREATE INDEX idx_carts_session_id ON carts(session_id)
// CREATE INDEX idx_carts_customer_id ON carts(customer_id)
// CREATE INDEX idx_carts_status ON carts(status)
// CREATE INDEX idx_carts_expires_at ON carts(expires_at)
```

#### Cart Items Table

```typescript
export const cartItemsTable = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Cart reference (cascade delete when cart is deleted)
  cartId: uuid('cart_id').notNull()
    .references(() => cartsTable.id, { onDelete: 'cascade' }),

  // Product variant reference
  productVariantId: uuid('product_variant_id').notNull()
    .references(() => productVariantsTable.id, { onDelete: 'cascade' }),

  // Quantity
  quantity: integer('quantity').notNull().default(1),

  // Price snapshot (captured at time of adding to cart)
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
    .$onUpdate(() => new Date()),
})

// Indexes
// CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id)
// CREATE INDEX idx_cart_items_variant_id ON cart_items(product_variant_id)
// CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, product_variant_id)
```

### Relations

```typescript
// Cart relations
export const cartsRelations = relations(cartsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [cartsTable.customerId],
    references: [customersTable.id],
  }),
  discountCode: one(discountCodesTable, {
    fields: [cartsTable.discountCodeId],
    references: [discountCodesTable.id],
  }),
  items: many(cartItemsTable),
}))

// Cart item relations
export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  cart: one(cartsTable, {
    fields: [cartItemsTable.cartId],
    references: [cartsTable.id],
  }),
  productVariant: one(productVariantsTable, {
    fields: [cartItemsTable.productVariantId],
    references: [productVariantsTable.id],
  }),
}))
```

### Entity Relationships

```
Cart (1) ─── (many) CartItem
  │
  ├─ (optional) → Customer
  ├─ (optional) → DiscountCode
  │
CartItem ─── (1) ProductVariant
```

### Design Decisions

**sessionId as Primary Identifier:**
- Always required (storefront generates it)
- Must be unique (only one active cart per sessionId)
- Storefront controls format (UUID recommended but not enforced)

**Optional customerId:**
- Set by storefront if they want customer tracking
- Can be added/updated after cart creation
- Useful for abandoned cart emails to registered users

**Price Snapshot:**
- `unitPrice` captured when item added to cart
- Protects against price changes mid-checkout
- Matches real-world e-commerce behavior

**Status Field:**
- `active`: Currently in use
- `abandoned`: Inactive for 24+ hours (set by scheduled job)
- `converted`: Successfully checked out (order created)
- `merged`: Guest cart merged into authenticated user cart

**Cascade Deletes:**
- Delete cart → automatically deletes cart items
- Delete product variant → automatically removes from carts
- Set null on customer/discount code deletion

---

## API Endpoints

All cart endpoints are **public** (no authentication required). The storefront is responsible for managing access control.

### Base Path
`/cart`

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { /* payload */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### 1. Get or Create Cart

**Endpoint:** `GET /cart`

**Query Parameters:**
- `sessionId` (required): Session identifier from storefront
- `customerId` (optional): Customer UUID if linking to customer record

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "sessionId": "session-uuid",
    "customerId": "customer-uuid",
    "status": "active",
    "subtotal": "299.98",
    "discountTotal": "0.00",
    "taxTotal": "0.00",
    "shippingTotal": "0.00",
    "total": "299.98",
    "discountCodeId": null,
    "items": [
      {
        "id": "item-uuid",
        "productVariantId": "variant-uuid",
        "quantity": 2,
        "unitPrice": "149.99",
        "productVariant": {
          "id": "variant-uuid",
          "sku": "SHIRT-BLU-M",
          "product": {
            "name": "Blue Shirt",
            "slug": "blue-shirt"
          }
        }
      }
    ],
    "expiresAt": "2024-02-08T10:00:00.000Z",
    "lastActivityAt": "2024-01-09T10:00:00.000Z",
    "createdAt": "2024-01-09T10:00:00.000Z",
    "updatedAt": "2024-01-09T10:00:00.000Z"
  }
}
```

**Behavior:**
- If cart exists for sessionId: Returns existing cart
- If cart doesn't exist: Creates new cart and returns it
- If customerId provided: Links cart to customer (or updates existing)

---

### 2. Add Item to Cart

**Endpoint:** `POST /cart/items`

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "customerId": "customer-uuid",  // optional
  "variantId": "variant-uuid",
  "quantity": 2
}
```

**Validation:**
- `sessionId`: required, string
- `variantId`: required, valid UUID, must exist in database
- `quantity`: required, positive integer
- `customerId`: optional, valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* full cart object with updated items */ },
    "item": {
      "id": "item-uuid",
      "productVariantId": "variant-uuid",
      "quantity": 2,
      "unitPrice": "149.99"
    }
  }
}
```

**Behavior:**
- Validates product variant exists and has sufficient stock
- If item already in cart: Increments quantity
- If item not in cart: Adds new item
- Captures current price from product variant
- Automatically recalculates cart totals
- Updates lastActivityAt timestamp

**Error Cases:**
- `400`: Variant not found
- `400`: Insufficient stock
- `400`: Invalid quantity

---

### 3. Update Item Quantity

**Endpoint:** `PUT /cart/items/:itemId`

**Path Parameters:**
- `itemId`: Cart item UUID

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "quantity": 5
}
```

**Validation:**
- `quantity`: required, positive integer (or 0 to remove)

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* full cart object */ }
  }
}
```

**Behavior:**
- If quantity > 0: Updates item quantity (validates stock)
- If quantity = 0: Removes item from cart
- Recalculates totals
- Updates lastActivityAt

**Error Cases:**
- `404`: Item not found or doesn't belong to this sessionId
- `400`: Insufficient stock for new quantity

---

### 4. Remove Item from Cart

**Endpoint:** `DELETE /cart/items/:itemId`

**Query Parameters:**
- `sessionId`: required

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* full cart object */ }
  }
}
```

**Behavior:**
- Removes item from cart
- Recalculates totals
- If cart becomes empty: Cart remains (status stays 'active')

---

### 5. Apply Discount Code

**Endpoint:** `POST /cart/discount`

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "code": "SUMMER20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "discountCodeId": "discount-uuid",
      "discountTotal": "59.99",
      "total": "240.00",
      /* ... rest of cart */
    },
    "discount": {
      "code": "SUMMER20",
      "type": "percentage",
      "value": "20"
    }
  }
}
```

**Behavior:**
- Validates discount code exists and is active
- Validates code hasn't exceeded usage limits
- Validates minimum order requirements
- Calculates discount using existing `discountCodesService`
- Applies discount to cart
- Recalculates totals

**Error Cases:**
- `404`: Discount code not found
- `400`: Discount code expired
- `400`: Usage limit exceeded
- `400`: Minimum order value not met

---

### 6. Remove Discount Code

**Endpoint:** `DELETE /cart/discount`

**Query Parameters:**
- `sessionId`: required

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* cart with discount removed */ }
  }
}
```

---

### 7. Calculate Cart Totals

**Endpoint:** `POST /cart/calculate`

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "shippingAddressId": "address-uuid",  // optional
  "shippingMethodId": "method-uuid"     // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": "299.98",
    "discountTotal": "59.99",
    "taxTotal": "19.20",
    "shippingTotal": "9.99",
    "total": "269.18",
    "breakdown": {
      "items": [
        { "name": "Blue Shirt", "quantity": 2, "lineTotal": "299.98" }
      ],
      "discount": {
        "code": "SUMMER20",
        "amount": "59.99"
      },
      "tax": {
        "jurisdiction": "California",
        "rate": "0.08",
        "amount": "19.20"
      },
      "shipping": {
        "method": "Standard",
        "cost": "9.99"
      }
    }
  }
}
```

**Behavior:**
- Calculates subtotal from items
- Applies discount if code exists
- Calculates tax if shipping address provided (uses existing tax service)
- Adds shipping cost if method provided
- Returns detailed breakdown
- **Does NOT save to database** (preview only)
- For final totals at checkout, call this endpoint before creating order

---

### 8. Clear Cart

**Endpoint:** `DELETE /cart/clear`

**Query Parameters:**
- `sessionId`: required

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "items": [],
      "subtotal": "0.00",
      "total": "0.00"
      /* ... */
    }
  }
}
```

**Behavior:**
- Removes all items from cart
- Resets all totals to 0
- Removes discount code
- Cart status remains 'active'

---

### 9. Checkout (Convert to Order)

**Endpoint:** `POST /cart/checkout`

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "customerId": "customer-uuid",           // optional but recommended
  "customerEmail": "customer@example.com", // required if no customerId
  "shippingAddressId": "address-uuid",
  "billingAddressId": "address-uuid",
  "shippingMethodId": "method-uuid",
  "notes": "Leave at front door",          // optional
  "campaignId": "campaign-uuid",           // optional (for analytics)
  "visitId": "visit-uuid"                  // optional (for analytics)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order-uuid",
      "orderNumber": "ORD-1001",
      "status": "pending",
      "total": "269.18",
      /* ... full order object */
    }
  }
}
```

**Behavior:**
1. Validates cart exists and has items
2. Validates all required addresses and shipping method
3. Validates stock for all items
4. Creates customer record if email provided and no customerId
5. Calculates final totals (tax, shipping, discount)
6. Creates order using existing `ordersService.create()`
7. Deducts inventory stock
8. Records discount usage
9. Marks cart as 'converted'
10. Returns created order

**Error Cases:**
- `404`: Cart not found or empty
- `400`: Missing required fields
- `400`: Insufficient stock
- `400`: Invalid address or shipping method

---

### 10. Merge Carts (Optional)

**Endpoint:** `POST /cart/merge`

**Request Body:**
```json
{
  "fromSessionId": "guest-session-uuid",
  "toSessionId": "user-session-uuid",
  "customerId": "customer-uuid"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* merged cart */ }
  }
}
```

**Behavior:**
- Finds cart for `fromSessionId` (guest cart)
- Gets or creates cart for `toSessionId` (user cart)
- Transfers all items from guest cart to user cart
- If duplicate items: Merges quantities
- Marks guest cart as 'merged'
- Returns user cart

**Use Case:**
Storefront implements login, wants to preserve guest cart items.

---

### 11. Get Abandoned Carts (Admin Only)

**Endpoint:** `GET /admin/carts/abandoned`

**Query Parameters:**
- `hoursAgo` (optional, default: 24): Carts inactive for X hours
- `minValue` (optional): Minimum cart total value

**Response:**
```json
{
  "success": true,
  "data": {
    "carts": [
      {
        "id": "cart-uuid",
        "sessionId": "session-uuid",
        "customer": {
          "email": "customer@example.com",
          "name": "John Doe"
        },
        "total": "299.98",
        "itemCount": 3,
        "lastActivityAt": "2024-01-08T10:00:00.000Z",
        "items": [ /* cart items */ ]
      }
    ],
    "total": 15
  }
}
```

---

## Service Layer

### File Location
`apps/backend/src/modules/cart/services/cart.service.ts`

### Core Methods

#### getOrCreateCart
```typescript
async getOrCreateCart(
  sessionId: string,
  customerId?: string
): Promise<Cart>
```

**Logic:**
1. Query cart by sessionId
2. If found: Update customerId if provided, return cart
3. If not found: Create new cart with sessionId and optional customerId
4. Return cart with items loaded

---

#### addItem
```typescript
async addItem(
  sessionId: string,
  variantId: string,
  quantity: number,
  customerId?: string
): Promise<{ cart: Cart; item: CartItem }>
```

**Logic:**
1. Get or create cart
2. Validate product variant exists
3. Validate sufficient stock (`quantityInStock >= quantity`)
4. Check if variant already in cart
   - If yes: Increment quantity
   - If no: Create new cart item with current price
5. Recalculate cart totals
6. Return cart and item

**Integrations:**
- `productVariantsRepo.findById()` - Fetch variant and check stock
- `calculateTotals()` - Recalculate cart totals

---

#### updateItemQuantity
```typescript
async updateItemQuantity(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<Cart>
```

**Logic:**
1. Get cart by sessionId
2. Validate item belongs to cart
3. Validate stock if quantity > current quantity
4. If quantity = 0: Remove item
5. If quantity > 0: Update item quantity
6. Recalculate totals
7. Return updated cart

---

#### removeItem
```typescript
async removeItem(
  sessionId: string,
  itemId: string
): Promise<Cart>
```

**Logic:**
1. Get cart by sessionId
2. Validate item belongs to cart
3. Delete item
4. Recalculate totals
5. Return cart

---

#### clearCart
```typescript
async clearCart(sessionId: string): Promise<Cart>
```

**Logic:**
1. Get cart by sessionId
2. Delete all cart items
3. Reset totals to 0
4. Remove discount code
5. Return cart

---

#### applyDiscountCode
```typescript
async applyDiscountCode(
  sessionId: string,
  code: string
): Promise<{ cart: Cart; discount: DiscountCode }>
```

**Logic:**
1. Get cart by sessionId with items
2. Find discount code by code string
3. Validate discount code (active, not expired, usage limits)
4. Calculate discount using `discountCodesService.calculateCodeDiscount()`
5. Update cart with discountCodeId and discountTotal
6. Recalculate totals
7. Return cart and discount details

**Integrations:**
- `discountCodesRepo.findByCode()` - Fetch discount code
- `discountCodesService.calculateCodeDiscount()` - Calculate discount amount

---

#### removeDiscountCode
```typescript
async removeDiscountCode(sessionId: string): Promise<Cart>
```

**Logic:**
1. Get cart by sessionId
2. Set discountCodeId to null
3. Set discountTotal to 0
4. Recalculate totals
5. Return cart

---

#### calculateTotals
```typescript
async calculateTotals(
  cartId: string,
  shippingAddressId?: string,
  shippingMethodId?: string
): Promise<CartTotals>
```

**Logic:**
1. Load cart with items
2. Calculate subtotal: `sum(item.quantity * item.unitPrice)`
3. Calculate discount if discountCodeId exists:
   - Call `discountCodesService.calculateCodeDiscount()`
4. Calculate tax if shippingAddressId provided:
   - Fetch address from `addressesRepo`
   - Call `calculateOrderTax(subtotal - discount, address)`
5. Calculate shipping if shippingMethodId provided:
   - Fetch shipping method from `shippingMethodsRepo`
   - Get shipping cost
6. Calculate total: `subtotal - discount + tax + shipping`
7. Update cart totals in database
8. Return breakdown object

**Integrations:**
- `discountCodesService.calculateCodeDiscount()`
- `calculateOrderTax()` (from orders module)
- `shippingMethodsRepo.findById()`

---

#### checkout
```typescript
async checkout(
  sessionId: string,
  orderData: CheckoutInput
): Promise<Order>
```

**Logic:**
1. Get cart by sessionId with items
2. Validate cart exists and has items
3. Validate required order data (addresses, shipping method)
4. Calculate final totals (tax, shipping, discount)
5. Create customer if email provided and no customerId
6. Convert cart items to order items
7. Call `ordersService.create()` with:
   - Customer ID
   - Addresses
   - Order items
   - Totals
   - Discount code ID
   - Campaign/visit IDs
8. Mark cart as 'converted'
9. Return created order

**Integrations:**
- `customersService.create()` - Create customer from email
- `ordersService.create()` - Create order
- Stock deduction handled by orders service

---

#### mergeGuestCart
```typescript
async mergeGuestCart(
  fromSessionId: string,
  toSessionId: string,
  customerId?: string
): Promise<Cart>
```

**Logic:**
1. Find guest cart by fromSessionId
2. If guest cart empty: Return user cart
3. Get or create user cart (toSessionId)
4. For each item in guest cart:
   - Call `addItem()` on user cart (auto-merges duplicates)
5. Mark guest cart as 'merged'
6. Return user cart

---

#### markExpiredCartsAsAbandoned
```typescript
async markExpiredCartsAsAbandoned(): Promise<number>
```

**Logic:**
1. Query carts where `status = 'active'` AND `expiresAt < now()`
2. Update status to 'abandoned'
3. Return count of abandoned carts

**Use Case:**
Run as scheduled job (e.g., daily cron) to mark stale carts.

---

#### getAbandonedCarts
```typescript
async getAbandonedCarts(
  hoursAgo: number = 24,
  minValue?: number
): Promise<Cart[]>
```

**Logic:**
1. Query carts where:
   - `status = 'abandoned'`
   - `lastActivityAt > (now - hoursAgo)`
   - Optional: `total >= minValue`
2. Load items and customer relations
3. Return carts

**Use Case:**
Admin dashboard or remarketing campaigns.

---

## Repository Layer

### File Location
`apps/backend/src/modules/cart/repo/cart.repo.ts`

### Methods

```typescript
// Cart operations
findBySessionId(sessionId: string): Promise<Cart | null>
findById(cartId: string): Promise<Cart | null>
findByIdWithItems(cartId: string): Promise<Cart | null>
create(data: CreateCartInput): Promise<Cart>
update(cartId: string, data: UpdateCartInput): Promise<Cart>
delete(cartId: string): Promise<void>

// Cart item operations
findItem(cartId: string, variantId: string): Promise<CartItem | null>
findItemById(itemId: string): Promise<CartItem | null>
addItem(data: CreateCartItemInput): Promise<CartItem>
updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>
removeItem(itemId: string): Promise<void>
clearItems(cartId: string): Promise<void>

// Query operations
findExpiredCarts(): Promise<Cart[]>
findAbandonedCarts(hoursAgo: number, minValue?: number): Promise<Cart[]>
findActiveCarts(): Promise<Cart[]>
getCartCount(status?: CartStatus): Promise<number>
getAverageCartValue(): Promise<number>
```

### Example Implementation

```typescript
import { db } from '~/shared/db'
import { cartsTable, cartItemsTable } from '~/shared/db/cart'
import { eq, and, lt, gt, sql } from 'drizzle-orm'

export const cartRepo = {
  async findBySessionId(sessionId: string) {
    return await db.query.cartsTable.findFirst({
      where: eq(cartsTable.sessionId, sessionId),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true
              }
            }
          }
        },
        customer: true,
        discountCode: true
      }
    })
  },

  async create(data: CreateCartInput) {
    const [cart] = await db.insert(cartsTable)
      .values({
        sessionId: data.sessionId,
        customerId: data.customerId,
        status: 'active'
      })
      .returning()

    return cart
  },

  async addItem(data: CreateCartItemInput) {
    const [item] = await db.insert(cartItemsTable)
      .values(data)
      .returning()

    return item
  },

  async findItem(cartId: string, variantId: string) {
    return await db.query.cartItemsTable.findFirst({
      where: and(
        eq(cartItemsTable.cartId, cartId),
        eq(cartItemsTable.productVariantId, variantId)
      )
    })
  },

  async updateItemQuantity(itemId: string, quantity: number) {
    const [item] = await db.update(cartItemsTable)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItemsTable.id, itemId))
      .returning()

    return item
  },

  async findExpiredCarts() {
    return await db.query.cartsTable.findMany({
      where: and(
        eq(cartsTable.status, 'active'),
        lt(cartsTable.expiresAt, new Date())
      )
    })
  },

  async getCartCount(status?: CartStatus) {
    const condition = status ? eq(cartsTable.status, status) : undefined

    const result = await db.select({
      count: sql<number>`count(*)`
    })
    .from(cartsTable)
    .where(condition)

    return result[0].count
  }
}
```

---

## Integration with Existing Services

The cart system leverages existing business logic services to avoid duplication:

### 1. Product Variants Service

**Usage:**
- Validate product variant exists
- Check stock availability
- Get current price for cart item

**Methods Used:**
```typescript
productVariantsRepo.findById(variantId)
// Returns: { id, sku, price, quantityInStock, product: {...} }
```

**Called From:**
- `cart.service.addItem()` - Validate variant and stock
- `cart.service.updateItemQuantity()` - Check stock for quantity increase

---

### 2. Discount Codes Service

**Usage:**
- Validate discount code
- Calculate discount amount based on cart items
- Check usage limits and eligibility

**Methods Used:**
```typescript
discountCodesService.calculateCodeDiscount(
  discountCodeId: string,
  subtotal: number,
  items: CartItem[]
)
// Returns: { amount: number, percentage?: number }
```

**Called From:**
- `cart.service.applyDiscountCode()` - Apply discount to cart
- `cart.service.calculateTotals()` - Include discount in total calculation

---

### 3. Tax Calculation Service

**Usage:**
- Calculate tax based on shipping address
- Get jurisdiction and tax rates

**Methods Used:**
```typescript
calculateOrderTax(
  subtotal: number,
  shippingAddress: Address
)
// Returns: number (tax amount)
```

**Called From:**
- `cart.service.calculateTotals()` - Preview tax before checkout
- `cart.service.checkout()` - Final tax calculation

**File Location:**
`apps/backend/src/modules/orders/services/tax.service.ts`

---

### 4. Shipping Methods Service

**Usage:**
- Get available shipping methods
- Calculate shipping cost

**Methods Used:**
```typescript
shippingMethodsRepo.findById(methodId)
// Returns: { id, name, cost, deliveryTime, isActive }
```

**Called From:**
- `cart.service.calculateTotals()` - Include shipping in preview
- `cart.service.checkout()` - Add shipping to final order

---

### 5. Orders Service

**Usage:**
- Convert cart to order
- Handle inventory deduction
- Record discount usage

**Methods Used:**
```typescript
ordersService.create({
  customerId,
  shippingAddressId,
  billingAddressId,
  shippingMethodId,
  items: [{ productVariantId, quantity, unitPrice }],
  subtotal,
  discountTotal,
  taxTotal,
  shippingTotal,
  total,
  discountCodeId?,
  campaignId?,
  visitId?
})
// Returns: Order object
```

**Called From:**
- `cart.service.checkout()` - Create order from cart

**File Location:**
`apps/backend/src/modules/orders/services/orders.service.ts`

---

### 6. Customers Service

**Usage:**
- Create customer from email during guest checkout
- Link customer to cart

**Methods Used:**
```typescript
customersService.create({
  email,
  name?,
  phone?
})
// Returns: Customer object
```

**Called From:**
- `cart.service.checkout()` - Create customer if email provided

---

## Admin Dashboard UI

### Pages to Create

#### 1. Active Carts Page

**Route:** `/routes/carts/index.tsx`

**Features:**
- DataTable with columns:
  - Session ID (truncated)
  - Customer (name/email if linked, otherwise "Guest")
  - Items count
  - Cart value
  - Last activity
  - Actions (View details)
- Search by session ID or customer email
- Sort by value, last activity
- Filter by date range

**Example:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { activeCartsQueryOptions } from '~/utils/cart'
import { DataTable } from '~/components/data-table'
import { columns } from './columns'

export const Route = createFileRoute('/carts/')({
  component: ActiveCartsPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(activeCartsQueryOptions())
  },
})

function ActiveCartsPage() {
  const { data: carts } = useSuspenseQuery(activeCartsQueryOptions())

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Active Carts</h1>
      <DataTable
        columns={columns}
        data={carts}
        searchKey="sessionId"
      />
    </div>
  )
}
```

---

#### 2. Abandoned Carts Page

**Route:** `/routes/carts/abandoned.tsx`

**Features:**
- DataTable with columns:
  - Customer email
  - Cart value
  - Items count
  - Abandoned at (relative time)
  - Actions (View, Send reminder email)
- Filter by:
  - Hours ago (24, 48, 72)
  - Minimum cart value
- Sort by value (highest first)
- Bulk actions: Send reminder emails

**Example:**
```tsx
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { abandonedCartsQueryOptions } from '~/utils/cart'
import { DataTable } from '~/components/data-table'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/carts/abandoned')({
  component: AbandonedCartsPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(abandonedCartsQueryOptions())
  },
})

function AbandonedCartsPage() {
  const [hoursAgo, setHoursAgo] = useState(24)
  const { data: carts } = useSuspenseQuery(
    abandonedCartsQueryOptions(hoursAgo)
  )

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Abandoned Carts</h1>
        <div className="flex gap-2">
          <Button
            variant={hoursAgo === 24 ? 'default' : 'outline'}
            onClick={() => setHoursAgo(24)}
          >
            24h
          </Button>
          <Button
            variant={hoursAgo === 48 ? 'default' : 'outline'}
            onClick={() => setHoursAgo(48)}
          >
            48h
          </Button>
          <Button
            variant={hoursAgo === 72 ? 'default' : 'outline'}
            onClick={() => setHoursAgo(72)}
          >
            72h
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={carts} />
    </div>
  )
}
```

---

#### 3. Cart Details Dialog/Page

**Component:** `components/cart-details-dialog.tsx`

**Features:**
- Shows full cart details:
  - Session ID
  - Customer info (if linked)
  - Cart items with thumbnails
  - Quantity, price per item
  - Subtotal, discounts, tax, shipping, total
  - Applied discount code
  - Created at, last activity, expires at
- Actions:
  - Send reminder email (if customer email exists)
  - Mark as abandoned
  - Delete cart

---

#### 4. Dashboard Cart Metrics

**Route:** `/routes/index.tsx` (add to existing dashboard)

**Metrics Cards:**
- Active carts count
- Abandoned carts (24h)
- Average cart value
- Cart conversion rate (carts → orders)

**Example:**
```tsx
function CartMetrics() {
  const { data: metrics } = useSuspenseQuery(cartMetricsQueryOptions())

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Carts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abandoned (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.abandonedCount}</div>
          <p className="text-xs text-muted-foreground">
            ${metrics.abandonedValue} in potential revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Cart Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.avgValue}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

#### 5. Cart Analytics Chart

**Component:** Add to dashboard

**Chart Types:**
- Line chart: Active carts over time (last 30 days)
- Bar chart: Cart value distribution
- Pie chart: Cart status breakdown (active, abandoned, converted)

**Uses Recharts** (already in stack)

---

### Sidebar Navigation Updates

**File:** `src/components/app-sidebar.tsx`

Add cart section:
```tsx
{
  title: "Carts",
  items: [
    {
      title: "Active Carts",
      url: "/carts",
      icon: ShoppingCart,
    },
    {
      title: "Abandoned Carts",
      url: "/carts/abandoned",
      icon: ShoppingBag,
    },
  ],
}
```

---

## Storefront Integration Guide

This section guides developers building storefronts on how to integrate with the cart API.

### Prerequisites

- API base URL (e.g., `https://api.yourstore.com`)
- Generate and manage sessionId client-side

### Step 1: Generate Session ID

The storefront is responsible for generating and storing the sessionId.

**Recommended approach:**
```javascript
// utils/session.js

export function getOrCreateSessionId() {
  const STORAGE_KEY = 'cart_session_id'
  let sessionId = localStorage.getItem(STORAGE_KEY)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, sessionId)
  }

  return sessionId
}
```

**Alternative approaches:**
- Cookies (for SSR apps)
- IndexedDB (for offline support)
- Your own session backend

---

### Step 2: Fetch Cart on Page Load

```javascript
// utils/cart.js
import axios from 'axios'
import { getOrCreateSessionId } from './session'

const API_URL = 'https://api.yourstore.com'

export async function getCart(customerId) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.get(`${API_URL}/cart`, {
    params: { sessionId, customerId }
  })

  return data.data
}
```

---

### Step 3: Add to Cart

```javascript
export async function addToCart(variantId, quantity, customerId) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.post(`${API_URL}/cart/items`, {
    sessionId,
    customerId,
    variantId,
    quantity
  })

  return data.data
}
```

**Usage in React:**
```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addToCart } from './utils/cart'

function AddToCartButton({ variantId }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (quantity) => addToCart(variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart!')
    }
  })

  return (
    <button onClick={() => mutation.mutate(1)}>
      Add to Cart
    </button>
  )
}
```

---

### Step 4: Update Quantity

```javascript
export async function updateQuantity(itemId, quantity) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.put(`${API_URL}/cart/items/${itemId}`, {
    sessionId,
    quantity
  })

  return data.data
}
```

---

### Step 5: Apply Discount Code

```javascript
export async function applyDiscount(code) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.post(`${API_URL}/cart/discount`, {
    sessionId,
    code
  })

  return data.data
}
```

---

### Step 6: Calculate Totals (Preview)

```javascript
export async function calculateTotals(shippingAddressId, shippingMethodId) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.post(`${API_URL}/cart/calculate`, {
    sessionId,
    shippingAddressId,
    shippingMethodId
  })

  return data.data
}
```

**Use case:** Show tax and shipping preview before checkout.

---

### Step 7: Checkout

```javascript
export async function checkout(checkoutData) {
  const sessionId = getOrCreateSessionId()

  const { data } = await axios.post(`${API_URL}/cart/checkout`, {
    sessionId,
    ...checkoutData
  })

  return data.data.order
}
```

**Example checkoutData:**
```javascript
{
  customerId: 'customer-uuid',           // or omit for guest
  customerEmail: 'customer@example.com', // required if no customerId
  shippingAddressId: 'address-uuid',
  billingAddressId: 'address-uuid',
  shippingMethodId: 'method-uuid',
  notes: 'Optional notes',
  campaignId: 'campaign-uuid',           // for tracking
  visitId: 'visit-uuid'                  // for tracking
}
```

---

### Step 8: Cart Merging on Login (Optional)

If your storefront has authentication and you want to preserve guest cart items on login:

```javascript
export async function mergeGuestCart(userSessionId, customerId) {
  const guestSessionId = localStorage.getItem('cart_session_id')

  if (!guestSessionId) return

  const { data } = await axios.post(`${API_URL}/cart/merge`, {
    fromSessionId: guestSessionId,
    toSessionId: userSessionId,
    customerId
  })

  // Update sessionId to user's session
  localStorage.setItem('cart_session_id', userSessionId)

  return data.data
}
```

**Usage:**
```javascript
// After successful login
async function onLoginSuccess(user) {
  const userSessionId = generateNewSessionId() // or use user ID
  await mergeGuestCart(userSessionId, user.id)

  // Cart is now linked to user
}
```

---

### React Hook Example

```javascript
// hooks/useCart.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as cartApi from '../utils/cart'

export function useCart(customerId) {
  const queryClient = useQueryClient()

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(customerId)
  })

  const addItem = useMutation({
    mutationFn: ({ variantId, quantity }) =>
      cartApi.addToCart(variantId, quantity, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }) =>
      cartApi.updateQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const applyDiscount = useMutation({
    mutationFn: (code) => cartApi.applyDiscount(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const checkout = useMutation({
    mutationFn: (data) => cartApi.checkout(data),
    onSuccess: () => {
      // Clear cart from cache
      queryClient.setQueryData(['cart'], null)
      // Clear sessionId (cart is now converted)
      localStorage.removeItem('cart_session_id')
    }
  })

  return {
    cart,
    isLoading,
    addItem,
    updateQuantity,
    applyDiscount,
    checkout,
    itemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    total: cart?.total || 0
  }
}
```

**Usage in component:**
```jsx
function CartPage() {
  const { cart, updateQuantity, applyDiscount, checkout } = useCart()

  if (!cart) return <div>Loading...</div>

  return (
    <div>
      <h1>Your Cart</h1>
      {cart.items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onQuantityChange={(qty) =>
            updateQuantity.mutate({ itemId: item.id, quantity: qty })
          }
        />
      ))}

      <DiscountCodeForm onApply={(code) => applyDiscount.mutate(code)} />

      <div>Total: ${cart.total}</div>

      <button onClick={() => checkout.mutate(checkoutData)}>
        Checkout
      </button>
    </div>
  )
}
```

---

### Next.js App Router Example

For server components:

```typescript
// app/cart/page.tsx
import { getCart } from './actions'

export default async function CartPage() {
  const cart = await getCart()

  return <CartView cart={cart} />
}
```

```typescript
// app/cart/actions.ts
'use server'

import { cookies } from 'next/headers'
import axios from 'axios'

const API_URL = process.env.API_URL

export async function getCart() {
  const sessionId = cookies().get('cart_session_id')?.value ||
    crypto.randomUUID()

  if (!cookies().get('cart_session_id')) {
    cookies().set('cart_session_id', sessionId)
  }

  const { data } = await axios.get(`${API_URL}/cart`, {
    params: { sessionId }
  })

  return data.data
}

export async function addToCart(variantId: string, quantity: number) {
  const sessionId = cookies().get('cart_session_id')?.value

  const { data } = await axios.post(`${API_URL}/cart/items`, {
    sessionId,
    variantId,
    quantity
  })

  return data.data
}
```

---

## Implementation Checklist

### Backend Tasks

- [ ] **Database Schema**
  - [ ] Create `apps/backend/src/shared/db/cart.ts`
  - [ ] Define `cartsTable` with all fields
  - [ ] Define `cartItemsTable` with all fields
  - [ ] Define `cartStatusEnum`
  - [ ] Define relations (`cartsRelations`, `cartItemsRelations`)
  - [ ] Export from `apps/backend/src/shared/db/schema.ts`

- [ ] **Database Migrations**
  - [ ] Run `bun run db:generate` to create migration files
  - [ ] Review migration SQL
  - [ ] Run `bun run db:migrate` to apply migrations
  - [ ] Verify tables created in database

- [ ] **Types & Validation**
  - [ ] Create `apps/backend/src/modules/cart/cart.types.ts`
  - [ ] Define Zod schemas for requests (`addItemSchema`, `updateQuantitySchema`, etc.)
  - [ ] Define TypeScript types (`Cart`, `CartItem`, `CartTotals`, etc.)
  - [ ] Export all types

- [ ] **Repository Layer**
  - [ ] Create `apps/backend/src/modules/cart/repo/cart.repo.ts`
  - [ ] Implement cart CRUD methods
  - [ ] Implement cart item methods
  - [ ] Implement query methods (abandoned, expired, etc.)
  - [ ] Add proper error handling

- [ ] **Service Layer**
  - [ ] Create `apps/backend/src/modules/cart/services/cart.service.ts`
  - [ ] Implement `getOrCreateCart()`
  - [ ] Implement `addItem()` with stock validation
  - [ ] Implement `updateItemQuantity()`
  - [ ] Implement `removeItem()`
  - [ ] Implement `clearCart()`
  - [ ] Implement `applyDiscountCode()` (integrate with discount service)
  - [ ] Implement `removeDiscountCode()`
  - [ ] Implement `calculateTotals()` (integrate with tax/shipping)
  - [ ] Implement `checkout()` (integrate with orders service)
  - [ ] Implement `mergeGuestCart()`
  - [ ] Implement `markExpiredCartsAsAbandoned()`
  - [ ] Implement `getAbandonedCarts()`
  - [ ] Add comprehensive error handling
  - [ ] Add transaction support where needed

- [ ] **Routes Layer**
  - [ ] Create `apps/backend/src/modules/cart/cart.routes.ts`
  - [ ] Implement `GET /cart` (get or create)
  - [ ] Implement `POST /cart/items` (add item)
  - [ ] Implement `PUT /cart/items/:id` (update quantity)
  - [ ] Implement `DELETE /cart/items/:id` (remove item)
  - [ ] Implement `POST /cart/discount` (apply discount)
  - [ ] Implement `DELETE /cart/discount` (remove discount)
  - [ ] Implement `POST /cart/calculate` (preview totals)
  - [ ] Implement `DELETE /cart/clear` (clear cart)
  - [ ] Implement `POST /cart/checkout` (convert to order)
  - [ ] Implement `POST /cart/merge` (merge carts)
  - [ ] Implement `GET /admin/carts/abandoned` (admin only)
  - [ ] Add Zod validation to all routes
  - [ ] Add proper error responses

- [ ] **Main Routes Registration**
  - [ ] Import cart routes in `apps/backend/src/index.ts`
  - [ ] Register routes: `app.route('/cart', cartRoutes)`
  - [ ] Test all endpoints with curl/Postman

- [ ] **Testing**
  - [ ] Test cart creation
  - [ ] Test adding items (new + duplicate)
  - [ ] Test updating quantities
  - [ ] Test removing items
  - [ ] Test discount code application
  - [ ] Test cart totals calculation
  - [ ] Test checkout flow
  - [ ] Test cart merging
  - [ ] Test stock validation
  - [ ] Test abandoned cart detection

---

### Frontend Tasks (Admin Dashboard)

- [ ] **Cart Utilities**
  - [ ] Create `apps/frontend/src/utils/cart.ts`
  - [ ] Create `activeCartsQueryOptions()`
  - [ ] Create `abandonedCartsQueryOptions()`
  - [ ] Create `cartMetricsQueryOptions()`
  - [ ] Create server functions for admin API calls

- [ ] **Cart Types**
  - [ ] Create `apps/frontend/src/types/cartTypes.ts`
  - [ ] Define `Cart`, `CartItem`, `CartMetrics` types
  - [ ] Match backend response types

- [ ] **Active Carts Page**
  - [ ] Create `apps/frontend/src/routes/carts/index.tsx`
  - [ ] Create column definitions in `columns.tsx`
  - [ ] Implement DataTable with search/sort
  - [ ] Add view details action
  - [ ] Add loader for data prefetching

- [ ] **Abandoned Carts Page**
  - [ ] Create `apps/frontend/src/routes/carts/abandoned.tsx`
  - [ ] Create column definitions
  - [ ] Add time filter (24h, 48h, 72h)
  - [ ] Add minimum value filter
  - [ ] Implement "Send reminder" action (future feature)

- [ ] **Cart Details Component**
  - [ ] Create `apps/frontend/src/components/cart-details-dialog.tsx`
  - [ ] Show full cart details
  - [ ] Show items with product info
  - [ ] Show totals breakdown
  - [ ] Add actions (mark abandoned, delete)

- [ ] **Dashboard Metrics**
  - [ ] Update `apps/frontend/src/routes/index.tsx`
  - [ ] Add `CartMetrics` component
  - [ ] Show active carts count
  - [ ] Show abandoned carts count
  - [ ] Show average cart value
  - [ ] Show conversion rate
  - [ ] Add cart analytics chart (optional)

- [ ] **Sidebar Navigation**
  - [ ] Update `apps/frontend/src/components/app-sidebar.tsx`
  - [ ] Add "Carts" section
  - [ ] Add "Active Carts" link
  - [ ] Add "Abandoned Carts" link

---

### Documentation & Cleanup

- [ ] **API Documentation**
  - [ ] Create OpenAPI/Swagger spec (optional)
  - [ ] Document all endpoints with examples
  - [ ] Add Postman collection (optional)

- [ ] **Code Documentation**
  - [ ] Add JSDoc comments to all public methods
  - [ ] Document complex business logic
  - [ ] Add usage examples in README

- [ ] **Scheduled Jobs** (Optional)
  - [ ] Create cron job to mark expired carts as abandoned
  - [ ] Create cron job for abandoned cart emails (future)

---

### Deployment Checklist

- [ ] **Environment Variables**
  - [ ] Set `DATABASE_URL` in production
  - [ ] Set `API_URL` in frontend

- [ ] **Database**
  - [ ] Run migrations in production
  - [ ] Verify indexes are created
  - [ ] Check connection pooling settings

- [ ] **Performance**
  - [ ] Add database indexes (already in schema)
  - [ ] Test API response times under load
  - [ ] Consider caching for cart metrics

- [ ] **Monitoring**
  - [ ] Add logging for cart operations
  - [ ] Monitor abandoned cart rate
  - [ ] Track average cart value over time

---

## Key Design Decisions Summary

### 1. Headless Architecture
- Backend is purely an API
- No opinions on frontend implementation
- Storefront controls auth and session management
- Maximum flexibility for different use cases

### 2. SessionId as Primary Identifier
- Storefront generates and manages sessionId
- Backend accepts it as a parameter
- Enables guest checkout without authentication
- Optional customerId for linking to customer records

### 3. Stateless Backend
- No server-side session storage
- No cookies or session middleware
- Scales horizontally without sticky sessions
- Fits modern serverless architectures

### 4. Service Integration
- Reuses existing discount, tax, shipping logic
- Single source of truth for business rules
- Consistent calculations across cart and order
- Reduces code duplication

### 5. Price Snapshots
- Cart items capture price at time of addition
- Protects against mid-checkout price changes
- Matches real-world e-commerce behavior
- Can be updated if needed via admin

### 6. Optional Cart Merging
- Storefront decides if they want this feature
- Simple API endpoint for merging
- Handles duplicate items intelligently
- Preserves guest cart items on login

### 7. Admin Dashboard Focus
- View and analyze carts only
- No cart creation in admin
- Focus on abandoned cart recovery
- Metrics and analytics for business insights

---

## Future Enhancements

### Potential Features

**Abandoned Cart Recovery:**
- Email reminder system
- SMS notifications
- Discount incentives for recovery
- Automated reminder workflows

**Cart Persistence:**
- Save cart items to customer account permanently
- Sync cart across devices for logged-in users
- "Save for later" functionality

**Advanced Discounts:**
- Cart-level promotions (e.g., "Spend $100, get $10 off")
- Buy X get Y free
- Tiered discounts
- Bundle pricing

**Inventory Management:**
- Reserve stock when added to cart
- Stock countdown timers
- Low stock warnings

**Cart Sharing:**
- Generate shareable cart links
- Team/organization carts
- Wish list functionality

**Analytics:**
- Cart funnel analysis
- Item abandonment tracking
- Time-to-purchase metrics
- A/B testing for checkout flows

---

## Troubleshooting

### Common Issues

**Issue:** Cart not found
- **Cause:** sessionId not sent or incorrect
- **Solution:** Verify sessionId is being generated and sent with all requests

**Issue:** Duplicate items created
- **Cause:** Not checking for existing items before adding
- **Solution:** Service layer handles this; check `addItem()` implementation

**Issue:** Stock validation failing
- **Cause:** Product variant has insufficient stock
- **Solution:** Show stock availability to user before adding to cart

**Issue:** Totals not calculating correctly
- **Cause:** Missing tax address or shipping method
- **Solution:** Use `POST /cart/calculate` with all required data

**Issue:** Cart merging creates duplicate quantities
- **Cause:** Merging adds to existing quantities (by design)
- **Solution:** This is expected behavior; items from both carts are combined

---

## Conclusion

This headless cart system provides:

- **Flexibility:** Works with any frontend framework and auth system
- **Scalability:** Stateless design scales horizontally
- **Integration:** Reuses existing business logic services
- **Admin Tools:** Analytics and monitoring for business insights
- **Developer-Friendly:** Clear API, comprehensive docs, type-safe

The implementation follows your existing architecture patterns (Hono + Drizzle + 3-tier structure) and integrates seamlessly with your current product, discount, tax, and order systems.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-01
**Backend Stack:** Bun + Hono + Drizzle + PostgreSQL
**Frontend Stack:** TanStack Start + React + Tailwind
**Architecture:** Headless E-commerce API
