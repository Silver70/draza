import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Copy, RefreshCw } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { FieldLabel } from '~/components/ui/field'
import { Switch } from '~/components/ui/switch'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useNavigate } from '@tanstack/react-router'
import {
  discountQueryOptions,
  discountCodesQueryOptions,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  generateDiscountCode,
  formatDiscountValue,
} from '~/utils/discounts'
import type { DiscountCode, CreateDiscountCodeInput } from '~/types/discountTypes'

export const Route = createFileRoute('/discounts/$discountId/codes')({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(discountQueryOptions(params.discountId)),
      queryClient.ensureQueryData(discountCodesQueryOptions(params.discountId)),
    ])
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { discountId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: discount } = useSuspenseQuery(discountQueryOptions(discountId))
  const { data: codes } = useSuspenseQuery(discountCodesQueryOptions(discountId))

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null)

  // Form state for create/edit
  const [code, setCode] = useState('')
  const [usageLimit, setUsageLimit] = useState<number | null>(null)
  const [minimumOrderValue, setMinimumOrderValue] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(true)

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDiscountCodeInput) =>
      createDiscountCode({
        data: {
          discountId,
          data,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'codes'] })
      toast.success('Code created', {
        description: 'Discount code has been created successfully.',
      })
      setCreateDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to create code',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { codeId: string; data: CreateDiscountCodeInput }) =>
      updateDiscountCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'codes'] })
      toast.success('Code updated', {
        description: 'Discount code has been updated successfully.',
      })
      setEditDialogOpen(false)
      setSelectedCode(null)
      resetForm()
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update code',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (codeId: string) => deleteDiscountCode({ data: codeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'codes'] })
      toast.success('Code deleted', {
        description: 'Discount code has been deleted successfully.',
      })
      setDeleteDialogOpen(false)
      setSelectedCode(null)
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to delete code',
      })
    },
  })

  const resetForm = () => {
    setCode('')
    setUsageLimit(null)
    setMinimumOrderValue(null)
    setIsActive(true)
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (discountCode: DiscountCode) => {
    setSelectedCode(discountCode)
    setCode(discountCode.code)
    setUsageLimit(discountCode.usageLimit)
    setMinimumOrderValue(
      discountCode.minimumOrderValue ? parseFloat(discountCode.minimumOrderValue) : null
    )
    setIsActive(discountCode.isActive)
    setEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (discountCode: DiscountCode) => {
    setSelectedCode(discountCode)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    if (!code.trim()) {
      toast.error('Code required', {
        description: 'Please enter a discount code.',
      })
      return
    }

    createMutation.mutate({
      code: code.toUpperCase(),
      usageLimit: usageLimit || undefined,
      minimumOrderValue: minimumOrderValue || undefined,
      isActive,
    })
  }

  const handleUpdate = () => {
    if (!selectedCode) return

    if (!code.trim()) {
      toast.error('Code required', {
        description: 'Please enter a discount code.',
      })
      return
    }

    updateMutation.mutate({
      codeId: selectedCode.id,
      data: {
        code: code.toUpperCase(),
        usageLimit: usageLimit || undefined,
        minimumOrderValue: minimumOrderValue || undefined,
        isActive,
      },
    })
  }

  const handleDelete = () => {
    if (selectedCode) {
      deleteMutation.mutate(selectedCode.id)
    }
  }

  const handleGenerateCode = () => {
    const newCode = generateDiscountCode(8)
    setCode(newCode)
  }

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText)
    toast.success('Copied!', {
      description: 'Code copied to clipboard.',
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: `/discounts/${discountId}/edit` })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discount
        </Button>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Discount Codes</h1>
            <p className="text-muted-foreground">
              Manage codes for "{discount.name}" ({formatDiscountValue(discount.discountType, discount.value)} off)
            </p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {codes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No discount codes yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first code to get started
                </p>
                <Button onClick={handleOpenCreateDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          codes.map((discountCode) => (
            <Card key={discountCode.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold font-mono bg-muted px-2 py-1 rounded">
                        {discountCode.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(discountCode.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant={discountCode.isActive ? 'default' : 'secondary'}>
                    {discountCode.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span className="font-medium">
                      {discountCode.usageCount}
                      {discountCode.usageLimit ? ` / ${discountCode.usageLimit}` : ' (unlimited)'}
                    </span>
                  </div>

                  {discountCode.minimumOrderValue && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min. Order:</span>
                      <span className="font-medium">
                        ${parseFloat(discountCode.minimumOrderValue).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit && (
                    <Badge variant="destructive" className="w-full justify-center">
                      Limit Reached
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(discountCode)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(discountCode)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
            <DialogDescription>
              Create a new redeemable code for this discount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="code">Code *</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="SUMMER2024"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateCode}
                  title="Generate random code"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Letters and numbers only, automatically converted to uppercase
              </p>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="usageLimit">Usage Limit (Optional)</FieldLabel>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                value={usageLimit || ''}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times this code can be used
              </p>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="minimumOrderValue">Minimum Order Value (Optional)</FieldLabel>
              <Input
                id="minimumOrderValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={minimumOrderValue || ''}
                onChange={(e) =>
                  setMinimumOrderValue(e.target.value ? parseFloat(e.target.value) : null)
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum order subtotal required to use this code
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FieldLabel htmlFor="isActive">Active</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Enable this code for use
                </p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
            <DialogDescription>
              Update the settings for this discount code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="edit-code">Code *</FieldLabel>
              <Input
                id="edit-code"
                placeholder="SUMMER2024"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="edit-usageLimit">Usage Limit (Optional)</FieldLabel>
              <Input
                id="edit-usageLimit"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                value={usageLimit || ''}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : null)}
              />
              {selectedCode && (
                <p className="text-xs text-muted-foreground">
                  Current usage: {selectedCode.usageCount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="edit-minimumOrderValue">Minimum Order Value (Optional)</FieldLabel>
              <Input
                id="edit-minimumOrderValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={minimumOrderValue || ''}
                onChange={(e) =>
                  setMinimumOrderValue(e.target.value ? parseFloat(e.target.value) : null)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FieldLabel htmlFor="edit-isActive">Active</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Enable this code for use
                </p>
              </div>
              <Switch id="edit-isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the discount code "{selectedCode?.code}".
              This action cannot be undone.
              {selectedCode && selectedCode.usageCount > 0 && (
                <span className="block mt-2 text-destructive">
                  This code has been used {selectedCode.usageCount} time(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
