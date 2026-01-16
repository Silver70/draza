import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Cart } from '~/types/cartTypes'
import * as cartApi from '~/utils/cart'

interface CartContextValue {
  cart: Cart | null
  isLoading: boolean
  itemCount: number
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_STORAGE_KEY = 'draza_cart_data'

// Cart persistence helpers
function saveCartToStorage(cart: Cart | null) {
  if (typeof window === 'undefined') return
  try {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } else {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error)
  }
}

function loadCartFromStorage(): Cart | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error)
    return null
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage for instant load
  const [cart, setCart] = useState<Cart | null>(() => loadCartFromStorage())
  const [isLoading, setIsLoading] = useState(true)

  // Calculate total item count
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cart)
  }, [cart])

  // Load cart from API on mount
  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    try {
      setIsLoading(true)
      const cartData = await cartApi.getCart()
      setCart(cartData)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addItem(variantId: string, quantity: number) {
    try {
      // For addItem, we call the API first since we need product data
      // But we don't block the UI - the operation happens in background
      const updatedCart = await cartApi.addToCart(variantId, quantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }

  async function updateItemQuantity(itemId: string, quantity: number) {
    if (!cart) return

    // Store previous cart for rollback
    const previousCart = cart

    try {
      // Optimistic update - update UI immediately
      const optimisticCart = {
        ...cart,
        items: cart.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      }

      // Recalculate totals optimistically (rough estimate)
      const item = cart.items.find((i) => i.id === itemId)
      if (item) {
        const oldItemTotal = parseFloat(item.unitPrice) * item.quantity
        const newItemTotal = parseFloat(item.unitPrice) * quantity
        const difference = newItemTotal - oldItemTotal

        optimisticCart.subtotal = (parseFloat(cart.subtotal) + difference).toFixed(2)
        optimisticCart.total = (parseFloat(cart.total) + difference).toFixed(2)
      }

      setCart(optimisticCart)

      // Call API in background
      const updatedCart = await cartApi.updateCartItemQuantity(itemId, quantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to update item quantity:', error)
      // Rollback on error
      setCart(previousCart)
      throw error
    }
  }

  async function removeItem(itemId: string) {
    if (!cart) return

    // Store previous cart for rollback
    const previousCart = cart

    try {
      // Optimistic update - update UI immediately
      const item = cart.items.find((i) => i.id === itemId)
      const optimisticCart = {
        ...cart,
        items: cart.items.filter((item) => item.id !== itemId),
      }

      // Recalculate totals optimistically
      if (item) {
        const itemTotal = parseFloat(item.unitPrice) * item.quantity
        optimisticCart.subtotal = (parseFloat(cart.subtotal) - itemTotal).toFixed(2)
        optimisticCart.total = (parseFloat(cart.total) - itemTotal).toFixed(2)
      }

      setCart(optimisticCart)

      // Call API in background
      const updatedCart = await cartApi.removeCartItem(itemId)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to remove item from cart:', error)
      // Rollback on error
      setCart(previousCart)
      throw error
    }
  }

  async function clearCart() {
    if (!cart) return

    // Store previous cart for rollback
    const previousCart = cart

    try {
      // Optimistic update
      setCart({ ...cart, items: [], subtotal: '0.00', total: '0.00' })

      // Call API in background
      const updatedCart = await cartApi.clearCart()
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to clear cart:', error)
      // Rollback on error
      setCart(previousCart)
      throw error
    }
  }

  async function applyDiscountCode(code: string) {
    try {
      const updatedCart = await cartApi.applyDiscountCode(code)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to apply discount code:', error)
      throw error
    }
  }

  async function removeDiscountCode() {
    try {
      const updatedCart = await cartApi.removeDiscountCode()
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to remove discount code:', error)
      throw error
    }
  }

  async function refreshCart() {
    await loadCart()
  }

  const value: CartContextValue = {
    cart,
    isLoading,
    itemCount,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyDiscountCode,
    removeDiscountCode,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
