import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { User, Loader2, MapPin, ShoppingBag, Mail, Phone } from 'lucide-react'
import type { Customer } from '~/types/customerTypes'
import {
  customerWithAddressesQueryOptions,
  customerOrdersQueryOptions,
  customerOrderStatsQueryOptions,
} from '~/utils/customers'
import { Suspense } from 'react'

type CustomerDetailsSheetProps = {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CustomerDetailsContent({ customerId }: { customerId: string }) {
  const { data: customerWithAddresses } = useSuspenseQuery(
    customerWithAddressesQueryOptions(customerId)
  )
  const { data: orders = [] } = useQuery(customerOrdersQueryOptions(customerId))
  const { data: orderStats } = useQuery(customerOrderStatsQueryOptions(customerId))

  const addresses = customerWithAddresses.addresses || []

  // Calculate average order value
  const averageOrderValue = orderStats && orderStats.totalOrders > 0
    ? parseFloat(orderStats.totalSpent as any) / orderStats.totalOrders
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Customer Info */}
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
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </CardTitle>
          <CardDescription>Customer shipping and billing addresses</CardDescription>
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
