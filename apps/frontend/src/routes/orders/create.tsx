import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { X, Search, User, Package } from 'lucide-react'
import {
  FieldLabel,
  FieldDescription,
} from '~/components/ui/field'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { Combobox } from '~/components/ui/combobox'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  searchCustomers,
  fetchCustomerWithAddresses,
  type Customer,
  type Address
} from '~/utils/customers'
import {
  productsQueryOptions,
  fetchProductWithVariants,
} from '~/utils/products'
import { createOrder } from '~/utils/orders'

export const Route = createFileRoute('/orders/create')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(productsQueryOptions())
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
})

// Validation schema
const orderSchema = z.object({
  customerId: z.string().uuid('Please select a customer'),
  shippingAddressId: z.string().uuid('Please select a shipping address'),
  billingAddressId: z.string().uuid('Please select a billing address'),
  items: z.array(z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'Please add at least one item'),
  taxRate: z.number().min(0).max(1).optional(),
  shippingCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  notes: z.string().optional(),
})

// Order item type for display
type OrderItem = {
  id: string // temporary ID for UI
  productVariantId: string
  productName: string
  variantSku: string
  variantDetails: string
  unitPrice: number | string
  quantity: number
  availableStock: number
}

// Helper function to safely parse price to number
const parsePrice = (price: number | string): number => {
  return typeof price === 'number' ? price : parseFloat(String(price))
}

function RouteComponent() {
  const navigate = useNavigate()
  const { data: products } = useSuspenseQuery(productsQueryOptions())

  // Customer & Address State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([])
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([])
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('')
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>('')
  const [sameBillingAsShipping, setSameBillingAsShipping] = useState(true)

  // Order Items State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')

  // Order Details State
  const [taxRate, setTaxRate] = useState<number>(0)
  const [shippingCost, setShippingCost] = useState<string>('0.00')
  const [orderNotes, setOrderNotes] = useState<string>('')

  const form = useForm({
    defaultValues: {
      customerId: '',
      shippingAddressId: '',
      billingAddressId: '',
      items: [] as Array<{ productVariantId: string; quantity: number }>,
      taxRate: 0,
      shippingCost: '0.00',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const validatedData = orderSchema.parse(value)

        console.log('Creating order:', validatedData)

        const result = await createOrder({ data: validatedData })

        toast.success('Order created successfully!', {
          description: `Order ${result.orderNumber} has been created.`,
        })

        // Navigate to orders list
        setTimeout(() => {
          navigate({ to: '/orders' })
        }, 100)
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create order', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      }
    },
  })

  // Search customers when query changes
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (customerSearchQuery.length >= 2) {
        setIsSearchingCustomers(true)
        try {
          const results = await searchCustomers({ data: customerSearchQuery })
          setCustomerSearchResults(results)
        } catch (error) {
          console.error('Error searching customers:', error)
          setCustomerSearchResults([])
        } finally {
          setIsSearchingCustomers(false)
        }
      } else {
        setCustomerSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [customerSearchQuery])

  // Fetch customer addresses when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerWithAddresses({ data: selectedCustomer.id })
        .then((customerData) => {
          setCustomerAddresses(customerData.addresses)

          // Auto-select default address if available
          const defaultAddress = customerData.addresses.find(addr => addr.isDefault)
          if (defaultAddress) {
            setSelectedShippingAddress(defaultAddress.id)
            setSelectedBillingAddress(defaultAddress.id)
            form.setFieldValue('shippingAddressId', defaultAddress.id)
            form.setFieldValue('billingAddressId', defaultAddress.id)
          }
        })
        .catch((error) => {
          console.error('Error fetching addresses:', error)
          toast.error('Failed to load customer addresses')
        })
    }
  }, [selectedCustomer])

  // Update billing address when shipping changes and sameBillingAsShipping is true
  useEffect(() => {
    if (sameBillingAsShipping && selectedShippingAddress) {
      setSelectedBillingAddress(selectedShippingAddress)
      form.setFieldValue('billingAddressId', selectedShippingAddress)
    }
  }, [selectedShippingAddress, sameBillingAsShipping])

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + (parsePrice(item.unitPrice) * item.quantity)
    }, 0)
    const tax = subtotal * taxRate
    const shipping = parseFloat(shippingCost) || 0
    const total = subtotal + tax + shipping

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2),
    }
  }

  const totals = calculateTotals()

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    const customer = customerSearchResults.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      form.setFieldValue('customerId', customer.id)
      setCustomerSearchQuery('')
      setCustomerSearchResults([])
    }
  }

  // Handle removing customer
  const handleRemoveCustomer = () => {
    setSelectedCustomer(null)
    setCustomerAddresses([])
    setSelectedShippingAddress('')
    setSelectedBillingAddress('')
    form.setFieldValue('customerId', '')
    form.setFieldValue('shippingAddressId', '')
    form.setFieldValue('billingAddressId', '')
  }

  // Handle adding product to order
  const handleAddProduct = async (productId: string) => {
    try {
      const productData = await fetchProductWithVariants({ data: productId })

      if (!productData.variants || productData.variants.length === 0) {
        toast.error('This product has no available variants')
        return
      }

      // For now, add the first variant (in a real app, we'd show a variant selector)
      const variant = productData.variants[0]!

      // Check if already in order
      const existingItem = orderItems.find(item => item.productVariantId === variant.id)
      if (existingItem) {
        toast.info('Product already in order', {
          description: 'Please update the quantity of the existing item.',
        })
        return
      }

      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        productVariantId: variant.id,
        productName: productData.name,
        variantSku: variant.sku,
        variantDetails: '', // Would show attribute details here
        unitPrice: parsePrice(variant.price),
        quantity: 1,
        availableStock: typeof variant.quantity === 'number' ? variant.quantity : parseInt(String(variant.quantity)),
      }

      const updatedItems = [...orderItems, newItem]
      setOrderItems(updatedItems)

      // Update form value
      form.setFieldValue('items', updatedItems.map(item => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })))

      toast.success('Product added to order')
      setSelectedProductId('')
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  // Handle removing item from order
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = orderItems.filter(item => item.id !== itemId)
    setOrderItems(updatedItems)

    form.setFieldValue('items', updatedItems.map(item => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
    })))
  }

  // Handle updating item quantity
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const updatedItems = orderItems.map(item => {
      if (item.id === itemId) {
        // Validate against available stock
        if (newQuantity > item.availableStock) {
          toast.error('Insufficient stock', {
            description: `Only ${item.availableStock} units available.`,
          })
          return item
        }
        return { ...item, quantity: Math.max(1, newQuantity) }
      }
      return item
    })

    setOrderItems(updatedItems)

    form.setFieldValue('items', updatedItems.map(item => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
    })))
  }

  // Update form values when state changes
  useEffect(() => {
    form.setFieldValue('taxRate', taxRate)
  }, [taxRate])

  useEffect(() => {
    form.setFieldValue('shippingCost', shippingCost)
  }, [shippingCost])

  useEffect(() => {
    form.setFieldValue('notes', orderNotes)
  }, [orderNotes])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full max-w-5xl mx-auto py-8 px-4 space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new order for a customer.
        </p>
      </div>

      {/* 1. Customer Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Customer Information</CardTitle>
          </div>
          <CardDescription>
            Search and select the customer for this order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedCustomer ? (
            <div className="space-y-3">
              <FieldLabel htmlFor="customer-search">Search Customer *</FieldLabel>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-search"
                  placeholder="Search by name, email, or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearchingCustomers && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}

              {customerSearchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                  {customerSearchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer.id)}
                      className="w-full p-3 text-left hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                        {customer.is_guest && (
                          <Badge variant="secondary" className="ml-2 text-xs">Guest</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.phone_number}</div>
                    </button>
                  ))}
                </div>
              )}

              {customerSearchQuery.length >= 2 && !isSearchingCustomers && customerSearchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No customers found. Try a different search term.
                </p>
              )}
            </div>
          ) : (
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-lg">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                    {selectedCustomer.is_guest && (
                      <Badge variant="secondary" className="ml-2">Guest</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{selectedCustomer.email}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer.phone_number}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCustomer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Shipping & Billing Addresses */}
      {selectedCustomer && customerAddresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping & Billing Addresses</CardTitle>
            <CardDescription>
              Select the addresses for shipping and billing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shipping Address */}
            <div className="space-y-2">
              <FieldLabel htmlFor="shipping-address">Shipping Address *</FieldLabel>
              <Combobox
                options={customerAddresses.map(addr => ({
                  value: addr.id,
                  label: `${addr.streetAddress}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}${addr.isDefault ? ' (Default)' : ''}`,
                }))}
                value={selectedShippingAddress}
                onSelect={(value) => {
                  setSelectedShippingAddress(value)
                  form.setFieldValue('shippingAddressId', value)
                }}
                placeholder="Select shipping address..."
                searchPlaceholder="Search addresses..."
                emptyText="No addresses found."
                triggerClassName="w-full"
              />
            </div>

            {/* Same as Shipping Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="same-billing"
                checked={sameBillingAsShipping}
                onChange={(e) => setSameBillingAsShipping(e.target.checked)}
                className="rounded"
              />
              <FieldLabel htmlFor="same-billing" className="cursor-pointer">
                Billing address same as shipping
              </FieldLabel>
            </div>

            {/* Billing Address */}
            {!sameBillingAsShipping && (
              <div className="space-y-2">
                <FieldLabel htmlFor="billing-address">Billing Address *</FieldLabel>
                <Combobox
                  options={customerAddresses.map(addr => ({
                    value: addr.id,
                    label: `${addr.streetAddress}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}${addr.isDefault ? ' (Default)' : ''}`,
                  }))}
                  value={selectedBillingAddress}
                  onSelect={(value) => {
                    setSelectedBillingAddress(value)
                    form.setFieldValue('billingAddressId', value)
                  }}
                  placeholder="Select billing address..."
                  searchPlaceholder="Search addresses..."
                  emptyText="No addresses found."
                  triggerClassName="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Order Items</CardTitle>
          </div>
          <CardDescription>
            Search and add products to this order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Search */}
          <div className="space-y-2">
            <FieldLabel htmlFor="product-search">Add Product</FieldLabel>
            <div className="flex gap-2">
              <Combobox
                options={products.map(product => ({
                  value: product.id,
                  label: product.name,
                }))}
                value={selectedProductId}
                onSelect={(value) => {
                  handleAddProduct(value)
                }}
                placeholder="Search products..."
                searchPlaceholder="Type to search..."
                emptyText="No products found."
                triggerClassName="flex-1"
              />
            </div>
          </div>

          <Separator />

          {/* Order Items List */}
          {orderItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No items added yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Search and add products to start the order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground font-mono">{item.variantSku}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        ${parsePrice(item.unitPrice).toFixed(2)} each
                        {item.availableStock < 10 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Only {item.availableStock} in stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">×</span>
                      </div>
                      <div className="text-right min-w-20">
                        <div className="font-medium">
                          ${(parsePrice(item.unitPrice) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Configure tax, shipping, and add notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tax Rate */}
            <div className="space-y-2">
              <FieldLabel htmlFor="tax-rate">Tax Rate (%)</FieldLabel>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate * 100}
                onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                placeholder="0.00"
              />
              <FieldDescription>
                Enter tax rate as a percentage (e.g., 8 for 8%)
              </FieldDescription>
            </div>

            {/* Shipping Cost */}
            <div className="space-y-2">
              <FieldLabel htmlFor="shipping-cost">Shipping Cost ($)</FieldLabel>
              <Input
                id="shipping-cost"
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
              />
              <FieldDescription>
                Enter shipping cost in dollars
              </FieldDescription>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <FieldLabel htmlFor="notes">Order Notes (Optional)</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              rows={3}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(2)}%):</span>
              <span className="font-medium">${totals.tax}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">${totals.shipping}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${totals.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                !selectedCustomer ||
                !selectedShippingAddress ||
                !selectedBillingAddress ||
                orderItems.length === 0
              }
            >
              Create Order
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/orders' })}
            >
              Cancel
            </Button>
          </div>
          {(!selectedCustomer || !selectedShippingAddress || orderItems.length === 0) && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Please complete all required fields to create the order.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
