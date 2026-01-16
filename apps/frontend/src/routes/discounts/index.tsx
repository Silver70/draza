import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { createColumns } from '@/components/discounts-columns'
import { useNavigate } from '@tanstack/react-router'
import { discountsQueryOptions, updateDiscount, deleteDiscount } from '@/utils/discounts'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Link } from '@tanstack/react-router'
import type { Discount } from '@/types/discountTypes'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute('/discounts/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(discountsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { data: discounts } = useSuspenseQuery(discountsQueryOptions())
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (discount: Discount) =>
      updateDiscount({
        data: {
          id: discount.id,
          data: { isActive: !discount.isActive },
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(
        variables.isActive ? "Discount deactivated" : "Discount activated",
        {
          description: `${variables.name} has been ${variables.isActive ? "deactivated" : "activated"} successfully.`,
        }
      )
    },
    onError: (error) => {
      toast.error(
        "Error",
        {
          description: error instanceof Error ? error.message : "Failed to update discount",
        }
      )
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (discountId: string) => deleteDiscount({ data: discountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success("Discount deleted", {
        description: "The discount has been deleted successfully.",
      })
      setDeleteDialogOpen(false)
      setDiscountToDelete(null)
    },
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete discount",
      })
    },
  })

  const handleCreateDiscount = () => {
    navigate({ to: '/discounts/create' })
  }

  const handleEdit = (discount: Discount) => {
    navigate({ to: `/discounts/${discount.id}/edit` })
  }

  const handleToggleActive = (discount: Discount) => {
    toggleActiveMutation.mutate(discount)
  }

  const handleDelete = (discount: Discount) => {
    setDiscountToDelete(discount)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (discountToDelete) {
      deleteMutation.mutate(discountToDelete.id)
    }
  }

  const handleDuplicate = (_discount: Discount) => {
    // TODO: Implement duplicate functionality
    toast.info("Coming soon", {
      description: "Duplicate discount functionality will be available soon.",
    })
  }

  const columns = createColumns({
    onEdit: handleEdit,
    onToggleActive: handleToggleActive,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
  })

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
        <p className="text-muted-foreground">
          Manage discount codes, promotions, and pricing rules
        </p>
      </div>

      {discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No discounts found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first discount or promotion.
            </p>
            <Link
              to="/discounts/create"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Create Discount
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={discounts}
          searchKey="name"
          searchPlaceholder="Search discounts..."
          onAddNew={handleCreateDiscount}
          addNewLabel="Create Discount"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the discount "{discountToDelete?.name}".
              This action cannot be undone.
              {discountToDelete?.scope === 'code' && (
                <span className="block mt-2 text-destructive">
                  All associated discount codes will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
