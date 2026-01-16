import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  activeCartsQueryOptions,
  abandonedCartsQueryOptions,
  cartMetricsQueryOptions,
} from '~/utils/cart'
import { MetricCard } from '~/components/dashboard/MetricCard'
import { DataTable } from '~/components/data-table'
import { activeCartsColumns, abandonedCartsColumns } from '~/components/carts-columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ShoppingCart, ShoppingBag, DollarSign } from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/carts/')({
  component: CartsPage,
  loader: ({ context }) => {
    // Prefetch all cart data
    context.queryClient.ensureQueryData(cartMetricsQueryOptions())
    context.queryClient.ensureQueryData(activeCartsQueryOptions())
    context.queryClient.ensureQueryData(abandonedCartsQueryOptions())
  },
})

function CartsPage() {
  const [abandonedFilter, setAbandonedFilter] = useState<24 | 48 | 72>(24)

  // Fetch cart data
  const { data: metrics } = useSuspenseQuery(cartMetricsQueryOptions())
  const { data: activeCarts } = useSuspenseQuery(activeCartsQueryOptions())
  const { data: abandonedCarts } = useSuspenseQuery(
    abandonedCartsQueryOptions({ hoursAgo: abandonedFilter })
  )

  // Format average cart value
  const formattedAvgValue = `$${parseFloat(metrics.avgValue).toFixed(2)}`

  // Calculate total potential revenue from abandoned carts
  const abandonedRevenue = abandonedCarts.reduce(
    (sum, cart) => sum + parseFloat(cart.total),
    0
  )
  const formattedAbandonedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(abandonedRevenue)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carts</h1>
        <p className="text-muted-foreground">
          Monitor and manage customer shopping carts
        </p>
      </div>

      {/* Key Metrics - 3 Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active Carts"
          value={metrics.activeCount.toLocaleString()}
          icon={ShoppingCart}
          description="Currently in progress"
        />
        <MetricCard
          title="Abandoned Carts"
          value={metrics.abandonedCount.toLocaleString()}
          icon={ShoppingBag}
          description={`${formattedAbandonedRevenue} in potential revenue`}
        />
        <MetricCard
          title="Avg Cart Value"
          value={formattedAvgValue}
          icon={DollarSign}
          description="Across all active carts"
        />
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Carts ({activeCarts.length})
          </TabsTrigger>
          <TabsTrigger value="abandoned">
            Abandoned Carts ({abandonedCarts.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Carts Tab */}
        <TabsContent value="active" className="space-y-4">
          <DataTable
            columns={activeCartsColumns}
            data={activeCarts}
            searchKey="sessionId"
            searchPlaceholder="Search by session ID..."
          />
        </TabsContent>

        {/* Abandoned Carts Tab */}
        <TabsContent value="abandoned" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Show carts abandoned in the last:
            </span>
            <div className="flex gap-2">
              <Button
                variant={abandonedFilter === 24 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAbandonedFilter(24)}
              >
                24 hours
              </Button>
              <Button
                variant={abandonedFilter === 48 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAbandonedFilter(48)}
              >
                48 hours
              </Button>
              <Button
                variant={abandonedFilter === 72 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAbandonedFilter(72)}
              >
                72 hours
              </Button>
            </div>
          </div>

          <DataTable
            columns={abandonedCartsColumns}
            data={abandonedCarts}
            searchKey="customer.email"
            searchPlaceholder="Search by email..."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
