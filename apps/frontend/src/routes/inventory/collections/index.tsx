import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { columns } from '@/components/collections-columns'
import { collectionsWithProductCountQueryOptions } from '@/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { CreateCollectionModal } from '@/components/create-collection-modal'

export const Route = createFileRoute('/inventory/collections/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(collectionsWithProductCountQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})


function RouteComponent() {
  const { data: collections } = useSuspenseQuery(collectionsWithProductCountQueryOptions())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAddCollection = () => {
    setIsCreateModalOpen(true)
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
            <button
              onClick={handleAddCollection}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Add Collection
            </button>
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

      <CreateCollectionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  )
}
