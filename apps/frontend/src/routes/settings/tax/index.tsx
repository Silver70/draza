import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Combobox } from '~/components/ui/combobox'
import { FieldLabel } from '~/components/ui/field'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { ConfirmDeleteDialog } from '~/components/ConfirmDeleteDialog'
import {
  allTaxJurisdictionsQueryOptions,
  createTaxJurisdiction,
  updateTaxJurisdiction,
  deleteTaxJurisdiction,
  activateTaxJurisdiction,
  deactivateTaxJurisdiction,
} from '~/utils/tax'
import { getTaxSettings, saveTaxSettings, TaxCalculationMode } from '~/utils/taxSettings'
import type { TaxJurisdiction, CreateTaxJurisdictionInput, JurisdictionType } from '~/types/taxTypes'
import { Pencil, Trash2, Plus } from 'lucide-react'

export const Route = createFileRoute('/settings/tax/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(allTaxJurisdictionsQueryOptions())
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { data: jurisdictions } = useSuspenseQuery(allTaxJurisdictionsQueryOptions())

  // Tax Settings State
  const [calculationMode, setCalculationMode] = useState<TaxCalculationMode>('automatic')
  const [defaultJurisdictionId, setDefaultJurisdictionId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJurisdiction, setEditingJurisdiction] = useState<TaxJurisdiction | null>(null)

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [jurisdictionToDelete, setJurisdictionToDelete] = useState<TaxJurisdiction | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const settings = getTaxSettings()
    setCalculationMode(settings.calculationMode)
    if (settings.defaultJurisdictionId) {
      setDefaultJurisdictionId(settings.defaultJurisdictionId)
    }
  }, [])

  const handleSaveSettings = () => {
    setIsSaving(true)
    try {
      saveTaxSettings({
        calculationMode,
        defaultJurisdictionId: calculationMode === 'default_jurisdiction' ? defaultJurisdictionId || null : null,
      })
      toast.success('Tax settings saved successfully')
    } catch (error) {
      toast.error('Failed to save tax settings', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedJurisdiction = jurisdictions.find(j => j.id === defaultJurisdictionId)
  const activeJurisdictions = jurisdictions.filter(j => j.isActive)

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTaxJurisdiction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-jurisdictions'] })
      setIsDialogOpen(false)
      toast.success('Tax jurisdiction created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create tax jurisdiction', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateTaxJurisdiction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-jurisdictions'] })
      setIsDialogOpen(false)
      setEditingJurisdiction(null)
      toast.success('Tax jurisdiction updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update tax jurisdiction', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTaxJurisdiction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-jurisdictions'] })
      setIsDeleteDialogOpen(false)
      setJurisdictionToDelete(null)
      toast.success('Tax jurisdiction deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete tax jurisdiction', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    },
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (jurisdiction: TaxJurisdiction) => {
      if (jurisdiction.isActive) {
        return await deactivateTaxJurisdiction({ data: jurisdiction.id })
      } else {
        return await activateTaxJurisdiction({ data: jurisdiction.id })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-jurisdictions'] })
      toast.success('Tax jurisdiction status updated')
    },
    onError: (error) => {
      toast.error('Failed to update status', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    },
  })

  const handleEdit = (jurisdiction: TaxJurisdiction) => {
    setEditingJurisdiction(jurisdiction)
    setIsDialogOpen(true)
  }

  const handleDelete = (jurisdiction: TaxJurisdiction) => {
    setJurisdictionToDelete(jurisdiction)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (jurisdictionToDelete) {
      deleteMutation.mutate({ data: jurisdictionToDelete.id })
    }
  }

  const handleOpenDialog = () => {
    setEditingJurisdiction(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Tax Calculation Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Calculation Mode</CardTitle>
          <CardDescription>
            Choose how tax should be calculated for orders. Automatic mode calculates tax based on the shipping address, while default jurisdiction mode applies a single tax rate to all orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={calculationMode} onValueChange={(value) => setCalculationMode(value as TaxCalculationMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="automatic" />
              <Label htmlFor="automatic" className="font-normal cursor-pointer">
                Automatic (based on shipping address)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default_jurisdiction" id="default_jurisdiction" />
              <Label htmlFor="default_jurisdiction" className="font-normal cursor-pointer">
                Use Default Jurisdiction
              </Label>
            </div>
          </RadioGroup>

          {calculationMode === 'default_jurisdiction' && (
            <div className="space-y-2 pt-2">
              <FieldLabel htmlFor="default-jurisdiction">Default Tax Jurisdiction</FieldLabel>
              <Combobox
                options={activeJurisdictions.map(jurisdiction => ({
                  value: jurisdiction.id,
                  label: `${jurisdiction.name} - ${(parseFloat(jurisdiction.rate) * 100).toFixed(2)}%`,
                }))}
                value={defaultJurisdictionId}
                onSelect={(value) => setDefaultJurisdictionId(value)}
                placeholder="Select a tax jurisdiction..."
                searchPlaceholder="Search jurisdictions..."
                emptyText="No active jurisdictions found."
                triggerClassName="w-full"
              />

              {selectedJurisdiction && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-1">
                    <div className="font-medium">{selectedJurisdiction.name}</div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <Badge variant="outline" className="capitalize">{selectedJurisdiction.type}</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Rate:</span>{' '}
                      {(parseFloat(selectedJurisdiction.rate) * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Country:</span> {selectedJurisdiction.country}
                    </div>
                    {selectedJurisdiction.stateCode && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">State:</span> {selectedJurisdiction.stateCode}
                      </div>
                    )}
                    {selectedJurisdiction.description && (
                      <div className="text-sm text-muted-foreground pt-1">
                        {selectedJurisdiction.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            {calculationMode === 'default_jurisdiction' && defaultJurisdictionId && (
              <Button
                variant="outline"
                onClick={() => {
                  setDefaultJurisdictionId('')
                  saveTaxSettings({ defaultJurisdictionId: null })
                  toast.success('Default jurisdiction cleared')
                }}
              >
                Clear Default
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Jurisdictions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Jurisdictions</CardTitle>
              <CardDescription>
                Manage tax jurisdictions for different locations. These are used for automatic tax calculation.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Jurisdiction
                </Button>
              </DialogTrigger>
              <TaxJurisdictionDialog
                jurisdiction={editingJurisdiction}
                onSubmit={(data) => {
                  if (editingJurisdiction) {
                    updateMutation.mutate({ data: { id: editingJurisdiction.id, ...data } })
                  } else {
                    createMutation.mutate({ data })
                  }
                }}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurisdictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tax jurisdictions found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  jurisdictions.map((jurisdiction) => (
                    <TableRow key={jurisdiction.id}>
                      <TableCell className="font-medium">{jurisdiction.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {jurisdiction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{(parseFloat(jurisdiction.rate) * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {jurisdiction.stateCode || jurisdiction.country}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={jurisdiction.isActive}
                          onCheckedChange={() => toggleActiveMutation.mutate(jurisdiction)}
                          disabled={toggleActiveMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(jurisdiction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(jurisdiction)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Tax Jurisdiction"
        itemName={jurisdictionToDelete?.name}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}

// Tax Jurisdiction Dialog Component
function TaxJurisdictionDialog({
  jurisdiction,
  onSubmit,
  isSubmitting,
}: {
  jurisdiction: TaxJurisdiction | null
  onSubmit: (data: CreateTaxJurisdictionInput) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<CreateTaxJurisdictionInput>({
    name: '',
    type: 'state',
    country: 'USA',
    rate: 0,
    isActive: true,
  })

  useEffect(() => {
    if (jurisdiction) {
      setFormData({
        name: jurisdiction.name,
        type: jurisdiction.type,
        country: jurisdiction.country,
        stateCode: jurisdiction.stateCode || undefined,
        countyName: jurisdiction.countyName || undefined,
        cityName: jurisdiction.cityName || undefined,
        rate: parseFloat(jurisdiction.rate),
        effectiveFrom: jurisdiction.effectiveFrom,
        effectiveTo: jurisdiction.effectiveTo || undefined,
        isActive: jurisdiction.isActive,
        description: jurisdiction.description || undefined,
      })
    } else {
      setFormData({
        name: '',
        type: 'state',
        country: 'USA',
        rate: 0,
        isActive: true,
      })
    }
  }, [jurisdiction])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{jurisdiction ? 'Edit Tax Jurisdiction' : 'Create Tax Jurisdiction'}</DialogTitle>
        <DialogDescription>
          {jurisdiction ? 'Update the tax jurisdiction details below.' : 'Add a new tax jurisdiction for automatic tax calculation.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="name">Name *</FieldLabel>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., California State Tax"
              required
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="type">Type *</FieldLabel>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as JurisdictionType })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="rate">Tax Rate * (0-1)</FieldLabel>
            <Input
              id="rate"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
              placeholder="e.g., 0.0725 for 7.25%"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter as decimal (e.g., 0.0725 = 7.25%)
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="USA"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="stateCode">State Code</FieldLabel>
            <Input
              id="stateCode"
              value={formData.stateCode || ''}
              onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
              placeholder="e.g., CA"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="countyName">County Name</FieldLabel>
            <Input
              id="countyName"
              value={formData.countyName || ''}
              onChange={(e) => setFormData({ ...formData, countyName: e.target.value })}
              placeholder="e.g., Los Angeles"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="cityName">City Name</FieldLabel>
            <Input
              id="cityName"
              value={formData.cityName || ''}
              onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
              placeholder="e.g., San Francisco"
            />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description or notes"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Active
          </Label>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : jurisdiction ? 'Update Jurisdiction' : 'Create Jurisdiction'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
