import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '~/components/ui/field'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { MultiSelect } from '~/components/ui/multi-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { Combobox } from '~/components/ui/combobox'
import {
  categoriesQueryOptions,
  attributesQueryOptions,
  createProduct,
  createProductWithVariants,
  previewVariants,
  createAttribute,
  addAttributeValue,
  type AttributeWithValues,
} from '~/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/products/create')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(attributesQueryOptions()),
    ])
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
})

// Validation schema (matches backend createProductSchema)
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  isActive: z.boolean(),
})

// Selected attribute with values for variant generation
type SelectedAttribute = {
  id: string // Unique ID for this selection (could be existing attribute ID or temp ID)
  attributeId: string // The actual attribute ID (existing or new)
  attributeName: string
  values: { id: string; value: string }[]
  isNew: boolean // Whether this is a newly created attribute
}

// Generated variant from preview
type PreviewVariant = {
  sku: string
  price: number
  quantityInStock: number
  attributeValueIds: string[]
  attributeDetails: Array<{
    attributeId: string
    attributeName: string
    value: string
  }>
}

// Helper function to generate slug from product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions())

  // State for managing variant attributes
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>([])
  const [defaultPrice, setDefaultPrice] = useState<number>(0)
  const [defaultQuantity, setDefaultQuantity] = useState<number>(0)
  const [createWithVariants, setCreateWithVariants] = useState<boolean>(false)

  // State for variant preview
  const [previewedVariants, setPreviewedVariants] = useState<PreviewVariant[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // State for adding new attributes
  const [newAttributeName, setNewAttributeName] = useState('')
  const [newAttributeValues, setNewAttributeValues] = useState<string[]>([''])
  const [isAddingNewAttribute, setIsAddingNewAttribute] = useState(false)

  // Transform categories to match MultiSelect expected format
  const categoryOptions = categories.map(category => ({
    label: category.name,
    value: category.id
  }))
  
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      isActive: true,
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using zod schema
        const validatedData = productSchema.parse(value)

        console.log('Product data:', validatedData)

        // Check if we should create with variants
        if (createWithVariants && previewedVariants.length > 0) {
          // Create product with pre-configured variants
          const variantsData = previewedVariants.map(v => ({
            sku: v.sku,
            price: v.price,
            quantityInStock: v.quantityInStock,
            attributeValueIds: v.attributeValueIds,
          }))

          console.log('Creating product with variants:', {
            product: validatedData,
            variants: variantsData,
          })

          const result = await createProductWithVariants({
            data: {
              product: validatedData,
              variants: variantsData,
            },
          })

          console.log('Product created successfully - full result:', result)
          console.log('Result type:', typeof result)
          console.log('Result keys:', Object.keys(result || {}))

          // Handle different response structures
          let productName = validatedData.name
          let variantCount = variantsData.length

          if (result && typeof result === 'object') {
            // Check if result has nested product
            if ('product' in result && result.product && typeof result.product === 'object' && 'name' in result.product) {
              productName = (result.product.name as string) || validatedData.name
            } else if ('name' in result && typeof result.name === 'string') {
              // Result is the product directly
              productName = result.name || validatedData.name
            }

            // Check for variant result
            if ('variantResult' in result && result.variantResult && typeof result.variantResult === 'object' && 'createdCount' in result.variantResult) {
              variantCount = (result.variantResult.createdCount as number) || variantsData.length
            }
          }

          toast.success('Product with variants created successfully!', {
            description: `${productName} has been created with ${variantCount} variants.`,
          })

          // Reset form state
          form.reset()
          setSelectedAttributes([])
          setDefaultPrice(0)
          setDefaultQuantity(0)
          setPreviewedVariants([])
          setCreateWithVariants(false)
          setNewAttributeName('')
          setNewAttributeValues([''])
          setIsAddingNewAttribute(false)

          // Navigate to products list
          setTimeout(() => {
            navigate({ to: '/inventory/products' })
          }, 100)
        } else {
          // Create product without variants (basic product)
          const newProduct = await createProduct({ data: validatedData })

          console.log('Product created successfully:', newProduct)

          toast.success('Product created successfully!', {
            description: `${newProduct.name} has been added to your inventory.`,
          })

          // Reset form state
          form.reset()

          // Navigate to products list
          setTimeout(() => {
            navigate({ to: '/inventory/products' })
          }, 100)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create product', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      }
    },
  })

  // Calculate the total number of variants that will be generated
  const calculateVariantCount = () => {
    if (selectedAttributes.length === 0) return 0
    return selectedAttributes.reduce((total, attr) => {
      return total * attr.values.length
    }, 1)
  }

  // Helper functions for managing attributes
  const handleAddExistingAttribute = (attributeId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    if (!attribute || !attribute.values) return

    const newAttr: SelectedAttribute = {
      id: attributeId,
      attributeId: attributeId,
      attributeName: attribute.name,
      values: attribute.values.map(v => ({ id: v.id, value: v.value })),
      isNew: false,
    }
    setSelectedAttributes([...selectedAttributes, newAttr])
  }

  const handleRemoveAttribute = (id: string) => {
    setSelectedAttributes(selectedAttributes.filter(attr => attr.id !== id))
  }

  const handleAddNewAttribute = async () => {
    if (!newAttributeName.trim()) {
      toast.error('Please enter an attribute name')
      return
    }

    const validValues = newAttributeValues.filter(v => v.trim().length > 0)
    if (validValues.length === 0) {
      toast.error('Please add at least one attribute value')
      return
    }

    try {
      // Create the attribute
      const newAttr = await createAttribute({ data: { name: newAttributeName } })

      // Add values to the attribute
      const createdValues: { id: string; value: string }[] = []
      for (const value of validValues) {
        const newValue = await addAttributeValue({
          data: { attributeId: newAttr.id, value },
        })
        createdValues.push({ id: newValue.id, value: newValue.value })
      }

      // Add to selected attributes
      const selectedAttr: SelectedAttribute = {
        id: newAttr.id,
        attributeId: newAttr.id,
        attributeName: newAttr.name,
        values: createdValues,
        isNew: true,
      }
      setSelectedAttributes([...selectedAttributes, selectedAttr])

      // Reset form
      setNewAttributeName('')
      setNewAttributeValues([''])
      setIsAddingNewAttribute(false)

      // Invalidate attributes query to refetch
      queryClient.invalidateQueries({ queryKey: ['attributes'] })

      toast.success('Attribute created successfully!')
    } catch (error) {
      console.error('Error creating attribute:', error)
      toast.error('Failed to create attribute')
    }
  }

  const handleAddValueField = () => {
    setNewAttributeValues([...newAttributeValues, ''])
  }

  const handleRemoveValueField = (index: number) => {
    setNewAttributeValues(newAttributeValues.filter((_, i) => i !== index))
  }

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...newAttributeValues]
    newValues[index] = value
    setNewAttributeValues(newValues)
  }

  // Generate variant preview
  const handleGeneratePreview = async () => {
    // Validate form first
    const productName = form.state.values.name
    if (!productName || productName.trim().length < 3) {
      toast.error('Please enter a valid product name first')
      return
    }

    if (selectedAttributes.length === 0) {
      toast.error('Please add at least one attribute')
      return
    }

    if (defaultPrice <= 0) {
      toast.error('Please enter a valid default price')
      return
    }

    setIsLoadingPreview(true)
    try {
      const productSlug = generateSlug(productName)
      const attributesForApi: AttributeWithValues[] = selectedAttributes.map(attr => ({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        values: attr.values,
      }))

      const variants = await previewVariants({
        data: {
          productSlug,
          attributes: attributesForApi,
          defaultPrice,
          defaultQuantity,
        },
      })

      setPreviewedVariants(variants)
      toast.success(`Generated ${variants.length} variant${variants.length === 1 ? '' : 's'}!`)
    } catch (error) {
      console.error('Error generating preview:', error)
      toast.error('Failed to generate variant preview')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Update variant price
  const handleVariantPriceChange = (index: number, newPrice: number) => {
    const updated = [...previewedVariants]
    updated[index]!.price = newPrice
    setPreviewedVariants(updated)
  }

  // Update variant quantity
  const handleVariantQuantityChange = (index: number, newQuantity: number) => {
    const updated = [...previewedVariants]
    updated[index]!.quantityInStock = newQuantity
    setPreviewedVariants(updated)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6"
    >
      {/* Basic Product Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Product</CardTitle>
          <CardDescription>
            Fill out the form below to add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Product Name Field */}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return 'Product name is required'
                  }
                  if (value.length < 3) {
                    return 'Product name must be at least 3 characters'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                  <Input
                    id="name"
                    placeholder="e.g., Wireless Headphones"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldDescription>
                    Enter a clear and descriptive name for your product.
                  </FieldDescription>
                  {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Description Field */}
            <form.Field
              name="description"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return 'Description is required'
                  }
                  if (value.length < 10) {
                    return 'Description must be at least 10 characters'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="description">Description *</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail..."
                    rows={5}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldDescription>
                    Provide a detailed description of the product, including key features and benefits.
                  </FieldDescription>
                  {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Category Select Field */}
            <form.Field
              name="categoryId"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return 'Please select a category'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="categoryId">Category *</FieldLabel>
                  <MultiSelect
                    options={categoryOptions}
                    selected={field.state.value ? [field.state.value] : []}
                    onChange={(selected) => field.handleChange(selected[0] || '')}
                    placeholder="Select a category..."
                  />
                  <FieldDescription>
                    Select the category that best describes your product.
                  </FieldDescription>
                  {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                  )}
                </Field>
              )}
            </form.Field>

          {/* Active Status Checkbox */}
          <form.Field name="isActive">
            {(field) => (
              <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="isActive"
                  checked={field.state.value as boolean}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <div className="flex-1 space-y-1 leading-none">
                  <FieldLabel htmlFor="isActive">Active Product</FieldLabel>
                  <FieldDescription>
                    Mark this product as active to make it available for sale immediately.
                  </FieldDescription>
                </div>
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Product Variants Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Product Variants (Optional)</CardTitle>
          <CardDescription>
            Add attributes like size, color, or material to generate product variants automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle to enable variant creation */}
          <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
            <Checkbox
              id="createWithVariants"
              checked={createWithVariants}
              onCheckedChange={(checked) => setCreateWithVariants(checked === true)}
            />
            <div className="flex-1 space-y-1 leading-none">
              <FieldLabel htmlFor="createWithVariants">Create Product with Variants</FieldLabel>
              <FieldDescription>
                Enable this to add attributes and automatically generate all variant combinations.
              </FieldDescription>
            </div>
          </div>

          {createWithVariants && (
            <>
              <Separator />

              {/* Default Price Input */}
              <div className="space-y-2">
                <FieldLabel htmlFor="defaultPrice">Default Price *</FieldLabel>
                <Input
                  id="defaultPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <FieldDescription>
                  This price will be applied to all variants by default. You can edit individual prices after preview.
                </FieldDescription>
              </div>

              {/* Default Quantity Input */}
              <div className="space-y-2">
                <FieldLabel htmlFor="defaultQuantity">Default Stock Quantity</FieldLabel>
                <Input
                  id="defaultQuantity"
                  type="number"
                  min="0"
                  value={defaultQuantity}
                  onChange={(e) => setDefaultQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <FieldDescription>
                  This quantity will be set for all variants by default. You can edit individual quantities after preview.
                </FieldDescription>
              </div>

              <Separator />

              {/* Add Existing Attribute */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Add Existing Attribute</h3>
                <Combobox
                  options={attributes
                    .filter(attr => !selectedAttributes.some(sa => sa.attributeId === attr.id))
                    .filter(attr => attr.values && attr.values.length > 0)
                    .map(attr => ({
                      value: attr.id,
                      label: `${attr.name} (${attr.values?.length || 0} values)`,
                      disabled: !attr.values || attr.values.length === 0
                    }))}
                  placeholder="Search and select an attribute..."
                  searchPlaceholder="Type to search attributes..."
                  emptyText="No attributes found. Create a new one below."
                  onSelect={(selectedId) => {
                    handleAddExistingAttribute(selectedId)
                  }}
                  triggerClassName="w-full"
                />
                {attributes.filter(attr => !selectedAttributes.some(sa => sa.attributeId === attr.id)).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No more attributes available. Create a new one below.
                  </p>
                )}
              </div>

              <Separator />

              {/* Create New Attribute */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Create New Attribute</h3>
                  {!isAddingNewAttribute && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingNewAttribute(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Attribute
                    </Button>
                  )}
                </div>

                {isAddingNewAttribute && (
                  <div className="border rounded-md p-4 space-y-4">
                    {/* Attribute Name */}
                    <div className="space-y-2">
                      <FieldLabel htmlFor="newAttributeName">Attribute Name</FieldLabel>
                      <Input
                        id="newAttributeName"
                        value={newAttributeName}
                        onChange={(e) => setNewAttributeName(e.target.value)}
                        placeholder="e.g., Size, Color, Material"
                      />
                    </div>

                    {/* Attribute Values */}
                    <div className="space-y-2">
                      <FieldLabel>Attribute Values</FieldLabel>
                      <div className="space-y-2">
                        {newAttributeValues.map((value, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={value}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              placeholder={`Value ${index + 1}`}
                            />
                            {newAttributeValues.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveValueField(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddValueField}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Value
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddNewAttribute}
                        size="sm"
                      >
                        Create Attribute
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingNewAttribute(false)
                          setNewAttributeName('')
                          setNewAttributeValues([''])
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Selected Attributes Display */}
              {selectedAttributes.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Selected Attributes</h3>
                      <Badge variant="default" className="text-xs">
                        {calculateVariantCount()} {calculateVariantCount() === 1 ? 'variant' : 'variants'} will be generated
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {selectedAttributes.map((attr) => (
                        <div key={attr.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{attr.attributeName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttribute(attr.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((value) => (
                              <Badge key={value.id} variant="secondary">
                                {value.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generate Preview Button */}
                  <Button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isLoadingPreview}
                    className="w-full"
                  >
                    {isLoadingPreview ? 'Generating Preview...' : 'Generate Variant Preview'}
                  </Button>

                  <Separator />
                </div>
              )}

              {/* Variant Preview Table */}
              {previewedVariants.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Variant Preview - Edit Prices & Quantities</h3>
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">SKU</th>
                              <th className="text-left p-3 text-sm font-medium">Attributes</th>
                              <th className="text-left p-3 text-sm font-medium w-32">Price</th>
                              <th className="text-left p-3 text-sm font-medium w-32">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewedVariants.map((variant, index) => (
                              <tr key={variant.sku} className="border-t">
                                <td className="p-3 text-sm font-mono">{variant.sku}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {variant.attributeDetails.map((attr) => (
                                      <Badge key={`${attr.attributeId}-${attr.value}`} variant="outline" className="text-xs">
                                        {attr.attributeName}: {attr.value}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => handleVariantPriceChange(index, parseFloat(e.target.value) || 0)}
                                    className="w-full"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.quantityInStock}
                                    onChange={(e) => handleVariantQuantityChange(index, parseInt(e.target.value) || 0)}
                                    className="w-full"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {previewedVariants.length} variant{previewedVariants.length === 1 ? '' : 's'} ready to create. You can edit prices and quantities above.
                    </p>
                  </div>

                  <Separator />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Actions - Placed at the end of the entire form */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => form.handleSubmit()}
              className="w-full sm:w-auto"
              disabled={!form.state.canSubmit || (createWithVariants && previewedVariants.length === 0)}
            >
              {createWithVariants && previewedVariants.length > 0
                ? `Create Product with ${previewedVariants.length} Variants`
                : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                setSelectedAttributes([])
                setDefaultPrice(0)
                setDefaultQuantity(0)
                setPreviewedVariants([])
                setCreateWithVariants(false)
                setNewAttributeName('')
                setNewAttributeValues([''])
                setIsAddingNewAttribute(false)
              }}
              className="w-full sm:w-auto"
            >
              Reset Form
            </Button>
          </div>
          {createWithVariants && previewedVariants.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              {selectedAttributes.length === 0
                ? 'Add at least one attribute and generate a preview to create variants, or uncheck "Create Product with Variants" to create a basic product.'
                : 'Click "Generate Variant Preview" to review and edit your variants before creating the product.'}
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
