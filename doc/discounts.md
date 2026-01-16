● Based on my exploration of your backend, here's my comprehensive recommendation for implementing a flexible discount system:

  Current State Summary

  Your backend uses:
  - Drizzle ORM + PostgreSQL for data
  - Price storage: Only at productVariantsTable.price level
  - Order flow: Subtotal → Tax → Shipping → Total (no discount support currently)
  - Clean architecture: Routes → Services → Repository pattern

  Recommended Approach: Flexible Discount System

  1. Database Schema Additions

  I recommend creating these new tables in a discount.ts schema file:

  // Core discount rules table
  discountsTable:
    - id (UUID)
    - name (e.g., "Summer Sale", "Black Friday")
    - description
    - discountType (ENUM: 'percentage', 'fixed_amount')
    - value (numeric) // 10 for 10% or $10
    - scope (ENUM: 'store_wide', 'collection', 'product', 'code')
    - isActive (boolean)
    - startsAt (timestamp)
    - endsAt (timestamp, nullable)
    - priority (integer) // for stacking rules
    - createdAt, updatedAt

  // For code-based discounts
  discountCodesTable:
    - id (UUID)
    - discountId (FK)
    - code (unique string, e.g., "SUMMER10")
    - usageLimit (nullable) // null = unlimited
    - usageCount (integer, default 0)
    - minimumOrderValue (numeric, nullable)
    - isActive (boolean)

  // Link discounts to specific products
  discountProductsTable:
    - discountId (FK)
    - productId (FK)
    - Primary key: (discountId, productId)

  // Link discounts to collections
  discountCollectionsTable:
    - discountId (FK)
    - collectionId (FK)
    - Primary key: (discountId, collectionId)

  // Track applied discounts in orders
  orderDiscountsTable:
    - id (UUID)
    - orderId (FK)
    - discountId (FK, nullable) // null for manual discounts
    - code (nullable) // if code was used
    - discountType ('percentage' | 'fixed_amount')
    - value (numeric) // snapshot
    - appliedAmount (numeric) // actual $ saved
    - description (text) // e.g., "10% off Summer Sale"

  2. Extend Orders Table

  Add these fields to ordersTable:
  - discountAmount (numeric, default 0) // total discount applied
  - total calculation becomes: subtotal - discountAmount + tax + shippingCost

  3. Discount Priority & Stacking Logic

  Priority Resolution (highest priority wins per item):
  1. Product-specific discount (priority: 100)
  2. Collection-specific discount (priority: 50)
  3. Store-wide discount (priority: 10)
  4. Code-based discounts (can stack with automatic discounts)

  Example Flow:
  - Product A has individual 15% off
  - Collection "Electronics" has 10% off (Product A is in this collection)
  - Store-wide 5% off active
  - Result: Product A gets 15% (highest priority)

  4. Service Layer Implementation

  Create apps/backend/src/modules/discounts/:

  discounts.service.ts - Key methods:
  // Get applicable discounts for cart items
  calculateDiscounts(items: CartItem[]): DiscountBreakdown

  // Validate and apply discount code
  validateDiscountCode(code: string, cartTotal: number): DiscountCode

  // Get active discounts for a product
  getProductDiscounts(productId: string): Discount[]

  // Apply discounts to order creation
  applyDiscountsToOrder(order: Order, discountCode?: string): Order

  Calculation Algorithm:
  For each cart item:
    1. Get base price from variant
    2. Find all applicable discounts (product/collection/store-wide)
    3. Apply highest priority discount
    4. Calculate line item discount

  If discount code provided:
    5. Validate code (usage limits, minimum order)
    6. Apply code discount (can be additive or override)

  Calculate totals:
    - Subtotal = sum(base prices)
    - Discount = sum(all item discounts + code discount)
    - Tax = (subtotal - discount) × taxRate
    - Total = subtotal - discount + tax + shipping

  5. API Endpoints to Add

  Admin Discount Management (/discounts):
  POST   /discounts                    - Create discount
  GET    /discounts                    - List all
  GET    /discounts/:id                - Get one
  PUT    /discounts/:id                - Update
  DELETE /discounts/:id                - Delete
  PUT    /discounts/:id/activate       - Toggle active
  POST   /discounts/:id/products       - Add products
  POST   /discounts/:id/collections    - Add collections
  POST   /discounts/:id/codes          - Create discount code

  Customer-Facing (integrate into orders):
  POST   /orders/validate-discount     - Validate code before checkout
  GET    /products/:id/active-discounts - Show discount on product page

  6. Integration with Existing Order Flow

  Modify orders.service.ts → createOrder():
  async createOrder(data) {
    // 1. Validate items & get prices (existing)
    const items = await validateOrderItems(data.items);

    // 2. NEW: Calculate discounts
    const discountBreakdown = await discountsService.calculateDiscounts(items);

    // 3. NEW: Validate discount code if provided
    if (data.discountCode) {
      await discountsService.validateCode(data.discountCode, subtotal);
    }

    // 4. Calculate subtotal (existing)
    const subtotal = items.reduce(...);

    // 5. NEW: Apply discount
    const discountAmount = discountBreakdown.totalDiscount;

    // 6. Calculate tax on discounted amount (modified)
    const tax = await taxService.calculate(subtotal - discountAmount);

    // 7. Calculate shipping (existing)
    const shipping = await shippingService.calculate(...);

    // 8. Calculate total (modified)
    const total = subtotal - discountAmount + tax + shipping;

    // 9. Create order with discount tracking
    return db.transaction(async (tx) => {
      const order = await tx.insert(ordersTable).values({
        subtotal,
        discountAmount,  // NEW
        tax,
        shippingCost: shipping,
        total
      });

      // NEW: Record applied discounts
      if (discountBreakdown.appliedDiscounts.length) {
        await tx.insert(orderDiscountsTable).values(...);
      }

      // Increment code usage if used
      if (data.discountCode) {
        await tx.update(discountCodesTable)...
      }
    });
  }

  7. Frontend Display Considerations

  You'll need to update checkout to show:
  Subtotal:        $100.00
  Discount (10%):  -$10.00
  ---
  Tax:             $8.10    (calculated on $90)
  Shipping:        $5.00
  ---
  Total:           $103.10

  8. Migration Strategy

  Phase 1 - Schema:
  1. Create discount schema file
  2. Generate and run migrations
  3. Add discountAmount to orders table

  Phase 2 - Backend:
  1. Build discounts module (routes, services, repo)
  2. Add discount calculation to order creation
  3. Create admin discount management endpoints

  Phase 3 - Frontend:
  1. Admin UI for discount management
  2. Discount code input at checkout
  3. Display discount info on product pages

  Key Benefits of This Approach

  ✅ Flexibility: Supports all your requirements (store/collection/product level)
  ✅ Non-destructive: Doesn't modify existing price structure
  ✅ Audit trail: Tracks exactly what discounts were applied to each order
  ✅ Priority system: Clear rules for which discount applies
  ✅ Code support: Redeemable codes with usage limits
  ✅ Future-proof: Easy to add features like "buy X get Y" later
  ✅ Follows existing patterns: Matches your current architecture style