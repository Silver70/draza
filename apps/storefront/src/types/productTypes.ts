// Product Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  price: string
  quantityInStock: number
}

export interface ProductImage {
  id: string
  productId: string
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
  id: string
  name: string
  slug: string
  parentId: string | null
}


interface Collection {
  id: string
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
  id: string
  sessionId: string
  customerId: string | null
  status: 'active' | 'abandoned' | 'converted'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
}

interface CartItem {
  id: string
  cartId: string
  productVariantId: string
  quantity: number
  unitPrice: string
}

// Customer Types
interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isGuest: boolean
  createdAt: string
}

interface Address {
  id: string
  customerId: string
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
  id: string
  orderNumber: string
  customerId: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  createdAt: string
}

interface OrderItem {
  id: string
  orderId: string
  productVariantId: string
  quantity: number
  unitPrice: string
  totalPrice: string
}

// Discount Types
interface Discount {
  id: string
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