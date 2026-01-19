import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import apiClient from '~/lib/apiClient'
import {
  Discount,
  DiscountResponse,
  DiscountsResponse,
  DiscountWithDetails,
  DiscountWithDetailsResponse,
  DiscountCode,
  DiscountCodesResponse,
  DiscountCodeResponse,
  CreateDiscountInput,
  UpdateDiscountInput,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  AddProductsToDiscountInput,
  AddCollectionsToDiscountInput,
  AddVariantsToDiscountInput,
  ValidateDiscountCodeInput,
  ValidateCodeResponse,
  OrderDiscountsResponse,
  DiscountFilters,
} from '../types/discountTypes'

// ==================== DISCOUNTS ====================

/**
 * Fetch all discounts with optional filters
 */
export const fetchDiscounts = createServerFn({ method: 'GET' })
  .inputValidator((filters?: DiscountFilters) => filters)
  .handler(async ({ data }) => {
    console.info('Fetching discounts...', data)
    try {
      const params = new URLSearchParams()
      if (data?.scope) params.append('scope', data.scope)
      if (data?.isActive !== undefined)
        params.append('isActive', String(data.isActive))
      if (data?.search) params.append('search', data.search)

      const url = `/discounts${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiClient.get<DiscountsResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch discounts')
    } catch (error) {
      console.error('Error fetching discounts:', error)
      throw error
    }
  })

export const discountsQueryOptions = (filters?: DiscountFilters) =>
  queryOptions({
    queryKey: ['discounts', filters],
    queryFn: () => fetchDiscounts({ data: filters }),
  })

/**
 * Fetch active discounts only
 */
export const fetchActiveDiscounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching active discounts...')
    try {
      const response = await apiClient.get<DiscountsResponse>(
        `/discounts/active`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch active discounts')
    } catch (error) {
      console.error('Error fetching active discounts:', error)
      throw error
    }
  },
)

export const activeDiscountsQueryOptions = () =>
  queryOptions({
    queryKey: ['discounts', 'active'],
    queryFn: () => fetchActiveDiscounts(),
  })

/**
 * Fetch a single discount by ID
 */
export const fetchDiscount = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    console.info(`Fetching discount ${data}...`)
    try {
      const response = await apiClient.get<DiscountResponse>(
        `/discounts/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Discount not found')
    } catch (error) {
      console.error('Error fetching discount:', error)
      throw error
    }
  })

export const discountQueryOptions = (discountId: string) =>
  queryOptions({
    queryKey: ['discount', discountId],
    queryFn: () => fetchDiscount({ data: discountId }),
  })

/**
 * Fetch discount with full details (codes, products, collections)
 */
export const fetchDiscountWithDetails = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    console.info(`Fetching discount details ${data}...`)
    try {
      const response = await apiClient.get<DiscountWithDetailsResponse>(
        `/discounts/${data}/details`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Discount not found')
    } catch (error) {
      console.error('Error fetching discount details:', error)
      throw error
    }
  })

export const discountWithDetailsQueryOptions = (discountId: string) =>
  queryOptions({
    queryKey: ['discount', discountId, 'details'],
    queryFn: () => fetchDiscountWithDetails({ data: discountId }),
  })

/**
 * Create a new discount
 */
export const createDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateDiscountInput) => input)
  .handler(async ({ data }) => {
    console.info('Creating discount...', data)
    try {
      const response = await apiClient.post<DiscountResponse>(
        `/discounts`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create discount')
    } catch (error) {
      console.error('Error creating discount:', error)
      throw error
    }
  })

/**
 * Update a discount
 */
export const updateDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; data: UpdateDiscountInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Updating discount ${data.id}...`, data.data)
    try {
      const response = await apiClient.put<DiscountResponse>(
        `/discounts/${data.id}`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update discount')
    } catch (error) {
      console.error('Error updating discount:', error)
      throw error
    }
  })

/**
 * Delete a discount
 */
export const deleteDiscount = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    console.info(`Deleting discount ${data}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/discounts/${data}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to delete discount')
    } catch (error) {
      console.error('Error deleting discount:', error)
      throw error
    }
  })

// ==================== DISCOUNT CODES ====================

/**
 * Fetch codes for a discount
 */
export const fetchDiscountCodes = createServerFn({ method: 'GET' })
  .inputValidator((discountId: string) => discountId)
  .handler(async ({ data }) => {
    console.info(`Fetching codes for discount ${data}...`)
    try {
      const response = await apiClient.get<DiscountCodesResponse>(
        `/discounts/${data}/codes`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch discount codes')
    } catch (error) {
      console.error('Error fetching discount codes:', error)
      throw error
    }
  })

export const discountCodesQueryOptions = (discountId: string) =>
  queryOptions({
    queryKey: ['discount', discountId, 'codes'],
    queryFn: () => fetchDiscountCodes({ data: discountId }),
  })

/**
 * Create a discount code
 */
export const createDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; data: CreateDiscountCodeInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Creating code for discount ${data.discountId}...`, data.data)
    try {
      const response = await apiClient.post<DiscountCodeResponse>(
        `/discounts/${data.discountId}/codes`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create discount code')
    } catch (error) {
      console.error('Error creating discount code:', error)
      throw error
    }
  })

/**
 * Update a discount code
 */
export const updateDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((input: { codeId: string; data: UpdateDiscountCodeInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Updating discount code ${data.codeId}...`, data.data)
    try {
      const response = await apiClient.put<DiscountCodeResponse>(
        `/discounts/codes/${data.codeId}`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update discount code')
    } catch (error) {
      console.error('Error updating discount code:', error)
      throw error
    }
  })

/**
 * Delete a discount code
 */
export const deleteDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((codeId: string) => codeId)
  .handler(async ({ data }) => {
    console.info(`Deleting discount code ${data}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/discounts/codes/${data}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to delete discount code')
    } catch (error) {
      console.error('Error deleting discount code:', error)
      throw error
    }
  })

// ==================== PRODUCTS & COLLECTIONS ====================

/**
 * Add products to a discount
 */
export const addProductsToDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; data: AddProductsToDiscountInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Adding products to discount ${data.discountId}...`, data.data)
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/discounts/${data.discountId}/products`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add products to discount')
    } catch (error) {
      console.error('Error adding products to discount:', error)
      throw error
    }
  })

/**
 * Remove a product from a discount
 */
export const removeProductFromDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; productId: string }) => input)
  .handler(async ({ data }) => {
    console.info(`Removing product ${data.productId} from discount ${data.discountId}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/discounts/${data.discountId}/products/${data.productId}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to remove product from discount')
    } catch (error) {
      console.error('Error removing product from discount:', error)
      throw error
    }
  })

/**
 * Add collections to a discount
 */
export const addCollectionsToDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; data: AddCollectionsToDiscountInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Adding collections to discount ${data.discountId}...`, data.data)
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/discounts/${data.discountId}/collections`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add collections to discount')
    } catch (error) {
      console.error('Error adding collections to discount:', error)
      throw error
    }
  })

/**
 * Remove a collection from a discount
 */
export const removeCollectionFromDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; collectionId: string }) => input)
  .handler(async ({ data }) => {
    console.info(`Removing collection ${data.collectionId} from discount ${data.discountId}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/discounts/${data.discountId}/collections/${data.collectionId}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to remove collection from discount')
    } catch (error) {
      console.error('Error removing collection from discount:', error)
      throw error
    }
  })

// ==================== VARIANTS ====================

/**
 * Add variants to a discount
 */
export const addVariantsToDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; data: AddVariantsToDiscountInput }) => input)
  .handler(async ({ data }) => {
    console.info(`Adding variants to discount ${data.discountId}...`, data.data)
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/discounts/${data.discountId}/variants`,
        data.data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add variants to discount')
    } catch (error) {
      console.error('Error adding variants to discount:', error)
      throw error
    }
  })

/**
 * Remove a variant from a discount
 */
export const removeVariantFromDiscount = createServerFn({ method: 'POST' })
  .inputValidator((input: { discountId: string; variantId: string }) => input)
  .handler(async ({ data }) => {
    console.info(`Removing variant ${data.variantId} from discount ${data.discountId}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/discounts/${data.discountId}/variants/${data.variantId}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to remove variant from discount')
    } catch (error) {
      console.error('Error removing variant from discount:', error)
      throw error
    }
  })

// ==================== VALIDATION ====================

/**
 * Validate a discount code (customer-facing)
 */
export const validateDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((input: ValidateDiscountCodeInput) => input)
  .handler(async ({ data }) => {
    console.info('Validating discount code...', data.code)
    try {
      const response = await apiClient.post<ValidateCodeResponse>(
        `/discounts/validate-code`,
        data,
      )

      return response.data
    } catch (error: any) {
      console.error('Error validating discount code:', error)
      // Return the error response from backend
      if (error.data) {
        return error.data
      }
      throw error
    }
  })

// ==================== ORDER DISCOUNTS ====================

/**
 * Fetch applied discounts for an order
 */
export const fetchOrderDiscounts = createServerFn({ method: 'GET' })
  .inputValidator((orderId: string) => orderId)
  .handler(async ({ data }) => {
    console.info(`Fetching discounts for order ${data}...`)
    try {
      const response = await apiClient.get<OrderDiscountsResponse>(
        `/orders/${data}/discounts`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch order discounts')
    } catch (error) {
      console.error('Error fetching order discounts:', error)
      throw error
    }
  })

export const orderDiscountsQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order', orderId, 'discounts'],
    queryFn: () => fetchOrderDiscounts({ data: orderId }),
  })

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format discount value for display
 */
export const formatDiscountValue = (
  type: 'percentage' | 'fixed_amount',
  value: string | number,
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (type === 'percentage') {
    return `${numValue}%`
  }
  return `$${numValue.toFixed(2)}`
}

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (
  subtotal: number,
  type: 'percentage' | 'fixed_amount',
  value: string | number,
): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (type === 'percentage') {
    return (subtotal * numValue) / 100
  }
  return Math.min(numValue, subtotal)
}

/**
 * Generate a random discount code
 */
export const generateDiscountCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Check if discount is currently active based on dates
 */
export const isDiscountActive = (discount: Discount): boolean => {
  if (!discount.isActive) return false

  const now = new Date()
  const startsAt = new Date(discount.startsAt)
  const endsAt = discount.endsAt ? new Date(discount.endsAt) : null

  if (now < startsAt) return false
  if (endsAt && now > endsAt) return false

  return true
}

/**
 * Get discount status text
 */
export const getDiscountStatusText = (discount: Discount): string => {
  if (!discount.isActive) return 'Inactive'

  const now = new Date()
  const startsAt = new Date(discount.startsAt)
  const endsAt = discount.endsAt ? new Date(discount.endsAt) : null

  if (now < startsAt) return 'Scheduled'
  if (endsAt && now > endsAt) return 'Expired'

  return 'Active'
}

/**
 * Get discount scope display name
 */
export const getDiscountScopeLabel = (scope: string): string => {
  const labels: Record<string, string> = {
    store_wide: 'Store-wide',
    collection: 'Collection',
    product: 'Product',
    variant: 'Variant',
    code: 'Discount Code',
  }
  return labels[scope] || scope
}
