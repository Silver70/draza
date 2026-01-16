import { useState } from 'react'
import type { ProductImage } from '~/types/productTypes'

interface ImageGalleryProps {
  images?: ProductImage[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Placeholder image if no images are provided
  const placeholderImage = 'https://placehold.co/600x600/e5e7eb/9ca3af?text=No+Image'

  const displayImages =
    images && images.length > 0
      ? images.sort((a, b) => a.position - b.position)
      : [{ id: 0, url: placeholderImage, altText: productName, type: 'gallery' as const, position: 0, productId: 0 }]

  const selectedImage = displayImages[selectedImageIndex]

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
        <img
          src={selectedImage.url}
          alt={selectedImage.altText || productName}
          className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900 ring-2 transition-all ${
                selectedImageIndex === index
                  ? 'ring-gray-900 dark:ring-gray-100'
                  : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-700'
              }`}
            >
              <img
                src={image.url}
                alt={image.altText || `${productName} - Image ${index + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
