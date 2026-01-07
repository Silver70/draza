import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useCart } from '~/contexts/CartContext'
import Container from '~/components/Container'
import clsx from 'clsx'
import { createOrder, getShippingMethods, type CreateOrderRequest } from '~/utils/order'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

// Validation schemas
const checkoutSchema = z.object({
  // Contact
  email: z.string().email('Please enter a valid email address'),

  // Shipping Address
  shippingFirstName: z.string().min(1, 'First name is required'),
  shippingLastName: z.string().min(1, 'Last name is required'),
  shippingAddress: z.string().min(1, 'Address is required'),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().min(1, 'City is required'),
  shippingState: z.string().min(1, 'State/Province is required'),
  shippingZip: z.string().min(1, 'ZIP/Postal code is required'),
  shippingCountry: z.string().min(1, 'Country is required'),
  shippingPhone: z.string().min(7, 'Phone number must be at least 7 characters').max(20, 'Phone number too long'),

  // Billing Address
  billingSameAsShipping: z.boolean(),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),

  // Shipping Method
  shippingMethodId: z.string().min(1, 'Please select a shipping method'),

  // Payment (placeholder)
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface ShippingMethod {
  id: string
  name: string
  description: string
  baseRate: string  // Note: backend uses baseRate, not baseCost
  isActive: boolean
}

function CheckoutPage() {
  const { cart, isLoading, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string
    total: string
  } | null>(null)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [loadingShipping, setLoadingShipping] = useState(true)
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      email: '',
      shippingFirstName: '',
      shippingLastName: '',
      shippingAddress: '',
      shippingAddress2: '',
      shippingCity: '',
      shippingState: '',
      shippingZip: '',
      shippingCountry: 'United States',
      shippingPhone: '',
      billingSameAsShipping: true,
      billingFirstName: '',
      billingLastName: '',
      billingAddress: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingZip: '',
      billingCountry: 'United States',
      shippingMethodId: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Validate using zod schema
        const validatedData = checkoutSchema.parse(value)
        console.log('Checkout data:', validatedData)

        // Prepare order request
        const orderRequest: CreateOrderRequest = {
          email: validatedData.email,
          firstName: validatedData.shippingFirstName,
          lastName: validatedData.shippingLastName,
          phone: validatedData.shippingPhone,
          shippingAddress: {
            streetAddress: validatedData.shippingAddress,
            apartment: validatedData.shippingAddress2,
            city: validatedData.shippingCity,
            state: validatedData.shippingState,
            postalCode: validatedData.shippingZip,
            country: validatedData.shippingCountry,
          },
          billingAddress: validatedData.billingSameAsShipping
            ? {
                streetAddress: validatedData.shippingAddress,
                apartment: validatedData.shippingAddress2,
                city: validatedData.shippingCity,
                state: validatedData.shippingState,
                postalCode: validatedData.shippingZip,
                country: validatedData.shippingCountry,
              }
            : {
                streetAddress: validatedData.billingAddress || '',
                apartment: validatedData.billingAddress2,
                city: validatedData.billingCity || '',
                state: validatedData.billingState || '',
                postalCode: validatedData.billingZip || '',
                country: validatedData.billingCountry || 'United States',
              },
          items: cart!.items.map((item) => ({
            productVariantId: item.productVariant.id,
            quantity: item.quantity,
          })),
          shippingMethodId: validatedData.shippingMethodId,
          discountCode: undefined, // TODO: Add discount code support
          notes: undefined,
        }

        console.log('Submitting order:', orderRequest)

        // Create order
        const result = await createOrder(orderRequest)

        if (!result.success) {
          throw new Error(result.error || 'Failed to create order')
        }

        console.log('Order created successfully:', result.data)

        // Clear the cart
        await clearCart()

        // Show success state
        setOrderSuccess({
          orderNumber: result.data?.orderNumber || '',
          total: result.data?.total || '0.00',
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Validation failed:', error.issues)
          alert('Please fix the form errors: ' + error.issues[0]?.message)
        } else {
          console.error('Checkout error:', error)
          alert('Failed to submit order: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Fetch shipping methods from backend
  useEffect(() => {
    async function loadShippingMethods() {
      try {
        setLoadingShipping(true)
        const methods = await getShippingMethods()
        console.log('Loaded shipping methods:', methods)
        setShippingMethods(methods)
      } catch (error) {
        console.error('Failed to load shipping methods:', error)
        // Show error to user
        alert('Failed to load shipping methods. Please refresh the page.')
      } finally {
        setLoadingShipping(false)
      }
    }

    loadShippingMethods()
  }, [])

  if (isLoading) {
    return (
      <Container>
        <div className="py-12 text-center">Loading checkout...</div>
      </Container>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container>
        <div className="py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <a href="/" className="text-blue-600 hover:underline">
            Continue Shopping
          </a>
        </div>
      </Container>
    )
  }

  // Show success screen if order was placed
  if (orderSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for your purchase</p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Order Number:</span>
              <span className="font-semibold text-gray-900">{orderSuccess.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-bold text-gray-900">${parseFloat(orderSuccess.total).toFixed(2)}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            A confirmation email has been sent to your email address.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
            >
              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>

                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'Email is required'
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return 'Please enter a valid email address'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={clsx(
                          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                          field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                        )}
                        placeholder="you@example.com"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </section>

              {/* Shipping Address */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

                <div className="space-y-4">
                  {/* First and Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field
                      name="shippingFirstName"
                      validators={{
                        onChange: ({ value }) =>
                          !value || value.trim().length === 0 ? 'First name is required' : undefined,
                      }}
                    >
                      {(field) => (
                        <div>
                          <label htmlFor="shippingFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            id="shippingFirstName"
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={clsx(
                              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                              field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                            )}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="shippingLastName"
                      validators={{
                        onChange: ({ value }) =>
                          !value || value.trim().length === 0 ? 'Last name is required' : undefined,
                      }}
                    >
                      {(field) => (
                        <div>
                          <label htmlFor="shippingLastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            id="shippingLastName"
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={clsx(
                              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                              field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                            )}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>

                  {/* Address */}
                  <form.Field name="shippingAddress">
                    {(field) => (
                      <div>
                        <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          id="shippingAddress"
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                          )}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  {/* Address Line 2 */}
                  <form.Field name="shippingAddress2">
                    {(field) => (
                      <div>
                        <label htmlFor="shippingAddress2" className="block text-sm font-medium text-gray-700 mb-1">
                          Apartment, suite, etc. (optional)
                        </label>
                        <input
                          id="shippingAddress2"
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </form.Field>

                  {/* City, State, ZIP */}
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <form.Field name="shippingCity">
                        {(field) => (
                          <div>
                            <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              id="shippingCity"
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={clsx(
                                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                              )}
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="col-span-2">
                      <form.Field name="shippingState">
                        {(field) => (
                          <div>
                            <label htmlFor="shippingState" className="block text-sm font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              id="shippingState"
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={clsx(
                                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                              )}
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="col-span-1">
                      <form.Field name="shippingZip">
                        {(field) => (
                          <div>
                            <label htmlFor="shippingZip" className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP
                            </label>
                            <input
                              id="shippingZip"
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={clsx(
                                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                              )}
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </div>

                  {/* Country */}
                  <form.Field name="shippingCountry">
                    {(field) => (
                      <div>
                        <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <select
                          id="shippingCountry"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                          )}
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                        </select>
                        {field.state.meta.errors.length > 0 && (
                          <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  {/* Phone */}
                  <form.Field
                    name="shippingPhone"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value.trim().length === 0) {
                          return 'Phone number is required'
                        }
                        if (value.length < 7) {
                          return 'Phone number must be at least 7 characters'
                        }
                        if (value.length > 20) {
                          return 'Phone number too long'
                        }
                        return undefined
                      },
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="shippingPhone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          id="shippingPhone"
                          type="tel"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            field.state.meta.errors.length > 0 ? 'border-red-500' : 'border-gray-300'
                          )}
                          placeholder="(555) 123-4567"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Shipping Method</h2>

                {loadingShipping ? (
                  <div className="text-center py-4 text-gray-500">Loading shipping methods...</div>
                ) : shippingMethods.length === 0 ? (
                  <div className="text-center py-4 text-red-600">No shipping methods available</div>
                ) : (
                  <form.Field name="shippingMethodId">
                    {(field) => (
                      <div className="space-y-2">
                        {shippingMethods.map((method) => (
                          <label
                            key={method.id}
                            className={clsx(
                              'flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors',
                              field.state.value === method.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:bg-gray-50'
                            )}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="shippingMethod"
                                value={method.id}
                                checked={field.state.value === method.id}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{method.name}</p>
                                <p className="text-sm text-gray-500">{method.description}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-gray-900">
                              ${method.baseRate && !isNaN(parseFloat(method.baseRate)) ? parseFloat(method.baseRate).toFixed(2) : '0.00'}
                            </span>
                          </label>
                        ))}
                        {field.state.meta.errors.length > 0 && (
                          <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                )}
              </section>

              {/* Payment (Placeholder) */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Payment</h2>

                <div className="border border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50">
                  <p className="text-gray-600">Payment integration placeholder</p>
                  <p className="text-sm text-gray-500 mt-1">Stripe/PayPal integration will go here</p>
                </div>
              </section>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Complete Order'}
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => {
                  const product = item.productVariant.product
                  const lineTotal = parseFloat(item.unitPrice) * item.quantity

                  return (
                    <div key={item.id} className="flex gap-4">
                      {/* Product Image */}
                      <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Quantity Badge */}
                        <div className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.productVariant.sku}</p>
                      </div>

                      {/* Price */}
                      <div className="text-sm font-medium text-gray-900">${lineTotal.toFixed(2)}</div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${parseFloat(cart.subtotal).toFixed(2)}</span>
                </div>

                <form.Subscribe selector={(state) => state.values.shippingMethodId}>
                  {(shippingMethodId) => {
                    const selectedMethod = shippingMethods.find((m) => m.id === shippingMethodId)
                    const shippingCost = selectedMethod?.baseRate && !isNaN(parseFloat(selectedMethod.baseRate))
                      ? parseFloat(selectedMethod.baseRate).toFixed(2)
                      : '0.00'

                    return selectedMethod ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">${shippingCost}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-500 text-xs">Select method</span>
                      </div>
                    )
                  }}
                </form.Subscribe>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">${parseFloat(cart.taxTotal || '0').toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <form.Subscribe selector={(state) => state.values.shippingMethodId}>
                    {(shippingMethodId) => {
                      const selectedMethod = shippingMethods.find((m) => m.id === shippingMethodId)
                      const shipping = selectedMethod?.baseRate && !isNaN(parseFloat(selectedMethod.baseRate))
                        ? parseFloat(selectedMethod.baseRate)
                        : 0
                      const total = parseFloat(cart.total) + shipping
                      return <span>${!isNaN(total) ? total.toFixed(2) : '0.00'}</span>
                    }}
                  </form.Subscribe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
