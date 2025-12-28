import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

type OrderStatusBreakdownProps = {
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    refunded: number
  }
}

type StatusConfig = {
  label: string
  count: number
  color: 'default' | 'secondary' | 'destructive'
  bgColor: string
}

export function OrderStatusBreakdown({ ordersByStatus }: OrderStatusBreakdownProps) {
  const statuses: StatusConfig[] = [
    {
      label: 'Pending',
      count: ordersByStatus.pending,
      color: 'secondary',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      label: 'Processing',
      count: ordersByStatus.processing,
      color: 'secondary',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Shipped',
      count: ordersByStatus.shipped,
      color: 'default',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Delivered',
      count: ordersByStatus.delivered,
      color: 'default',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Cancelled',
      count: ordersByStatus.cancelled,
      color: 'destructive',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      label: 'Refunded',
      count: ordersByStatus.refunded,
      color: 'destructive',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ]

  const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map((status) => {
            const percentage =
              totalOrders > 0 ? ((status.count / totalOrders) * 100).toFixed(1) : '0'

            return (
              <div key={status.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.color}>{status.label}</Badge>
                    <span className="text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <span className="font-medium">{status.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${status.bgColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm font-medium">Total Orders</span>
          <span className="text-lg font-bold">{totalOrders}</span>
        </div>
      </CardContent>
    </Card>
  )
}
