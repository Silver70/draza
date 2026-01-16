import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  dashboardOverviewQueryOptions,
  revenueTrendQueryOptions,
  recentOrdersQueryOptions,
} from '~/utils/analytics'
import { MetricCard } from '~/components/dashboard/MetricCard'
import { SalesTrendChart } from '~/components/dashboard/SalesTrendChart'
import { CustomerGrowthChart } from '~/components/dashboard/CustomerGrowthChart'
import { RecentOrdersTable } from '~/components/dashboard/RecentOrdersTable'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      {/* Key Metrics - 3 Cards */}
      <div className="grid gap-4 md:grid-cols-3">

        <MetricCard
          title="Total Revenue"
          value={formattedRevenue}
          icon={DollarSign}
          trend={{
            value: 7.5,
            label: 'From last month'
          }}
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          trend={{
            value: 1.3,
            label: 'From last month'
          }}
        />
        <MetricCard
          title="Conversion Rate"
          value="3.2%"
          icon={TrendingUp}
          trend={{
            value: 0.5,
            label: 'From last month'
          }}
        />
      </div>

      {/* Charts - Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesTrendChart data={revenueTrend} period="week" />
        <CustomerGrowthChart />
      </div>

      {/* Recent Orders - Full Width */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  )
}
