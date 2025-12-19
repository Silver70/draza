import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table'
import { columns } from '@/components/products-columns'
import { useNavigate } from '@tanstack/react-router'
import { productsQueryOptions } from '@/utils/products'

export const Route = createFileRoute('/inventory/products/')({
  component: RouteComponent,
  
  loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(productsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function PendingComponent() {
  return (
    <>
      <div className="space-y-2">
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded-lg" />
      </div>
    </>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-destructive/10 border-destructive/20">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Error loading products</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Failed to fetch products. Please try again later.'}
          </p>
        </div>
      </div>
    </>
  )
}

function RouteComponent() {
  const { data: products } = useSuspenseQuery(productsQueryOptions())
  const navigate = useNavigate()
  const handleAddProduct = () => {
    // TODO: Navigate to add product page or open modal
    navigate({ to: '/inventory/products/create' })
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first product.
            </p>
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
