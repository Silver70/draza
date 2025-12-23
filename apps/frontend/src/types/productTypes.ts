

export type Category = {
  id: string
  name: string
  slug: string
}

export type CategoryWithProductCount = Category & {
  productCount: number
}

export type Product = {
  id: string
  name: string
  slug: string
  description?: string
  categoryId?: string
  category?: Category | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductVariant = {
  id: string
  productId: string
  sku: string
  price: number
  quantity: number
  isActive: boolean
}

export type ProductWithVariants = Product & {
  variants?: ProductVariant[]
}

export type ProductsResponse = {
  success: boolean
  data: Product[]
}
