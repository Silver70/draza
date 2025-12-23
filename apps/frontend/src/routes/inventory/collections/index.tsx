import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table'
import { columns } from '@/components/collections-columns'
import { collectionsQueryOptions } from '@/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'

export const Route = createFileRoute('/inventory/collections/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(collectionsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})


function RouteComponent() {
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions())

  const handleAddCollection = () => {
    // TODO: Implement collection creation modal
    console.log('Add collection clicked - modal not yet implemented')
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
        <p className="text-muted-foreground">
          Manage your product collections
        </p>
      </div>
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No collections found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first collection.
            </p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={collections}
          searchKey="name"
          searchPlaceholder="Search collections..."
          onAddNew={handleAddCollection}
          addNewLabel="Add Collection"
        />
      )}
    </>
  )
}
