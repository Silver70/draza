import { useSuspenseQuery } from '@tanstack/react-query'
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
import { ShoppingCart, Loader2, MapPin, User, Package } from 'lucide-react'
import { orderDetailsQueryOptions } from '~/utils/orders'
import { Suspense } from 'react'

type Order = {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string
}

type OrderDetailsSheetProps = {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function OrderDetailsContent({ orderId }: { orderId: string }) {
  const { data: orderDetails } = useSuspenseQuery(orderDetailsQueryOptions(orderId))

  const items = orderDetails.items || []

  return (
    <div className="space-y-6 p-6">
      {/* Order Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-mono font-medium">{orderDetails.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              orderDetails.status === 'completed' || orderDetails.status === 'delivered'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : orderDetails.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : orderDetails.status === 'processing' || orderDetails.status === 'shipped'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                : orderDetails.status === 'cancelled'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {orderDetails.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(orderDetails.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {orderDetails.estimatedDeliveryDate && (
            <div>
              <p className="text-sm text-muted-foreground">Est. Delivery</p>
              <p className="font-medium">
                {new Date(orderDetails.estimatedDeliveryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="font-medium">
              {orderDetails.customer.first_name} {orderDetails.customer.last_name}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{orderDetails.customer.email}</p>
            {orderDetails.customer.phone_number && (
              <p>{orderDetails.customer.phone_number}</p>
            )}
          </div>
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              orderDetails.customer.is_guest
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {orderDetails.customer.is_guest ? 'Guest' : 'Registered'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              <p className="font-medium">
                {orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}
              </p>
              <p>{orderDetails.shippingAddress.streetAddress}</p>
              {orderDetails.shippingAddress.apartment && (
                <p>{orderDetails.shippingAddress.apartment}</p>
              )}
              <p>
                {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state}{' '}
                {orderDetails.shippingAddress.postalCode}
              </p>
              <p>{orderDetails.shippingAddress.country}</p>
              {orderDetails.shippingAddress.phoneNumber && (
                <p className="mt-2 text-muted-foreground">
                  {orderDetails.shippingAddress.phoneNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              <p className="font-medium">
                {orderDetails.billingAddress.firstName} {orderDetails.billingAddress.lastName}
              </p>
              <p>{orderDetails.billingAddress.streetAddress}</p>
              {orderDetails.billingAddress.apartment && (
                <p>{orderDetails.billingAddress.apartment}</p>
              )}
              <p>
                {orderDetails.billingAddress.city}, {orderDetails.billingAddress.state}{' '}
                {orderDetails.billingAddress.postalCode}
              </p>
              <p>{orderDetails.billingAddress.country}</p>
              {orderDetails.billingAddress.phoneNumber && (
                <p className="mt-2 text-muted-foreground">
                  {orderDetails.billingAddress.phoneNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Items
          </CardTitle>
          <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.productVariant?.product?.name || 'Unknown Product'}</p>
                      {item.productVariant?.product?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.productVariant.product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.productVariant?.sku || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${parseFloat(item.totalPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Order Summary */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${parseFloat(orderDetails.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(orderDetails.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${parseFloat(orderDetails.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${parseFloat(orderDetails.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {parseFloat(orderDetails.shippingCost) === 0
                  ? 'Free'
                  : `$${parseFloat(orderDetails.shippingCost).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>${parseFloat(orderDetails.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Info */}
          {orderDetails.shippingMethodName && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Shipping Method</p>
              <p className="text-sm text-muted-foreground capitalize">
                {orderDetails.shippingMethodName.replace(/_/g, ' ')}
                {orderDetails.shippingCarrier && orderDetails.shippingCarrier !== 'other' && (
                  <span> via {orderDetails.shippingCarrier.toUpperCase()}</span>
                )}
              </p>
            </div>
          )}

          {/* Notes */}
          {orderDetails.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Order Notes</p>
              <p className="text-sm text-muted-foreground">{orderDetails.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function OrderDetailsSheet({ order, open, onOpenChange }: OrderDetailsSheetProps) {
  if (!order) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {order.orderNumber}
          </SheetTitle>
          <SheetDescription>
            Order details and items
          </SheetDescription>
        </SheetHeader>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <OrderDetailsContent orderId={order.id} />
        </Suspense>
      </SheetContent>
    </Sheet>
  )
}
