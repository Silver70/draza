import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import apiClient from '~/lib/apiClient'
import { Category, CategoryWithProductCount, Product, ProductsResponse, Collection, CollectionWithProductCount, ProductWithVariants, ProductVariant} from '../types/productTypes'

export const fetchProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching products...')
    try {
      const response = await apiClient.get<ProductsResponse>(
        `/products`,
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
      const response = await apiClient.get<{ success: boolean; data: Product }>(
        `/products/${data}`,
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
      const response = await apiClient.post<{ success: boolean; data: Product }>(
        `/products`,
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

// Activate product
export const activateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: productId }) => {
    console.info(`Activating product ${productId}...`)
    try {
      const response = await apiClient.put<{ success: boolean; data: Product }>(
        `/products/${productId}/activate`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to activate product')
    } catch (error) {
      console.error('Error activating product:', error)
      throw error
    }
  })

// Deactivate product
export const deactivateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: productId }) => {
    console.info(`Deactivating product ${productId}...`)
    try {
      const response = await apiClient.put<{ success: boolean; data: Product }>(
        `/products/${productId}/deactivate`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to deactivate product')
    } catch (error) {
      console.error('Error deactivating product:', error)
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
      const response = await apiClient.get<{
        success: boolean
        data: Category[]
      }>(`/products/categories`)

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
      const response = await apiClient.get<{
        success: boolean
        data: CategoryWithProductCount[]
      }>(`/products/categories/with-counts`)

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
      const response = await apiClient.post<{ success: boolean; data: Category }>(
        `/products/categories`,
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
      const response = await apiClient.get<{
        success: boolean
        data: Collection[]
      }>(`/products/collections`)

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

export const fetchCollectionsWithProductCount = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching collections with product count...')
    try {
      const response = await apiClient.get<{
        success: boolean
        data: CollectionWithProductCount[]
      }>(`/products/collections/with-counts`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch collections with product count')
    } catch (error) {
      console.error('Error fetching collections with product count:', error)
      throw error
    }
  },
)

export const collectionsWithProductCountQueryOptions = () =>
  queryOptions({
    queryKey: ['collections', 'with-product-count'],
    queryFn: () => fetchCollectionsWithProductCount(),
  })

// Fetch single collection with products
export const fetchCollectionWithProducts = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching collection ${data} with products...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: Collection & { products: Product[]; productCount: number }
      }>(`/products/collections/${data}/products`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Collection not found')
    } catch (error) {
      console.error('Error fetching collection with products:', error)
      throw error
    }
  })

export const collectionWithProductsQueryOptions = (collectionId: string) =>
  queryOptions({
    queryKey: ['collection', collectionId, 'products'],
    queryFn: () => fetchCollectionWithProducts({ data: collectionId }),
  })

export const createCollection = createServerFn({ method: 'POST' })
  .inputValidator((d: Partial<Collection>) => d)
  .handler(async ({ data }) => {
    console.info('Creating collection...', data)
    try {
      const response = await apiClient.post<{ success: boolean; data: Collection }>(
        `/products/collections`,
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

export const addProductsToCollection = createServerFn({ method: 'POST' })
  .inputValidator((d: { collectionId: string; productIds: string[] }) => d)
  .handler(async ({ data }) => {
    console.info('Adding products to collection...', data)
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/products/collections/${data.collectionId}/products/bulk`,
        { productIds: data.productIds },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add products to collection')
    } catch (error) {
      console.error('Error adding products to collection:', error)
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
      const response = await apiClient.get<{
        success: boolean
        data: Attribute[]
      }>(`/products/attributes?withValues=true`)

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
      const response = await apiClient.post<{ success: boolean; data: Attribute }>(
        `/products/attributes`,
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
      const response = await apiClient.post<{
        success: boolean
        data: AttributeValue
      }>(`/products/attributes/${data.attributeId}/values`, {
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
      const response = await apiClient.post<{
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
      }>(`/products/preview-variants`, data)

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
      const response = await apiClient.post<{
        success: boolean
        data: { product: Product; variantResult: any }
      }>(`/products/with-variants`, data)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create product with variants')
    } catch (error) {
      console.error('Error creating product with variants:', error)
      throw error
    }
  })

// Fetch product with variants
export const fetchProductWithVariants = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching product ${data} with variants...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: ProductWithVariants
      }>(`/products/${data}/variants`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Product not found')
    } catch (error) {
      console.error('Error fetching product with variants:', error)
      throw error
    }
  })

export const productWithVariantsQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ['product', productId, 'variants'],
    queryFn: () => fetchProductWithVariants({ data: productId }),
  })

// Fetch all products with their variants
export const fetchAllProductsWithVariants = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching all products with variants...')
    try {
      // First fetch all products
      const productsResponse = await apiClient.get<ProductsResponse>(
        `/products`,
      )

      if (!productsResponse.data.success) {
        throw new Error('Failed to fetch products')
      }

      const products = productsResponse.data.data

      // Then fetch variants for each product in parallel
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
          try {
            const variantsResponse = await apiClient.get<{
              success: boolean
              data: ProductWithVariants
            }>(`/products/${product.id}/variants`)

            if (variantsResponse.data.success) {
              return variantsResponse.data.data
            }
            // If variants fetch fails, return product without variants
            return { ...product, variants: [] }
          } catch (error) {
            console.warn(`Failed to fetch variants for product ${product.id}:`, error)
            return { ...product, variants: [] }
          }
        })
      )

      return productsWithVariants
    } catch (error) {
      console.error('Error fetching products with variants:', error)
      throw error
    }
  },
)

export const allProductsWithVariantsQueryOptions = () =>
  queryOptions({
    queryKey: ['products', 'with-variants'],
    queryFn: () => fetchAllProductsWithVariants(),
  })

// ============ IMAGE UPLOAD UTILITIES ============
// Note: These use regular fetch instead of createServerFn because they need FormData

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

export type ProductVariantImage = {
  id: string
  productVariantId: string
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
  createdAt: string
  updatedAt: string
}

/**
 * Upload a single product image
 */
export const uploadProductImage = async (
  productId: string,
  file: File,
  options?: {
    altText?: string
    type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
    position?: number
  }
): Promise<ProductImage> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)

  if (options?.altText) formData.append('altText', options.altText)
  if (options?.type) formData.append('type', options.type)
  if (options?.position !== undefined) formData.append('position', options.position.toString())

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const response = await fetch(`${API_BASE_URL}/products/images/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for sending cookies
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload image')
  }

  return result.data
}

/**
 * Upload multiple product images
 */
export const uploadProductImages = async (
  productId: string,
  files: File[],
  options?: {
    altText?: string
  }
): Promise<ProductImage[]> => {
  const uploadPromises = files.map((file, index) =>
    uploadProductImage(productId, file, {
      altText: options?.altText,
      type: index === 0 ? 'hero' : 'gallery',
      position: index,
    })
  )

  const results = await Promise.allSettled(uploadPromises)

  const successful: ProductImage[] = []
  const failed: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push(`Image ${index + 1}: ${result.reason?.message || 'Unknown error'}`)
    }
  })

  if (failed.length > 0) {
    console.error('Some images failed to upload:', failed)
    if (successful.length === 0) {
      throw new Error(`All ${files.length} images failed to upload: ${failed.join(', ')}`)
    } else {
      throw new Error(`${failed.length} of ${files.length} images failed to upload: ${failed.join(', ')}`)
    }
  }

  return successful
}

/**
 * Upload a single variant image
 */
export const uploadVariantImage = async (
  variantId: string,
  file: File,
  options?: {
    altText?: string
    type?: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
    position?: number
  }
): Promise<ProductVariantImage> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productVariantId', variantId)

  if (options?.altText) formData.append('altText', options.altText)
  if (options?.type) formData.append('type', options.type)
  if (options?.position !== undefined) formData.append('position', options.position.toString())

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const response = await fetch(`${API_BASE_URL}/products/variants/images/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for sending cookies
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload variant image')
  }

  return result.data
}

/**
 * Upload multiple variant images
 * @param variantImagesMap - Map of variantId to array of Files
 */
export const uploadVariantImages = async (
  variantImagesMap: Map<string, File[]>
): Promise<ProductVariantImage[]> => {
  const uploadPromises: Promise<ProductVariantImage>[] = []

  variantImagesMap.forEach((files, variantId) => {
    files.forEach((file, index) => {
      uploadPromises.push(
        uploadVariantImage(variantId, file, {
          type: 'gallery',
          position: index,
        })
      )
    })
  })

  const results = await Promise.allSettled(uploadPromises)

  const successful: ProductVariantImage[] = []
  const failed: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push(`Variant image ${index + 1}: ${result.reason?.message || 'Unknown error'}`)
    }
  })

  if (failed.length > 0) {
    console.error('Some variant images failed to upload:', failed)
    if (successful.length === 0) {
      throw new Error(`All ${uploadPromises.length} variant images failed to upload: ${failed.join(', ')}`)
    } else {
      throw new Error(`${failed.length} of ${uploadPromises.length} variant images failed to upload: ${failed.join(', ')}`)
    }
  }

  return successful
}

/**
 * Get all images for a product
 */
export const fetchProductImages = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: productId }) => {
    console.info(`Fetching images for product ${productId}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: ProductImage[]
      }>(`/products/images/${productId}`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch product images')
    } catch (error) {
      console.error('Error fetching product images:', error)
      throw error
    }
  })

/**
 * Get all images for a variant
 */
export const fetchVariantImages = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: variantId }) => {
    console.info(`Fetching images for variant ${variantId}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: ProductVariantImage[]
      }>(`/products/variants/images/${variantId}`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch variant images')
    } catch (error) {
      console.error('Error fetching variant images:', error)
      throw error
    }
  })