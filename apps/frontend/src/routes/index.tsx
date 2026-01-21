import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
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
import { useAuth } from '~/contexts/AuthContext'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
  // Remove loader - we can't prefetch auth-required data during SSR without cookies
  // The data will be fetched client-side after auth is verified
})

function Home() {
  const { user, organization, isLoading } = useAuth()
  const router = useRouter()

  // Fetch dashboard data only after auth is confirmed
  const { data: overview, isLoading: loadingOverview, error: overviewError } = useQuery({
    ...dashboardOverviewQueryOptions(),
    enabled: !!(user && organization), // Only fetch when authenticated
  })
  const { data: revenueTrend, isLoading: loadingTrend, error: trendError } = useQuery({
    ...revenueTrendQueryOptions({ period: 'week', limit: 8 }),
    enabled: !!(user && organization),
  })
  const { data: recentOrders, isLoading: loadingOrders, error: ordersError } = useQuery({
    ...recentOrdersQueryOptions(5),
    enabled: !!(user && organization),
  })

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard] Auth state:', { user: !!user, organization: !!organization, isLoading })
    console.log('[Dashboard] Data state:', {
      overview: !!overview,
      loadingOverview,
      overviewError: overviewError?.message,
      revenueTrend: !!revenueTrend,
      loadingTrend,
      trendError: trendError?.message,
      recentOrders: !!recentOrders,
      loadingOrders,
      ordersError: ordersError?.message
    })
  }, [user, organization, isLoading, overview, loadingOverview, overviewError, revenueTrend, loadingTrend, trendError, recentOrders, loadingOrders, ordersError])

  // Client-side route protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.navigate({ to: '/login' })
      } else if (!organization) {
        router.navigate({ to: '/onboarding' })
      }
    }
  }, [user, organization, isLoading, router])

  // Show errors if any
  if (overviewError || trendError || ordersError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">
          Error loading dashboard: {overviewError?.message || trendError?.message || ordersError?.message}
        </div>
      </div>
    )
  }

  // Show loading while checking auth or fetching data
  if (isLoading || !user || !organization || loadingOverview || loadingTrend || loadingOrders) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">
          Loading...
          {isLoading && <div className="text-xs mt-2">Checking authentication...</div>}
          {!user && !isLoading && <div className="text-xs mt-2">No user found...</div>}
          {!organization && user && !isLoading && <div className="text-xs mt-2">No organization found...</div>}
          {loadingOverview && <div className="text-xs mt-2">Loading overview...</div>}
          {loadingTrend && <div className="text-xs mt-2">Loading trends...</div>}
          {loadingOrders && <div className="text-xs mt-2">Loading orders...</div>}
        </div>
      </div>
    )
  }

  // If no data yet, still loading
  if (!overview || !revenueTrend || !recentOrders) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Waiting for data...</div>
      </div>
    )
  }

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
