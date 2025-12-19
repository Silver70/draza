import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'

export type Category = {
  id: string
  name: string
  slug: string
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

type ProductsResponse = {
  success: boolean
  data: Product[]
}

// TODO: Update this to your actual API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const fetchProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching products...')
    try {
      const response = await axios.get<ProductsResponse>(
        `${API_BASE_URL}/products`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch products')
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },
)

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
  })

export const fetchProduct = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching product with id ${data}...`)
    try {
      const response = await axios.get<{ success: boolean; data: Product }>(
        `${API_BASE_URL}/products/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Product not found')
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  })

export const productQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct({ data: productId }),
  })
