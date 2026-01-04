import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import type {
  Product,
  ProductsResponse,
  CollectionWithProducts,
  CollectionWithProductsResponse,
  ProductWithVariants,
  ProductWithVariantsResponse
} from '~/types/productTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const fetchProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching products...')
    try {
      const response = await axios.get<ProductsResponse>(
        `${API_BASE_URL}/products/active`,
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

export const productsQueryOptions = () => {
  return queryOptions<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts
  })
}

export const fetchCollectionProducts = async (
  collectionId: string,
): Promise<CollectionWithProducts> => {
  console.info(`Fetching products for collection: ${collectionId}`)
  try {
    const response = await axios.get<CollectionWithProductsResponse>(
      `${API_BASE_URL}/products/collections/${collectionId}/products`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch collection products')
  } catch (error) {
    console.error('Error fetching collection products:', error)
    throw error
  }
}

export const collectionProductsQueryOptions = (collectionId: string) => {
  return queryOptions<CollectionWithProducts>({
    queryKey: ['collection', collectionId, 'products'],
    queryFn: () => fetchCollectionProducts(collectionId),
  })
}

export const fetchProductWithVariants = async (
  productSlug: string,
): Promise<ProductWithVariants> => {
  console.info(`Fetching product with variants: ${productSlug}`)
  try {
    const response = await axios.get<ProductWithVariantsResponse>(
      `${API_BASE_URL}/products/slug/${productSlug}/variants`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch product with variants')
  } catch (error) {
    console.error('Error fetching product with variants:', error)
    throw error
  }
}

export const productWithVariantsQueryOptions = (productSlug: string) => {
  return queryOptions<ProductWithVariants>({
    queryKey: ['product', productSlug, 'variants'],
    queryFn: () => fetchProductWithVariants(productSlug),
  })
}





