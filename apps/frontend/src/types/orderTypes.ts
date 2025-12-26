// Order Status
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

// Address type (used for shipping and billing addresses)
export type Address = {
  id: string
  streetAddress: string
  apartment?: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

// Customer type (basic info included in order details)
export type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
}

// Product Variant (minimal info for order items)
export type OrderProductVariant = {
  id: string
  sku: string
  price: string
  product?: {
    id: string
    name: string
    slug: string
  }
}

// Order Item
export type OrderItem = {
  id: string
  orderId: string
  productVariantId: string
  quantity: number
  unitPrice: string
  totalPrice: string
  createdAt: string
  productVariant?: OrderProductVariant
}

// Base Order
export type Order = {
  id: string
  orderNumber: string
  customerId: string
  shippingAddressId: string
  billingAddressId: string
  status: OrderStatus
  subtotal: string
  tax: string
  shippingCost: string
  total: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// Order with Items
export type OrderWithItems = Order & {
  items: OrderItem[]
}

// Order with Full Details (includes customer, addresses, items with product info)
export type OrderWithDetails = Order & {
  customer: Customer
  shippingAddress: Address
  billingAddress: Address
  items: (OrderItem & {
    productVariant: OrderProductVariant
  })[]
}

// Order Statistics
export type OrderStats = {
  itemCount: number
  totalQuantity: number
  averageItemPrice: string
}

// Customer Order Statistics
export type CustomerOrderStats = {
  customerId: string
  totalOrders: number
  totalSpent: string
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    refunded: number
  }
  lastOrderDate?: string | null
}

// Create Order Input
export type CreateOrderItemInput = {
  productVariantId: string
  quantity: number
}

export type CreateOrderInput = {
  customerId: string
  shippingAddressId: string
  billingAddressId: string
  items: CreateOrderItemInput[]
  shippingMethodId: string // Selected shipping method - tax and shipping calculated by backend
  notes?: string
}

// Update Order Input
export type UpdateOrderInput = {
  status?: OrderStatus
  notes?: string
}

export type UpdateOrderStatusInput = {
  status: OrderStatus
}

export type CancelOrderInput = {
  reason?: string
}

export type RefundOrderInput = {
  reason?: string
}

export type AddNotesInput = {
  notes: string
}

// API Response Types
export type OrderResponse = {
  success: boolean
  data: Order
}

export type OrdersResponse = {
  success: boolean
  data: Order[]
}

export type OrderWithItemsResponse = {
  success: boolean
  data: OrderWithItems
}

export type OrderWithDetailsResponse = {
  success: boolean
  data: OrderWithDetails
}

export type OrderStatsResponse = {
  success: boolean
  data: OrderStats
}

export type CustomerOrderStatsResponse = {
  success: boolean
  data: CustomerOrderStats
}
