// Cart Status
export type CartStatus = 'active' | 'abandoned' | 'converted' | 'merged'

// Product Variant (minimal info for cart items)
export type CartProductVariant = {
  id: string
  sku: string
  price: string
  quantityInStock: number
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
  }
}

// Cart Item
export type CartItem = {
  id: string
  cartId: string
  productVariantId: string
  quantity: number
  unitPrice: string
  createdAt: string
  updatedAt: string
  productVariant: CartProductVariant
}

// Discount Code (as it appears in cart)
export type CartDiscountCode = {
  id: string
  code: string
  discountId: string
  discount: {
    type: string
    value: string
  }
}

// Customer (basic info in cart)
export type CartCustomer = {
  id: string
  firstName: string
  lastName: string
  email: string
}

// Base Cart
export type Cart = {
  id: string
  sessionId: string
  customerId: string | null
  status: CartStatus
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
  discountCodeId: string | null
  expiresAt: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
}

// Cart with Items
export type CartWithItems = Cart & {
  items: CartItem[]
  customer?: CartCustomer | null
  discountCode?: CartDiscountCode | null
}

// Cart Totals
export type CartTotals = {
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
}

// Cart Totals Breakdown (with preview details)
export type CartTotalsBreakdown = CartTotals & {
  breakdown: {
    items: {
      name: string
      quantity: number
      lineTotal: string
    }[]
    discount?: {
      code: string
      amount: string
    } | null
    tax?: {
      jurisdiction: string
      rate: string
      amount: string
    } | null
    shipping?: {
      method: string
      cost: string
    } | null
  }
}

// Cart Metrics (for admin dashboard)
export type CartMetrics = {
  activeCount: number
  abandonedCount: number
  avgValue: string
}

// Input Types

// Add item to cart
export type AddItemToCartInput = {
  sessionId: string
  customerId?: string
  variantId: string
  quantity: number
}

// Update cart item quantity
export type UpdateCartItemInput = {
  sessionId: string
  quantity: number
}

// Apply discount code
export type ApplyDiscountCodeInput = {
  sessionId: string
  code: string
}

// Calculate cart totals
export type CalculateCartTotalsInput = {
  sessionId: string
  shippingAddressId?: string
  shippingMethodId?: string
}

// Checkout
export type CheckoutInput = {
  sessionId: string
  customerId?: string
  customerEmail?: string
  shippingAddressId: string
  billingAddressId: string
  shippingMethodId: string
  notes?: string
  campaignId?: string
  visitId?: string
}

// Merge carts
export type MergeCartsInput = {
  fromSessionId: string
  toSessionId: string
  customerId?: string
}

// Admin query filters
export type AbandonedCartsFilters = {
  hoursAgo?: number
  minValue?: number
}

// API Response Types
export type CartResponse = {
  success: boolean
  data: CartWithItems
}

export type CartsResponse = {
  success: boolean
  data: CartWithItems[]
}

export type CartTotalsResponse = {
  success: boolean
  data: CartTotals | CartTotalsBreakdown
}

export type CartMetricsResponse = {
  success: boolean
  data: CartMetrics
}

export type ApplyDiscountResponse = {
  success: boolean
  data: {
    cart: CartWithItems
    discount: {
      id: string
      discountType: string
      value: string
    }
  }
}

// Order response (for checkout)
export type CheckoutResponse = {
  success: boolean
  data: {
    id: string
    orderNumber: string
    customerId: string
    status: string
    total: string
    createdAt: string
  }
}
