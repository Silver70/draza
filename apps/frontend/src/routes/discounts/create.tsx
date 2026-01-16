import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Percent, DollarSign, Store, Layers, Package, Tag, Boxes } from 'lucide-react'
import { FieldLabel } from '~/components/ui/field'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Switch } from '~/components/ui/switch'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useNavigate } from '@tanstack/react-router'
import { createDiscount } from '~/utils/discounts'
import type { CreateDiscountInput } from '~/types/discountTypes'

export const Route = createFileRoute('/discounts/create')({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

// Validation schema
const discountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive('Value must be greater than 0'),
  scope: z.enum(['store_wide', 'collection', 'product', 'variant', 'code']),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(1).max(999).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional().nullable(),
}).refine((data) => {
  // If discount type is percentage, value must be <= 100
  if (data.discountType === 'percentage' && data.value > 100) {
    return false
  }
  return true
}, {
  message: "Percentage discount cannot exceed 100%",
  path: ["value"],
})

function RouteComponent() {
  const navigate = useNavigate()

  // Form state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage')
  const [scope, setScope] = useState<'store_wide' | 'collection' | 'product' | 'variant' | 'code'>('store_wide')
  const [isActive, setIsActive] = useState(true)
  const [hasEndDate, setHasEndDate] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      discountType: 'percentage' as 'percentage' | 'fixed_amount',
      value: 10,
      scope: 'store_wide' as 'store_wide' | 'collection' | 'product' | 'variant' | 'code',
      isActive: true,
      priority: 10,
      startsAt: new Date().toISOString().slice(0, 16), // Default to now in datetime-local format
      endsAt: null as string | null,
    },
    onSubmit: async ({ value }) => {
      try {
        // Convert datetime-local format to ISO format with timezone
        const formData = {
          ...value,
          startsAt: value.startsAt ? new Date(value.startsAt).toISOString() : undefined,
          endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
        }

        const validatedData = discountSchema.parse(formData)

        console.log('Creating discount:', validatedData)

        const result = await createDiscount({ data: validatedData as CreateDiscountInput })

        toast.success('Discount created successfully!', {
          description: `${result.name} has been created.`,
        })

        // Navigate to discounts list
        setTimeout(() => {
          navigate({ to: '/discounts' })
        }, 100)
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create discount', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      }
    },
  })

  // Update form values when local state changes
  useEffect(() => {
    form.setFieldValue('discountType', discountType)
  }, [discountType])

  useEffect(() => {
    form.setFieldValue('scope', scope)
  }, [scope])

  useEffect(() => {
    form.setFieldValue('isActive', isActive)
  }, [isActive])

  // Get suggested priority based on scope
  const getSuggestedPriority = (selectedScope: typeof scope) => {
    switch (selectedScope) {
      case 'variant':
        return 150
      case 'product':
        return 100
      case 'collection':
        return 50
      case 'code':
        return 75
      case 'store_wide':
        return 10
      default:
        return 10
    }
  }

  // Update priority when scope changes
  useEffect(() => {
    const suggestedPriority = getSuggestedPriority(scope)
    form.setFieldValue('priority', suggestedPriority)
  }, [scope])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full max-w-7xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Discount</h1>
        <p className="text-muted-foreground">
          Create a new discount or promotional offer for your store.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the name and description for this discount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="name">Discount Name *</FieldLabel>
                <form.Field
                  name="name"
                  children={(field) => (
                    <Input
                      id="name"
                      placeholder="e.g., Summer Sale, Holiday Promo, VIP Discount"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
                <form.Field
                  name="description"
                  children={(field) => (
                    <Textarea
                      id="description"
                      placeholder="Add a description to help identify this discount..."
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Discount Type & Value */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Type & Value</CardTitle>
              <CardDescription>
                Choose whether this is a percentage or fixed amount discount, and set the value.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <FieldLabel>Discount Type *</FieldLabel>
                <RadioGroup value={discountType} onValueChange={(value) => setDiscountType(value as typeof discountType)}>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="percentage" id="type-percentage" />
                    <FieldLabel htmlFor="type-percentage" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Percentage</div>
                        <div className="text-xs text-muted-foreground">
                          Discount as a percentage of the price (e.g., 10% off)
                        </div>
                      </div>
                    </FieldLabel>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="fixed_amount" id="type-fixed" />
                    <FieldLabel htmlFor="type-fixed" className="flex items-center gap-2 cursor-pointer flex-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Fixed Amount</div>
                        <div className="text-xs text-muted-foreground">
                          Discount as a fixed dollar amount (e.g., $20 off)
                        </div>
                      </div>
                    </FieldLabel>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="value">
                  {discountType === 'percentage' ? 'Percentage Value *' : 'Dollar Amount *'}
                </FieldLabel>
                <div className="relative">
                  <form.Field
                    name="value"
                    children={(field) => (
                      <Input
                        id="value"
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? 100 : undefined}
                        step={discountType === 'percentage' ? '1' : '0.01'}
                        placeholder={discountType === 'percentage' ? '10' : '20.00'}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                        className="pr-12"
                      />
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {discountType === 'percentage' ? '%' : '$'}
                  </div>
                </div>
                {discountType === 'percentage' && (
                  <p className="text-xs text-muted-foreground">
                    Must be between 0 and 100
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. Discount Scope */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Scope</CardTitle>
              <CardDescription>
                Choose where this discount applies: entire store, specific collections, individual products, or via discount codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="store_wide" id="scope-store" />
                  <FieldLabel htmlFor="scope-store" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Store className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Store-wide</div>
                      <div className="text-xs text-muted-foreground">
                        Apply to all products in your store
                      </div>
                    </div>
                  </FieldLabel>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="collection" id="scope-collection" />
                  <FieldLabel htmlFor="scope-collection" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Collection</div>
                      <div className="text-xs text-muted-foreground">
                        Apply to specific collections (select after creating)
                      </div>
                    </div>
                  </FieldLabel>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="product" id="scope-product" />
                  <FieldLabel htmlFor="scope-product" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Package className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Product</div>
                      <div className="text-xs text-muted-foreground">
                        Apply to all variants of specific products
                      </div>
                    </div>
                  </FieldLabel>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="variant" id="scope-variant" />
                  <FieldLabel htmlFor="scope-variant" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Boxes className="h-4 w-4 text-teal-600" />
                    <div>
                      <div className="font-medium">Product Variant</div>
                      <div className="text-xs text-muted-foreground">
                        Apply to specific product variants (e.g., size, color)
                      </div>
                    </div>
                  </FieldLabel>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="code" id="scope-code" />
                  <FieldLabel htmlFor="scope-code" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Tag className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Discount Code</div>
                      <div className="text-xs text-muted-foreground">
                        Customers must enter a code to receive this discount
                      </div>
                    </div>
                  </FieldLabel>
                </div>
              </RadioGroup>

              {(scope === 'collection' || scope === 'product' || scope === 'variant' || scope === 'code') && (
                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {scope === 'code' && (
                      <>
                        <strong>Note:</strong> After creating this discount, you'll be able to generate and manage discount codes that customers can use at checkout.
                      </>
                    )}
                    {scope === 'collection' && (
                      <>
                        <strong>Note:</strong> After creating this discount, you'll be able to select which collections this discount applies to.
                      </>
                    )}
                    {scope === 'product' && (
                      <>
                        <strong>Note:</strong> After creating this discount, you'll be able to select which products this discount applies to.
                      </>
                    )}
                    {scope === 'variant' && (
                      <>
                        <strong>Note:</strong> After creating this discount, you'll be able to select which product variants this discount applies to.
                      </>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Settings & Summary */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">

          {/* 4. Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
              <CardDescription>
                Control when this discount is active and its priority.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Enable this discount immediately
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <FieldLabel htmlFor="priority">
                  Priority
                </FieldLabel>
                <form.Field
                  name="priority"
                  children={(field) => (
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="999"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 10)}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Higher priority discounts apply first. Suggested: {getSuggestedPriority(scope)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Set when this discount should start and optionally end.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="startsAt">Start Date & Time *</FieldLabel>
                <form.Field
                  name="startsAt"
                  children={(field) => (
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has-end-date"
                  checked={hasEndDate}
                  onChange={(e) => {
                    setHasEndDate(e.target.checked)
                    if (!e.target.checked) {
                      form.setFieldValue('endsAt', null)
                    }
                  }}
                  className="rounded"
                />
                <FieldLabel htmlFor="has-end-date" className="cursor-pointer">
                  Set an end date
                </FieldLabel>
              </div>

              {hasEndDate && (
                <div className="space-y-2">
                  <FieldLabel htmlFor="endsAt">End Date & Time</FieldLabel>
                  <form.Field
                    name="endsAt"
                    children={(field) => (
                      <Input
                        id="endsAt"
                        type="datetime-local"
                        value={field.state.value || ''}
                        onChange={(e) => field.handleChange(e.target.value || null)}
                      />
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium flex items-center gap-1">
                  {discountType === 'percentage' ? (
                    <>
                      <Percent className="h-3 w-3" /> Percentage
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-3 w-3" /> Fixed Amount
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scope:</span>
                <span className="font-medium capitalize">{scope.replace('_', '-')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-bold text-lg">
                  {discountType === 'percentage' ? `${form.state.values.value}%` : `$${form.state.values.value.toFixed(2)}`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                >
                  Create Discount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/discounts' })}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </form>
  )
}
