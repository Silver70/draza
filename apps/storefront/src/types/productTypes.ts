// Product Types
export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  categoryId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: number
  productId: number
  sku: string
  price: string
  quantityInStock: number
}

export interface ProductImage {
  id: number
  productId: number
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  images?: ProductImage[]
}

export type ProductsResponse = {
  success: boolean
  data: Product[]
}

export type ProductWithVariantsResponse = {
  success: boolean
  data: ProductWithVariants
}

// Category & Collection Types
interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
}


interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

export interface CollectionWithProducts extends Collection {
  products: Product[]
  productCount: number
}

export type CollectionWithProductsResponse = {
  success: boolean
  data: CollectionWithProducts
}

// Cart Types
interface Cart {
  id: number
  sessionId: string
  customerId: number | null
  status: 'active' | 'abandoned' | 'converted'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
}

interface CartItem {
  id: number
  cartId: number
  productVariantId: number
  quantity: number
  unitPrice: string
}

// Customer Types
interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isGuest: boolean
  createdAt: string
}

interface Address {
  id: number
  customerId: number
  firstName: string
  lastName: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

// Order Types
interface Order {
  id: number
  orderNumber: string
  customerId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  createdAt: string
}

interface OrderItem {
  id: number
  orderId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  totalPrice: string
}

// Discount Types
interface Discount {
  id: number
  name: string
  discountType: 'percentage' | 'fixed_amount'
  value: string
  scope: 'store_wide' | 'collection' | 'product' | 'variant' | 'code'
  isActive: boolean
}

// API Response Types
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}