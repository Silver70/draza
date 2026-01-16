import type { ProductVariant } from '~/types/productTypes'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantSelect: (variant: ProductVariant) => void
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) {
    return null
  }

  // If there's only one variant, auto-select it but don't show the selector
  if (variants.length === 1 && !selectedVariant) {
    onVariantSelect(variants[0])
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Select Variant
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id
          const isOutOfStock = variant.quantityInStock === 0

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onVariantSelect(variant)}
              disabled={isOutOfStock}
              className={`
                relative rounded-lg border px-4 py-3 text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'border-gray-900 bg-gray-900 text-white ring-2 ring-gray-900 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:ring-gray-100'
                    : isOutOfStock
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-gray-800 dark:bg-gray-950'
                      : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex flex-col gap-1">
                <span className="truncate">{variant.sku}</span>
                <span className="text-xs font-normal">
                  {isOutOfStock ? 'Out of Stock' : `${variant.quantityInStock} in stock`}
                </span>
              </div>
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-full rotate-[-20deg] bg-gray-400" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
