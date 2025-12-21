import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { categoriesQueryOptions, createProduct } from '~/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/products/create')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(categoriesQueryOptions()),
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

type ProductFormData = z.infer<typeof productSchema>


function RouteComponent() {
  const navigate = useNavigate()
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())

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

        // Create product via API
        const newProduct = await createProduct({ data: validatedData })

        toast.success('Product created successfully!', {
          description: `${newProduct.name} has been added to your inventory.`,
        })

        // Navigate to products list
        navigate({ to: '/inventory/products' })
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create product', {
            description: 'Please try again later.',
          })
        }
      }
    },
  })

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Product</CardTitle>
          <CardDescription>
            Fill out the form below to add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-6"
          >
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

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Create Product
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                className="w-full sm:w-auto"
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
