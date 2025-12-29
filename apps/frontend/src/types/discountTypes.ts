// Discount Types and Scopes
export type DiscountType = 'percentage' | 'fixed_amount'
export type DiscountScope = 'store_wide' | 'collection' | 'product' | 'variant' | 'code'

// Base Discount
export type Discount = {
  id: string
  name: string
  description: string | null
  discountType: DiscountType
  value: string
  scope: DiscountScope
  isActive: boolean
  priority: number
  startsAt: string
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

// Discount Code
export type DiscountCode = {
  id: string
  discountId: string
  code: string
  usageLimit: number | null
  usageCount: number
  minimumOrderValue: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Product info for discount
export type DiscountProduct = {
  discountId: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
  }
}

// Collection info for discount
export type DiscountCollection = {
  discountId: string
  collectionId: string
  collection: {
    id: string
    name: string
    slug: string
  }
}

// Variant info for discount
export type DiscountVariant = {
  discountId: string
  variantId: string
  variant: {
    id: string
    sku: string
    price: string
    productId: string
  }
}

// Discount with codes
export type DiscountWithCodes = Discount & {
  codes: DiscountCode[]
}

// Discount with products
export type DiscountWithProducts = Discount & {
  discountProducts: DiscountProduct[]
}

// Discount with collections
export type DiscountWithCollections = Discount & {
  discountCollections: DiscountCollection[]
}

// Discount with variants
export type DiscountWithVariants = Discount & {
  discountVariants: DiscountVariant[]
}

// Discount with full details
export type DiscountWithDetails = Discount & {
  codes: DiscountCode[]
  discountProducts: DiscountProduct[]
  discountCollections: DiscountCollection[]
  discountVariants: DiscountVariant[]
}

// Order Discount (applied discount in an order)
export type OrderDiscount = {
  id: string
  orderId: string
  discountId: string | null
  code: string | null
  discountType: DiscountType
  value: string
  appliedAmount: string
  description: string
  createdAt: string
}

// Create Discount Input
export type CreateDiscountInput = {
  name: string
  description?: string
  discountType: DiscountType
  value: number
  scope: DiscountScope
  isActive?: boolean
  priority?: number
  startsAt?: string
  endsAt?: string | null
}

// Update Discount Input
export type UpdateDiscountInput = {
  name?: string
  description?: string
  discountType?: DiscountType
  value?: number
  scope?: DiscountScope
  isActive?: boolean
  priority?: number
  startsAt?: string
  endsAt?: string | null
}

// Create Discount Code Input
export type CreateDiscountCodeInput = {
  code: string
  usageLimit?: number | null
  minimumOrderValue?: number | null
  isActive?: boolean
}

// Update Discount Code Input
export type UpdateDiscountCodeInput = {
  code?: string
  usageLimit?: number | null
  minimumOrderValue?: number | null
  isActive?: boolean
}

// Add Products to Discount
export type AddProductsToDiscountInput = {
  productIds: string[]
}

// Add Collections to Discount
export type AddCollectionsToDiscountInput = {
  collectionIds: string[]
}

// Add Variants to Discount
export type AddVariantsToDiscountInput = {
  variantIds: string[]
}

// Validate Discount Code Input
export type ValidateDiscountCodeInput = {
  code: string
  orderTotal: number
}

// Validate Discount Code Response
export type ValidateDiscountCodeResponse = {
  valid: boolean
  discountAmount?: number
  finalTotal?: number
  discount?: {
    name: string
    description: string | null
    type: DiscountType
    value: string
  }
}

// API Response Types
export type DiscountResponse = {
  success: boolean
  data: Discount
}

export type DiscountsResponse = {
  success: boolean
  data: Discount[]
}

export type DiscountWithDetailsResponse = {
  success: boolean
  data: DiscountWithDetails
}

export type DiscountCodesResponse = {
  success: boolean
  data: DiscountCode[]
}

export type DiscountCodeResponse = {
  success: boolean
  data: DiscountCode
}

export type ValidateCodeResponse = {
  success: boolean
  data: ValidateDiscountCodeResponse
  error?: string
}

export type OrderDiscountsResponse = {
  success: boolean
  data: OrderDiscount[]
}

// Discount Statistics
export type DiscountStats = {
  totalDiscounts: number
  activeDiscounts: number
  totalCodes: number
  totalUsage: number
}

// Discount filters for listing
export type DiscountFilters = {
  scope?: DiscountScope
  isActive?: boolean
  search?: string
}
