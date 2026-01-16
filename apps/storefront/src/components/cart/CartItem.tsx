import { useState } from 'react'
import type { CartItem as CartItemType } from '~/types/cartTypes'
import { useCart } from '~/contexts/CartContext'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const product = item.productVariant.product
  const variant = item.productVariant
  const lineTotal = parseFloat(item.unitPrice) * item.quantity

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > variant.quantityInStock || isUpdating) {
      return
    }

    try {
      setIsUpdating(true)
      await updateItemQuantity(item.id, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    if (isRemoving) return

    try {
      setIsRemoving(true)
      await removeItem(item.id)
    } catch (error) {
      console.error('Failed to remove item:', error)
      setIsRemoving(false)
    }
  }

  return (
    <div
      className={`flex gap-4 pb-4 border-b border-gray-200 last:border-0 ${
        isRemoving ? 'opacity-50' : ''
      }`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">SKU: {variant.sku}</p>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="ml-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            aria-label="Remove item"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Quantity and Price */}
        <div className="flex items-end justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={item.quantity >= variant.quantityInStock || isUpdating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ${lineTotal.toFixed(2)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-500">
                ${parseFloat(item.unitPrice).toFixed(2)} each
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {item.quantity >= variant.quantityInStock && (
          <p className="text-xs text-amber-600 mt-1">
            Max available: {variant.quantityInStock}
          </p>
        )}
      </div>
    </div>
  )
}
