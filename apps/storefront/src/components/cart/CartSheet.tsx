import { useEffect } from 'react'
import { useCart } from '~/contexts/CartContext'
import { CartItem } from './CartItem'

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const { cart, isLoading } = useCart()

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const subtotal = cart ? parseFloat(cart.subtotal) : 0
  const itemCount = cart?.items.length || 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25  z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Cart Sheet */}
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-100 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="cart-title" className="text-lg font-semibold text-gray-900">
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading cart...</div>
            </div>
          ) : itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="h-24 w-24 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Add items to get started
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart?.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Checkout Section */}
        {itemCount > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-4 bg-gray-50">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-500">
              Shipping and taxes calculated at checkout
            </p>

            {/* Checkout Button */}
            <a
              href="/checkout"
              className="block w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
            >
              Checkout
            </a>

            {/* Continue Shopping */}
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
