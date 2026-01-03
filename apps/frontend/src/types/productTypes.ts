

export type Category = {
  id: string
  name: string
  slug: string
}

export type CategoryWithProductCount = Category & {
  productCount: number
}

export type ProductImage = {
  id: string
  productId: string
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description?: string
  categoryId?: string
  category?: Category | null
  images?: ProductImage[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductVariant = {
  id: string
  productId: string
  sku: string
  price: string
  quantityInStock: number
  createdAt: string
  updatedAt: string
}

export type ProductWithVariants = Product & {
  variants?: ProductVariant[]
}

export type ProductsResponse = {
  success: boolean
  data: Product[]
}

export type Collection = {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CollectionWithProductCount = Collection & {
  productCount: number
}
