import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { columns } from '@/components/categories-columns'
import { categoriesWithProductCountQueryOptions } from '@/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { CreateCategoryModal } from '@/components/create-category-modal'

export const Route = createFileRoute('/inventory/categories/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
  queryClient.ensureQueryData(categoriesWithProductCountQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})


function RouteComponent() {
  const { data: categories } = useSuspenseQuery(categoriesWithProductCountQueryOptions())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAddCategory = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage your product categories
        </p>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No categories found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first category.
            </p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search categories..."
          onAddNew={handleAddCategory}
          addNewLabel="Add Category"
        />
      )}

      <CreateCategoryModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  )
}
