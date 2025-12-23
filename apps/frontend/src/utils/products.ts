import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import { Category, CategoryWithProductCount, Product, ProductsResponse, Collection} from '../types/productTypes'

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

export const fetchSingleProduct = createServerFn({ method: 'GET' })
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

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: Partial<Product>) => d)
  .handler(async ({ data }) => {
    console.info('Creating product...', data)
    try {
      const response = await axios.post<{ success: boolean; data: Product }>(
        `${API_BASE_URL}/products`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create product')
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  })


export const productQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ['product', productId],
    queryFn: () => fetchSingleProduct({ data: productId }),
  })


export const fetchCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching categories...')
    try {
      const response = await axios.get<{
        success: boolean
        data: Category[]
      }>(`${API_BASE_URL}/products/categories`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch categories')
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },
)
export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
  })

export const fetchCategoriesWithProductCount = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching categories with product count...')
    try {
      const response = await axios.get<{
        success: boolean
        data: CategoryWithProductCount[]
      }>(`${API_BASE_URL}/products/categories/with-counts`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch categories with product count')
    } catch (error) {
      console.error('Error fetching categories with product count:', error)
      throw error
    }
  },
)
export const categoriesWithProductCountQueryOptions = () =>
  queryOptions({
    queryKey: ['categories', 'with-product-count'],
    queryFn: () => fetchCategoriesWithProductCount(),
  })

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: Partial<Category>) => d)
  .handler(async ({ data }) => {
    console.info('Creating category...', data)
    try {
      const response = await axios.post<{ success: boolean; data: Category }>(
        `${API_BASE_URL}/products/categories`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create category')
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  })

// Collections
export const fetchCollections = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching collections...')
    try {
      const response = await axios.get<{
        success: boolean
        data: Collection[]
      }>(`${API_BASE_URL}/products/collections`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch collections')
    } catch (error) {
      console.error('Error fetching collections:', error)
      throw error
    }
  },
)

export const collectionsQueryOptions = () =>
  queryOptions({
    queryKey: ['collections'],
    queryFn: () => fetchCollections(),
  })

export const createCollection = createServerFn({ method: 'POST' })
  .inputValidator((d: Partial<Collection>) => d)
  .handler(async ({ data }) => {
    console.info('Creating collection...', data)
    try {
      const response = await axios.post<{ success: boolean; data: Collection }>(
        `${API_BASE_URL}/products/collections`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create collection')
    } catch (error) {
      console.error('Error creating collection:', error)
      throw error
    }
  })

// Attribute types
export type AttributeValue = {
  id: string
  value: string
  attributeId: string
}

export type Attribute = {
  id: string
  name: string
  values?: AttributeValue[]
}

export type AttributeWithValues = {
  attributeId: string
  attributeName: string
  values: { id: string; value: string }[]
}

// Fetch attributes with values
export const fetchAttributes = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching attributes...')
    try {
      const response = await axios.get<{
        success: boolean
        data: Attribute[]
      }>(`${API_BASE_URL}/products/attributes?withValues=true`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch attributes')
    } catch (error) {
      console.error('Error fetching attributes:', error)
      throw error
    }
  },
)

export const attributesQueryOptions = () =>
  queryOptions({
    queryKey: ['attributes'],
    queryFn: () => fetchAttributes(),
  })

// Create attribute
export const createAttribute = createServerFn({ method: 'POST' })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }) => {
    console.info('Creating attribute...', data)
    try {
      const response = await axios.post<{ success: boolean; data: Attribute }>(
        `${API_BASE_URL}/products/attributes`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create attribute')
    } catch (error) {
      console.error('Error creating attribute:', error)
      throw error
    }
  })

// Add value to attribute
export const addAttributeValue = createServerFn({ method: 'POST' })
  .inputValidator((d: { attributeId: string; value: string }) => d)
  .handler(async ({ data }) => {
    console.info('Adding attribute value...', data)
    try {
      const response = await axios.post<{
        success: boolean
        data: AttributeValue
      }>(`${API_BASE_URL}/products/attributes/${data.attributeId}/values`, {
        value: data.value,
      })

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add attribute value')
    } catch (error) {
      console.error('Error adding attribute value:', error)
      throw error
    }
  })

// Preview variant combinations
export const previewVariants = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      productSlug: string
      attributes: AttributeWithValues[]
      defaultPrice: number
      defaultQuantity: number
    }) => d,
  )
  .handler(async ({ data }) => {
    console.info('Previewing variants...', data)
    try {
      const response = await axios.post<{
        success: boolean
        data: {
          variants: Array<{
            sku: string
            price: number
            quantityInStock: number
            attributeValueIds: string[]
            attributeDetails: Array<{
              attributeId: string
              attributeName: string
              value: string
            }>
          }>
        }
      }>(`${API_BASE_URL}/products/preview-variants`, data)

      if (response.data.success) {
        return response.data.data.variants
      }

      throw new Error('Failed to preview variants')
    } catch (error) {
      console.error('Error previewing variants:', error)
      throw error
    }
  })

// Create product with pre-configured variants
export const createProductWithVariants = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      product: Partial<Product>
      variants: Array<{
        sku: string
        price: number
        quantityInStock: number
        attributeValueIds: string[]
      }>
    }) => d,
  )
  .handler(async ({ data }) => {
    console.info('Creating product with variants...', data)
    try {
      const response = await axios.post<{
        success: boolean
        data: { product: Product; variantResult: any }
      }>(`${API_BASE_URL}/products/with-variants`, data)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create product with variants')
    } catch (error) {
      console.error('Error creating product with variants:', error)
      throw error
    }
  })