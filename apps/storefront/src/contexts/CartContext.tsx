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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate total item count
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  // Load cart on mount
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
      const updatedCart = await cartApi.addToCart(variantId, quantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }

  async function updateItemQuantity(itemId: string, quantity: number) {
    try {
      const updatedCart = await cartApi.updateCartItemQuantity(itemId, quantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to update item quantity:', error)
      throw error
    }
  }

  async function removeItem(itemId: string) {
    try {
      const updatedCart = await cartApi.removeCartItem(itemId)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to remove item from cart:', error)
      throw error
    }
  }

  async function clearCart() {
    try {
      const updatedCart = await cartApi.clearCart()
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to clear cart:', error)
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
