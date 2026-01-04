import { createFileRoute, Link } from '@tanstack/react-router'
import { productWithVariantsQueryOptions } from '~/utils/product'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ImageGallery } from '~/components/product/ImageGallery'
import { ProductInfo } from '~/components/product/ProductInfo'

export const Route = createFileRoute('/products/$slug')({
  component: ProductDetailPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(productWithVariantsQueryOptions(params.slug))
  },
})

function ProductDetailPage() {
  const { slug } = Route.useParams()
  const { data: product } = useSuspenseQuery(productWithVariantsQueryOptions(slug))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-2 text-sm">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>
      </main>
    </div>
  )
}
