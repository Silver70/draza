import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { createColumns } from '@/components/orders-columns'
import { useNavigate } from '@tanstack/react-router'
import { ordersQueryOptions } from '@/utils/orders'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Link } from '@tanstack/react-router'
import { OrderDetailsSheet } from '~/components/orders/OrderDetailsSheet'
import type { Order } from '@/types/orderTypes'

export const Route = createFileRoute('/orders/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(ordersQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { data: orders } = useSuspenseQuery(ordersQueryOptions())
  const navigate = useNavigate()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleCreateOrder = () => {
    navigate({ to: '/orders/create' })
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setSheetOpen(true)
  }

  const columns = createColumns({
    onViewDetails: handleViewDetails,
  })

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders and track their status
        </p>
      </div>

      <OrderDetailsSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No orders found</h3>
            <p className="text-sm text-muted-foreground">
              Orders will appear here once customers start placing them.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Create Order
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="orderNumber"
          searchPlaceholder="Search by order number..."
          onAddNew={handleCreateOrder}
          addNewLabel="Create Order"
        />
      )}
    </>
  )
}
