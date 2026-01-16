import { useState } from 'react'
import type { ProductWithVariants, ProductVariant } from '~/types/productTypes'
import { VariantSelector } from './VariantSelector'
import { useCart } from '~/contexts/CartContext'

interface ProductInfoProps {
  product: ProductWithVariants
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem } = useCart()

  const handleQuantityChange = (newQuantity: number) => {
    if (!selectedVariant) return
    const max = selectedVariant.quantityInStock
    if (newQuantity >= 1 && newQuantity <= max) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedVariant || isAdding) return

    try {
      setIsAdding(true)
      await addItem(selectedVariant.id, quantity)
      // Reset quantity after successful add
      setQuantity(1)
      // Show success state
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const isInStock = selectedVariant && selectedVariant.quantityInStock > 0
  const price = selectedVariant ? parseFloat(selectedVariant.price) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Product Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
          {product.name}
        </h1>
      </div>

      {/* Price */}
      {selectedVariant && (
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          ${price.toFixed(2)}
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isInStock
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isInStock
              ? `${selectedVariant.quantityInStock} in stock`
              : 'Out of stock'}
          </span>
        </div>
      )}

      {/* Variant Selector */}
      {product.variants.length > 1 && (
        <VariantSelector
          variants={product.variants}
          selectedVariant={selectedVariant}
          onVariantSelect={setSelectedVariant}
        />
      )}

      {/* Quantity Selector */}
      {selectedVariant && isInStock && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Quantity
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={selectedVariant.quantityInStock}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="h-10 w-20 rounded-md border border-gray-300 bg-white text-center text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= selectedVariant.quantityInStock}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>
      )}

      {/* Add to Cart Button */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || !isInStock || isAdding || justAdded}
          className={`w-full rounded-lg px-8 py-4 text-base font-semibold transition-colors flex items-center justify-center gap-2 ${
            justAdded
              ? 'bg-green-600 hover:bg-green-600'
              : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
          } text-white disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {justAdded && (
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {!selectedVariant
            ? 'Select a variant'
            : !isInStock
              ? 'Out of Stock'
              : justAdded
                ? 'Added to Cart!'
                : isAdding
                  ? 'Adding...'
                  : 'Add to Cart'}
        </button>
      </div>

      {/* Description */}
      {product.description && (
        <div className="space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Description
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        </div>
      )}

      {/* Product Details */}
      {selectedVariant && (
        <div className="space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Product Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">SKU</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {selectedVariant.sku}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Availability</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {selectedVariant.quantityInStock > 0 ? 'In Stock' : 'Out of Stock'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
