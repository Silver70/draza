import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  dashboardOverviewQueryOptions,
  revenueTrendQueryOptions,
  recentOrdersQueryOptions,
} from '~/utils/analytics'
import { MetricCard } from '~/components/dashboard/MetricCard'
import { SalesTrendChart } from '~/components/dashboard/SalesTrendChart'
import { RecentOrdersTable } from '~/components/dashboard/RecentOrdersTable'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Home,
  loader: ({ context }) => {
    // Prefetch all dashboard data
    context.queryClient.ensureQueryData(dashboardOverviewQueryOptions())
    context.queryClient.ensureQueryData(revenueTrendQueryOptions({ period: 'week', limit: 8 }))
    context.queryClient.ensureQueryData(recentOrdersQueryOptions(5))
  },
})

function Home() {
  // Fetch dashboard data
  const { data: overview } = useSuspenseQuery(dashboardOverviewQueryOptions())
  const { data: revenueTrend } = useSuspenseQuery(
    revenueTrendQueryOptions({ period: 'week', limit: 8 })
  )
  const { data: recentOrders } = useSuspenseQuery(recentOrdersQueryOptions(5))

  // Calculate formatted values
  const formattedRevenue = `$${parseFloat(overview.totalRevenue).toLocaleString()}`
  const formattedAOV = `$${parseFloat(overview.averageOrderValue).toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formattedRevenue}
          icon={DollarSign}
          description={`$${overview.taxCollected} in tax, $${overview.shippingCollected} shipping`}
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders}
          icon={ShoppingCart}
          description={`${overview.ordersByStatus.delivered} delivered, ${overview.ordersByStatus.processing} processing`}
        />
        <MetricCard
          title="Total Customers"
          value={overview.totalCustomers}
          icon={Users}
          description={`${overview.customerBreakdown.registered} registered, ${overview.customerBreakdown.guest} guest`}
        />
        <MetricCard
          title="Average Order Value"
          value={formattedAOV}
          icon={TrendingUp}
          description="Per order average"
        />
      </div>

      {/* Sales Trend Chart */}
      <SalesTrendChart data={revenueTrend} period="week" />

      {/* Recent Orders */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  )
}
