import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import apiClient from '~/lib/apiClient'
import {
  CartResponse,
  CartsResponse,
  CartMetricsResponse,
  CartTotalsResponse,
  ApplyDiscountResponse,
  CheckoutResponse,
  AddItemToCartInput,
  UpdateCartItemInput,
  ApplyDiscountCodeInput,
  CalculateCartTotalsInput,
  CheckoutInput,
  MergeCartsInput,
  AbandonedCartsFilters,
} from '../types/cartTypes'

// ==================== CART OPERATIONS ====================

/**
 * Get or create cart by sessionId
 */
export const fetchCart = createServerFn({ method: 'GET' })
  .inputValidator((d: { sessionId: string; customerId?: string }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching cart...', data)
    try {
      const params = new URLSearchParams()
      params.append('sessionId', data.sessionId)
      if (data.customerId) params.append('customerId', data.customerId)

      const response = await apiClient.get<CartResponse>(
        `/cart?${params.toString()}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch cart')
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  })

export const cartQueryOptions = (sessionId: string, customerId?: string) =>
  queryOptions({
    queryKey: ['cart', sessionId, customerId],
    queryFn: () => fetchCart({ data: { sessionId, customerId } }),
  })

/**
 * Add item to cart
 */
export const addItemToCart = createServerFn({ method: 'POST' })
  .inputValidator((d: AddItemToCartInput) => d)
  .handler(async ({ data }) => {
    console.info('Adding item to cart...', data)
    try {
      const response = await apiClient.post<CartResponse>(
        `/cart/items`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add item to cart')
    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error
    }
  })

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = createServerFn({ method: 'POST' })
  .inputValidator((d: { itemId: string; input: UpdateCartItemInput }) => d)
  .handler(async ({ data }) => {
    console.info('Updating cart item quantity...', data)
    try {
      const response = await apiClient.put<CartResponse>(
        `/cart/items/${data.itemId}`,
        data.input,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update cart item')
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  })

/**
 * Remove item from cart
 */
export const removeCartItem = createServerFn({ method: 'POST' })
  .inputValidator((d: { itemId: string; sessionId: string }) => d)
  .handler(async ({ data }) => {
    console.info('Removing cart item...', data)
    try {
      const response = await apiClient.delete<CartResponse>(
        `/cart/items/${data.itemId}?sessionId=${data.sessionId}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to remove cart item')
    } catch (error) {
      console.error('Error removing cart item:', error)
      throw error
    }
  })

/**
 * Clear cart
 */
export const clearCart = createServerFn({ method: 'POST' })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    console.info('Clearing cart...', data)
    try {
      const response = await apiClient.delete<CartResponse>(
        `/cart/clear?sessionId=${data.sessionId}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to clear cart')
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  })

// ==================== DISCOUNT OPERATIONS ====================

/**
 * Apply discount code to cart
 */
export const applyDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((d: ApplyDiscountCodeInput) => d)
  .handler(async ({ data }) => {
    console.info('Applying discount code...', data)
    try {
      const response = await apiClient.post<ApplyDiscountResponse>(
        `/cart/discount`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to apply discount code')
    } catch (error) {
      console.error('Error applying discount code:', error)
      throw error
    }
  })

/**
 * Remove discount code from cart
 */
export const removeDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    console.info('Removing discount code...', data)
    try {
      const response = await apiClient.delete<CartResponse>(
        `/cart/discount?sessionId=${data.sessionId}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to remove discount code')
    } catch (error) {
      console.error('Error removing discount code:', error)
      throw error
    }
  })

// ==================== CALCULATION ====================

/**
 * Calculate cart totals with tax and shipping preview
 */
export const calculateCartTotals = createServerFn({ method: 'POST' })
  .inputValidator((d: CalculateCartTotalsInput) => d)
  .handler(async ({ data }) => {
    console.info('Calculating cart totals...', data)
    try {
      const response = await apiClient.post<CartTotalsResponse>(
        `/cart/calculate`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to calculate cart totals')
    } catch (error) {
      console.error('Error calculating cart totals:', error)
      throw error
    }
  })

// ==================== CHECKOUT ====================

/**
 * Checkout - convert cart to order
 */
export const checkoutCart = createServerFn({ method: 'POST' })
  .inputValidator((d: CheckoutInput) => d)
  .handler(async ({ data }) => {
    console.info('Checking out cart...', data)
    try {
      const response = await apiClient.post<CheckoutResponse>(
        `/cart/checkout`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Checkout failed')
    } catch (error) {
      console.error('Error during checkout:', error)
      throw error
    }
  })

// ==================== CART MERGING ====================

/**
 * Merge guest cart into user cart
 */
export const mergeGuestCart = createServerFn({ method: 'POST' })
  .inputValidator((d: MergeCartsInput) => d)
  .handler(async ({ data }) => {
    console.info('Merging guest cart...', data)
    try {
      const response = await apiClient.post<CartResponse>(
        `/cart/merge`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to merge carts')
    } catch (error) {
      console.error('Error merging carts:', error)
      throw error
    }
  })

// ==================== ADMIN OPERATIONS ====================

/**
 * Fetch all active carts (admin)
 */
export const fetchActiveCarts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching active carts...')
    try {
      const response = await apiClient.get<CartsResponse>(
        `/cart/admin/active`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch active carts')
    } catch (error) {
      console.error('Error fetching active carts:', error)
      throw error
    }
  },
)

export const activeCartsQueryOptions = () =>
  queryOptions({
    queryKey: ['carts', 'active'],
    queryFn: () => fetchActiveCarts(),
  })

/**
 * Fetch abandoned carts (admin)
 */
export const fetchAbandonedCarts = createServerFn({ method: 'GET' })
  .inputValidator((d?: AbandonedCartsFilters) => d)
  .handler(async ({ data }) => {
    console.info('Fetching abandoned carts...', data)
    try {
      const params = new URLSearchParams()
      if (data?.hoursAgo) params.append('hoursAgo', data.hoursAgo.toString())
      if (data?.minValue) params.append('minValue', data.minValue.toString())

      const queryString = params.toString()
      const url = `/cart/admin/abandoned${queryString ? `?${queryString}` : ''}`

      const response = await apiClient.get<CartsResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch abandoned carts')
    } catch (error) {
      console.error('Error fetching abandoned carts:', error)
      throw error
    }
  })

export const abandonedCartsQueryOptions = (filters?: AbandonedCartsFilters) =>
  queryOptions({
    queryKey: ['carts', 'abandoned', filters],
    queryFn: () => fetchAbandonedCarts({ data: filters }),
  })

/**
 * Fetch cart metrics for dashboard (admin)
 */
export const fetchCartMetrics = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching cart metrics...')
    try {
      const response = await apiClient.get<CartMetricsResponse>(
        `/cart/admin/metrics`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch cart metrics')
    } catch (error) {
      console.error('Error fetching cart metrics:', error)
      throw error
    }
  },
)

export const cartMetricsQueryOptions = () =>
  queryOptions({
    queryKey: ['cart', 'metrics'],
    queryFn: () => fetchCartMetrics(),
  })
