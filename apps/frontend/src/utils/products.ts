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