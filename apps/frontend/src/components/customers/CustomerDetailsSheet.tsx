import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { User, Loader2, MapPin, ShoppingBag, Mail, Phone, Edit, Trash2, Plus, Check } from 'lucide-react'
import type { Customer, Address } from '~/types/customerTypes'
import {
  customerWithAddressesQueryOptions,
  customerOrdersQueryOptions,
  customerOrderStatsQueryOptions,
  updateCustomer,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  createAddress,
} from '~/utils/customers'
import { Suspense } from 'react'
import { CustomerFormFields } from './CustomerFormFields'
import { AddressFormFields } from './AddressFormFields'

type CustomerDetailsSheetProps = {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CustomerEditForm({ customer, onCancel, onSuccess }: { customer: Customer; onCancel: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] })
      toast.success('Customer updated successfully!')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to update customer', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    },
  })

  const form = useForm({
    defaultValues: {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone_number: customer.phone_number,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        await updateMutation.mutateAsync({
          data: {
            id: customer.id,
            ...value,
          },
        })
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
      className="space-y-4"
    >
      <form.Field
        name="first_name"
        validators={{
          onChange: ({ value }) => {
            if (!value || value.trim().length === 0) return 'First name is required'
            if (value.length > 100) return 'First name must be less than 100 characters'
            return undefined
          },
        }}
      >
        {(firstNameField) => (
          <form.Field
            name="last_name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) return 'Last name is required'
                if (value.length > 100) return 'Last name must be less than 100 characters'
                return undefined
              },
            }}
          >
            {(lastNameField) => (
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Email is required'
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(value)) return 'Invalid email address'
                    return undefined
                  },
                }}
              >
                {(emailField) => (
                  <form.Field
                    name="phone_number"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value.trim().length === 0) return 'Phone number is required'
                        if (value.length < 7) return 'Phone number must be at least 7 characters'
                        if (value.length > 20) return 'Phone number must be less than 20 characters'
                        return undefined
                      },
                    }}
                  >
                    {(phoneNumberField) => (
                      <CustomerFormFields
                        firstNameField={firstNameField}
                        lastNameField={lastNameField}
                        emailField={emailField}
                        phoneNumberField={phoneNumberField}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}
          </form.Field>
        )}
      </form.Field>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.state.canSubmit || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

function AddressEditDialog({
  address,
  customerId,
  open,
  onOpenChange,
}: {
  address: Address
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateMutation = useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      toast.success('Address updated successfully!')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to update address', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    },
  })

  const form = useForm({
    defaultValues: {
      firstName: address.firstName,
      lastName: address.lastName,
      phoneNumber: address.phoneNumber,
      streetAddress: address.streetAddress,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        await updateMutation.mutateAsync({
          data: {
            addressId: address.id,
            ...value,
            apartment: value.apartment || null,
          },
        })
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
          <DialogDescription>Update the address information below.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="firstName"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) return 'First name is required'
                if (value.length > 100) return 'First name must be less than 100 characters'
                return undefined
              },
            }}
          >
            {(firstNameField) => (
              <form.Field name="lastName" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Last name is required' : value.length > 100 ? 'Last name must be less than 100 characters' : undefined }}>
                {(lastNameField) => (
                  <form.Field name="phoneNumber" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Phone number is required' : value.length < 7 ? 'Phone number must be at least 7 characters' : value.length > 20 ? 'Phone number must be less than 20 characters' : undefined }}>
                    {(phoneNumberField) => (
                      <form.Field name="streetAddress" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Street address is required' : undefined }}>
                        {(streetAddressField) => (
                          <form.Field name="apartment">
                            {(apartmentField) => (
                              <form.Field name="city" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'City is required' : undefined }}>
                                {(cityField) => (
                                  <form.Field name="state" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'State is required' : undefined }}>
                                    {(stateField) => (
                                      <form.Field name="postalCode" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Postal code is required' : value.length > 20 ? 'Postal code must be less than 20 characters' : undefined }}>
                                        {(postalCodeField) => (
                                          <form.Field name="country">
                                            {(countryField) => (
                                              <AddressFormFields
                                                firstNameField={firstNameField}
                                                lastNameField={lastNameField}
                                                phoneNumberField={phoneNumberField}
                                                streetAddressField={streetAddressField}
                                                apartmentField={apartmentField}
                                                cityField={cityField}
                                                stateField={stateField}
                                                postalCodeField={postalCodeField}
                                                countryField={countryField}
                                              />
                                            )}
                                          </form.Field>
                                        )}
                                      </form.Field>
                                    )}
                                  </form.Field>
                                )}
                              </form.Field>
                            )}
                          </form.Field>
                        )}
                      </form.Field>
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}
          </form.Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.state.canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddressCreateDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      toast.success('Address created successfully!')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to create address', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    },
  })

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
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
        await createMutation.mutateAsync({
          data: {
            customerId,
            ...value,
            apartment: value.apartment || null,
          },
        })
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>Create a new address for this customer.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="firstName"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) return 'First name is required'
                if (value.length > 100) return 'First name must be less than 100 characters'
                return undefined
              },
            }}
          >
            {(firstNameField) => (
              <form.Field name="lastName" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Last name is required' : value.length > 100 ? 'Last name must be less than 100 characters' : undefined }}>
                {(lastNameField) => (
                  <form.Field name="phoneNumber" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Phone number is required' : value.length < 7 ? 'Phone number must be at least 7 characters' : value.length > 20 ? 'Phone number must be less than 20 characters' : undefined }}>
                    {(phoneNumberField) => (
                      <form.Field name="streetAddress" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Street address is required' : undefined }}>
                        {(streetAddressField) => (
                          <form.Field name="apartment">
                            {(apartmentField) => (
                              <form.Field name="city" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'City is required' : undefined }}>
                                {(cityField) => (
                                  <form.Field name="state" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'State is required' : undefined }}>
                                    {(stateField) => (
                                      <form.Field name="postalCode" validators={{ onChange: ({ value }) => !value || value.trim().length === 0 ? 'Postal code is required' : value.length > 20 ? 'Postal code must be less than 20 characters' : undefined }}>
                                        {(postalCodeField) => (
                                          <form.Field name="country">
                                            {(countryField) => (
                                              <AddressFormFields
                                                firstNameField={firstNameField}
                                                lastNameField={lastNameField}
                                                phoneNumberField={phoneNumberField}
                                                streetAddressField={streetAddressField}
                                                apartmentField={apartmentField}
                                                cityField={cityField}
                                                stateField={stateField}
                                                postalCodeField={postalCodeField}
                                                countryField={countryField}
                                              />
                                            )}
                                          </form.Field>
                                        )}
                                      </form.Field>
                                    )}
                                  </form.Field>
                                )}
                              </form.Field>
                            )}
                          </form.Field>
                        )}
                      </form.Field>
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}
          </form.Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.state.canSubmit || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Address'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomerDetailsContent({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient()
  const { data: customerWithAddresses } = useSuspenseQuery(
    customerWithAddressesQueryOptions(customerId)
  )
  const { data: orders = [] } = useQuery(customerOrdersQueryOptions(customerId))
  const { data: orderStats } = useQuery(customerOrderStatsQueryOptions(customerId))

  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null)
  const [isCreatingAddress, setIsCreatingAddress] = useState(false)

  const addresses = customerWithAddresses.addresses || []

  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      toast.success('Address deleted successfully!')
      setDeletingAddress(null)
    },
    onError: (error) => {
      toast.error('Failed to delete address', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      toast.success('Default address updated!')
    },
    onError: (error) => {
      toast.error('Failed to set default address', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    },
  })

  const averageOrderValue = orderStats && orderStats.totalOrders > 0
    ? parseFloat(orderStats.totalSpent as any) / orderStats.totalOrders
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Customer Information</CardTitle>
            {!isEditingCustomer && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingCustomer(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingCustomer ? (
            <CustomerEditForm
              customer={customerWithAddresses}
              onCancel={() => setIsEditingCustomer(false)}
              onSuccess={() => setIsEditingCustomer(false)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customerWithAddresses.email}</span>
                </div>
                {customerWithAddresses.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customerWithAddresses.phone_number}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customerWithAddresses.is_guest
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                >
                  {customerWithAddresses.is_guest ? 'Guest' : 'Registered'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Member since:</span>
                <span className="text-sm font-medium">
                  {new Date(customerWithAddresses.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Stats */}
      {orderStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Statistics</CardTitle>
            <CardDescription>Customer purchase history summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.totalOrders || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${orderStats.totalSpent ? parseFloat(orderStats.totalSpent as any).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">
                  ${averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </CardTitle>
              <CardDescription>Customer shipping and billing addresses</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsCreatingAddress(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No addresses found for this customer
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 border rounded-lg space-y-2 relative"
                >
                  {address.isDefault && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Default
                      </span>
                    </div>
                  )}
                  <div className="font-medium">
                    {address.firstName} {address.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{address.streetAddress}</div>
                    {address.apartment && <div>{address.apartment}</div>}
                    <div>
                      {address.city}, {address.state} {address.postalCode}
                    </div>
                    <div>{address.country}</div>
                    {address.phoneNumber && (
                      <div className="flex items-center gap-1 mt-2">
                        <Phone className="h-3 w-3" />
                        {address.phoneNumber}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddress(address)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDefaultMutation.mutate({
                            data: { customerId, addressId: address.id },
                          })
                        }
                        disabled={setDefaultMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingAddress(address)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Recent Orders
          </CardTitle>
          <CardDescription>Order history</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found for this customer
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total ? parseFloat(order.total).toFixed(2) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Address Dialog */}
      {editingAddress && (
        <AddressEditDialog
          address={editingAddress}
          customerId={customerId}
          open={!!editingAddress}
          onOpenChange={(open) => !open && setEditingAddress(null)}
        />
      )}

      {/* Create Address Dialog */}
      <AddressCreateDialog
        customerId={customerId}
        open={isCreatingAddress}
        onOpenChange={setIsCreatingAddress}
      />

      {/* Delete Address Confirmation */}
      <AlertDialog open={!!deletingAddress} onOpenChange={(open) => !open && setDeletingAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAddress && deleteAddressMutation.mutate({ data: deletingAddress.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function CustomerDetailsSheet({ customer, open, onOpenChange }: CustomerDetailsSheetProps) {
  if (!customer) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {customer.first_name} {customer.last_name}
          </SheetTitle>
          <SheetDescription>
            Customer details and order history
          </SheetDescription>
        </SheetHeader>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <CustomerDetailsContent customerId={customer.id} />
        </Suspense>
      </SheetContent>
    </Sheet>
  )
}
