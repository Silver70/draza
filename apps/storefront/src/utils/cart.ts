import axios from 'redaxios'
import type { Cart, CartResponse, AddToCartInput, UpdateCartItemInput, AddItemResponse } from '~/types/cartTypes'
import { getOrCreateSessionId } from './session'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Get or create a cart for the current session
 */
export async function getCart(customerId?: string): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.get<CartResponse>(`${API_BASE_URL}/cart`, {
    params: { sessionId, customerId },
  })

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to get cart')
  }

  return response.data.data
}

/**
 * Add an item to the cart
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  customerId?: string
): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.post<AddItemResponse>(`${API_BASE_URL}/cart/items`, {
    sessionId,
    customerId,
    variantId,
    quantity,
  })

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to add item to cart')
  }

  return response.data.data
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.put<CartResponse>(
    `${API_BASE_URL}/cart/items/${itemId}`,
    { sessionId, quantity }
  )

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to update cart item')
  }

  return response.data.data
}

/**
 * Remove an item from the cart
 */
export async function removeCartItem(itemId: string): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.delete<CartResponse>(
    `${API_BASE_URL}/cart/items/${itemId}`,
    {
      params: { sessionId },
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to remove cart item')
  }

  return response.data.data
}

/**
 * Clear all items from the cart
 */
export async function clearCart(): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.delete<CartResponse>(`${API_BASE_URL}/cart/clear`, {
    params: { sessionId },
  })

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to clear cart')
  }

  return response.data.data
}

/**
 * Apply a discount code to the cart
 */
export async function applyDiscountCode(code: string): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.post<CartResponse>(`${API_BASE_URL}/cart/discount`, {
    sessionId,
    code,
  })

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to apply discount code')
  }

  return response.data.data
}

/**
 * Remove discount code from the cart
 */
export async function removeDiscountCode(): Promise<Cart> {
  const sessionId = getOrCreateSessionId()

  const response = await axios.delete<CartResponse>(`${API_BASE_URL}/cart/discount`, {
    params: { sessionId },
  })

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to remove discount code')
  }

  return response.data.data
}
