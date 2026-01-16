import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '~/components/ui/field'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import {
  createCustomer,
  createAddress,
} from '~/utils/customers'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/customers/create')({
  component: RouteComponent,
})

// Validation schemas (matching backend schemas)
const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone_number: z.string().min(7, 'Phone number must be at least 7 characters').max(20),
  is_guest: z.boolean(),
})

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().min(7).max(20),
  streetAddress: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().default('USA'),
  isDefault: z.boolean().default(true),
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createWithAddress, setCreateWithAddress] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      is_guest: false,
      // Address fields
      address_firstName: '',
      address_lastName: '',
      address_phoneNumber: '',
      streetAddress: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Validate customer data
        const customerData = customerSchema.parse({
          first_name: value.first_name,
          last_name: value.last_name,
          email: value.email,
          phone_number: value.phone_number,
          is_guest: value.is_guest,
        })

        console.log('Creating customer...', customerData)

        // Create customer
        const customer = await createCustomer({ data: customerData })

        console.log('Customer created:', customer)

        // Create address if enabled
        if (createWithAddress) {
          const addressData = addressSchema.parse({
            firstName: value.address_firstName || value.first_name,
            lastName: value.address_lastName || value.last_name,
            phoneNumber: value.address_phoneNumber || value.phone_number,
            streetAddress: value.streetAddress,
            apartment: value.apartment,
            city: value.city,
            state: value.state,
            postalCode: value.postalCode,
            country: value.country,
            isDefault: true,
          })

          console.log('Creating address...', addressData)

          await createAddress({
            data: {
              customerId: customer.id,
              ...addressData,
            },
          })

          toast.success('Customer and address created successfully!', {
            description: `${customer.first_name} ${customer.last_name} has been added with their address.`,
          })
        } else {
          toast.success('Customer created successfully!', {
            description: `${customer.first_name} ${customer.last_name} has been added to your database.`,
          })
        }

        // Invalidate customers query to refetch
        queryClient.invalidateQueries({ queryKey: ['customers'] })

        // Reset form
        form.reset()
        setCreateWithAddress(false)

        // Navigate to customers list
        setTimeout(() => {
          navigate({ to: '/customers' })
        }, 100)
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create customer', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6"
    >
      {/* Customer Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Customer</CardTitle>
          <CardDescription>
            Fill out the form below to add a new customer to your database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Name Field */}
          <form.Field
            name="first_name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'First name is required'
                }
                if (value.length > 100) {
                  return 'First name must be less than 100 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="first_name">First Name *</FieldLabel>
                <Input
                  id="first_name"
                  placeholder="e.g., John"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter the customer's first name.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Last Name Field */}
          <form.Field
            name="last_name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Last name is required'
                }
                if (value.length > 100) {
                  return 'Last name must be less than 100 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="last_name">Last Name *</FieldLabel>
                <Input
                  id="last_name"
                  placeholder="e.g., Doe"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter the customer's last name.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Email Field */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Email is required'
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(value)) {
                  return 'Invalid email address'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.doe@example.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter a valid email address.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Phone Number Field */}
          <form.Field
            name="phone_number"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Phone number is required'
                }
                if (value.length < 7) {
                  return 'Phone number must be at least 7 characters'
                }
                if (value.length > 20) {
                  return 'Phone number must be less than 20 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="phone_number">Phone Number *</FieldLabel>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="e.g., (555) 123-4567"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter the customer's phone number.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Guest Customer Checkbox */}
          <form.Field name="is_guest">
            {(field) => (
              <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="is_guest"
                  checked={field.state.value as boolean}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <div className="flex-1 space-y-1 leading-none">
                  <FieldLabel htmlFor="is_guest">Guest Customer</FieldLabel>
                  <FieldDescription>
                    Mark this as a guest customer (checkout without account).
                  </FieldDescription>
                </div>
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Address Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Address Information (Optional)</CardTitle>
          <CardDescription>
            Add a default address for this customer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle to enable address creation */}
          <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
            <Checkbox
              id="createWithAddress"
              checked={createWithAddress}
              onCheckedChange={(checked) => setCreateWithAddress(checked === true)}
            />
            <div className="flex-1 space-y-1 leading-none">
              <FieldLabel htmlFor="createWithAddress">Add Address</FieldLabel>
              <FieldDescription>
                Enable this to add a default address for the customer.
              </FieldDescription>
            </div>
          </div>

          {createWithAddress && (
            <>
              <Separator />

              {/* Address First Name */}
              <form.Field name="address_firstName">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="address_firstName">First Name</FieldLabel>
                    <Input
                      id="address_firstName"
                      placeholder="Leave blank to use customer's first name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>
                      Address first name (defaults to customer's first name if left blank).
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              {/* Address Last Name */}
              <form.Field name="address_lastName">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="address_lastName">Last Name</FieldLabel>
                    <Input
                      id="address_lastName"
                      placeholder="Leave blank to use customer's last name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>
                      Address last name (defaults to customer's last name if left blank).
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              {/* Address Phone Number */}
              <form.Field name="address_phoneNumber">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="address_phoneNumber">Phone Number</FieldLabel>
                    <Input
                      id="address_phoneNumber"
                      type="tel"
                      placeholder="Leave blank to use customer's phone number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>
                      Address phone number (defaults to customer's phone if left blank).
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              {/* Street Address */}
              <form.Field
                name="streetAddress"
                validators={{
                  onChange: ({ value }) => {
                    if (createWithAddress && (!value || value.trim().length === 0)) {
                      return 'Street address is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="streetAddress">Street Address *</FieldLabel>
                    <Input
                      id="streetAddress"
                      placeholder="e.g., 123 Main St"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Apartment/Suite */}
              <form.Field name="apartment">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="apartment">Apartment/Suite</FieldLabel>
                    <Input
                      id="apartment"
                      placeholder="e.g., Apt 4B"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>

              {/* City */}
              <form.Field
                name="city"
                validators={{
                  onChange: ({ value }) => {
                    if (createWithAddress && (!value || value.trim().length === 0)) {
                      return 'City is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="city">City *</FieldLabel>
                    <Input
                      id="city"
                      placeholder="e.g., New York"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                    )}
                  </Field>
                )}
              </form.Field>

              {/* State */}
              <form.Field
                name="state"
                validators={{
                  onChange: ({ value }) => {
                    if (createWithAddress && (!value || value.trim().length === 0)) {
                      return 'State is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="state">State *</FieldLabel>
                    <Input
                      id="state"
                      placeholder="e.g., NY"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Postal Code */}
              <form.Field
                name="postalCode"
                validators={{
                  onChange: ({ value }) => {
                    if (createWithAddress && (!value || value.trim().length === 0)) {
                      return 'Postal code is required'
                    }
                    if (value.length > 20) {
                      return 'Postal code must be less than 20 characters'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="postalCode">Postal Code *</FieldLabel>
                    <Input
                      id="postalCode"
                      placeholder="e.g., 10001"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Country */}
              <form.Field name="country">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="country">Country</FieldLabel>
                    <Input
                      id="country"
                      placeholder="e.g., USA"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => form.handleSubmit()}
              className="w-full sm:w-auto"
              disabled={!form.state.canSubmit || isSubmitting}
            >
              {isSubmitting
                ? 'Creating...'
                : createWithAddress
                  ? 'Create Customer with Address'
                  : 'Create Customer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                setCreateWithAddress(false)
              }}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
