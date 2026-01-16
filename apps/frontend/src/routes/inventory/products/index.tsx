import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { createColumns } from '@/components/products-columns'
import { useNavigate } from '@tanstack/react-router'
import { productsQueryOptions } from '@/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Link } from '@tanstack/react-router'
import { ProductDetailsSheet } from '~/components/products/ProductDetailsSheet'
import type { Product } from '../../../types/productTypes'

export const Route = createFileRoute('/inventory/products/')({
  component: RouteComponent,
  
  loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(productsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})


function RouteComponent() {
  const { data: products } = useSuspenseQuery(productsQueryOptions())
  const navigate = useNavigate()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleAddProduct = () => {
    // TODO: Navigate to add product page or open modal
    navigate({ to: '/inventory/products/create' })
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setSheetOpen(true)
  }

  const columns = createColumns({
    onViewDetails: handleViewDetails,
  })


  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>

      <ProductDetailsSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first product.
            </p>
            <Link
              to="/inventory/products/create"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Add Product
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search products..."
          onAddNew={handleAddProduct}
          addNewLabel="Add Product"
        />
      )}
    </>
  )
}
