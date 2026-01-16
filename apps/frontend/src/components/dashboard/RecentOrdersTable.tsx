import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { RecentOrder } from '~/types/analyticsTypes'
import { Link } from '@tanstack/react-router'

type RecentOrdersTableProps = {
  orders: RecentOrder[]
}

const getStatusVariant = (status: string) => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'completed':
    case 'delivered':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    case 'pending':
      return 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return ''
  }
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
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
        <CardTitle>Recent orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-sm">
                        {getInitials(order.customerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link to="/orders" className="font-medium hover:underline">
                    #{order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)} className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  2 Items
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${parseFloat(order.total).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
