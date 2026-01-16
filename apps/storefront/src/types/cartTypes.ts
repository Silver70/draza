/**
 * Cart Types matching backend API
 */

export interface CartItem {
  id: string
  cartId: string
  productVariantId: string
  quantity: number
  unitPrice: string
  productVariant: {
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
  createdAt: string
  updatedAt: string
}

export interface Cart {
  id: string
  sessionId: string
  customerId: string | null
  status: 'active' | 'abandoned' | 'converted' | 'merged'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
  discountCodeId: string | null
  items: CartItem[]
  expiresAt: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
}

export interface AddToCartInput {
  sessionId: string
  customerId?: string
  variantId: string
  quantity: number
}

export interface UpdateCartItemInput {
  sessionId: string
  quantity: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export type CartResponse = ApiResponse<Cart>
export type AddItemResponse = ApiResponse<Cart>
