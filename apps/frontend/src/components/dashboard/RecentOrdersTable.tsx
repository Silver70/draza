import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { RecentOrder, OrderStatus } from '~/types/analyticsTypes'
import { Link } from '@tanstack/react-router'

type RecentOrdersTableProps = {
  orders: RecentOrder[]
}

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'delivered':
      return 'default'
    case 'shipped':
      return 'default'
    case 'processing':
      return 'secondary'
    case 'pending':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    case 'refunded':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No orders yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/orders"
                    className="hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${parseFloat(order.total).toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
