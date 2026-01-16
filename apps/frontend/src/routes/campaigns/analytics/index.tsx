import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  campaignOverviewQueryOptions,
  campaignLeaderboardQueryOptions,
} from '~/utils/analytics'
import { MetricCard } from '~/components/dashboard/MetricCard'
import { Target, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '~/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

export const Route = createFileRoute('/campaigns/analytics/')({
  component: WebAnalytics,
  loader: ({ context }) => {
    // Prefetch campaign analytics data
    context.queryClient.ensureQueryData(campaignOverviewQueryOptions())
    context.queryClient.ensureQueryData(
      campaignLeaderboardQueryOptions({ metric: 'visits', limit: 50 })
    )
  },
})

const platformChartConfig = {
  visits: {
    label: 'Visits',
    color: 'var(--primary)',
  },
  conversions: {
    label: 'Conversions',
    color: 'var(--secondary)',
  },
} satisfies ChartConfig

const radarChartConfig = {
  visits: {
    label: 'Visits',
    color: 'var(--primary)',
  },
  conversions: {
    label: 'Conversions',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function WebAnalytics() {
  // Fetch campaign data
  const { data: overview } = useSuspenseQuery(campaignOverviewQueryOptions())
  const { data: leaderboard } = useSuspenseQuery(
    campaignLeaderboardQueryOptions({ metric: 'visits', limit: 50 })
  )

  // Aggregate visits by platform
  const platformData = leaderboard.reduce(
    (acc, campaign) => {
      const existing = acc.find((item) => item.platform === campaign.platform)
      if (existing) {
        existing.visits += campaign.visits
        existing.conversions += campaign.conversions
      } else {
        acc.push({
          platform: campaign.platform,
          visits: campaign.visits,
          conversions: campaign.conversions,
        })
      }
      return acc
    },
    [] as Array<{ platform: string; visits: number; conversions: number }>
  )

  // Sort platforms by visits
  platformData.sort((a, b) => b.visits - a.visits)

  // Get top 10 campaigns by visits
  const topCampaigns = leaderboard.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            Track your marketing campaign performance across all platforms
          </p>
        </div>
      </div>

      {/* Overview Cards - 4 columns */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Active Campaigns" value={overview.totalCampaigns} icon={Target} />
        <MetricCard
          title="Total Visits"
          value={overview.totalVisits.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Total Conversions"
          value={overview.totalConversions.toLocaleString()}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Overall ROI"
          value={`${parseFloat(overview.overallROI).toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Two Column Layout - Platform Performance & Platform Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Platform Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visits by Platform</CardTitle>
            <CardDescription>Campaign traffic across social media platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={platformChartConfig} className="h-75 w-full">
              <BarChart data={platformData}>
                <defs>
                  <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="fillConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="platform"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="visits"
                  fill="url(#fillVisits)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="conversions"
                  fill="url(#fillConversions)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Platform Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Campaign metrics across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={radarChartConfig} className="h-75 w-full">
              <RadarChart data={platformData}>
                <defs>
                  <linearGradient id="fillRadarVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillRadarConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="platform"
                  tickFormatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
                <PolarRadiusAxis angle={90} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar
                  name="Visits"
                  dataKey="visits"
                  stroke="var(--primary)"
                  fill="url(#fillRadarVisits)"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Conversions"
                  dataKey="conversions"
                  stroke="var(--chart-2)"
                  fill="url(#fillRadarConversions)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>Campaigns ranked by visits</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
                      {campaign.platform.charAt(0).toUpperCase() +
                        campaign.platform.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.visits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.conversions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(campaign.revenue).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        parseFloat(campaign.roi) >= 100
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : parseFloat(campaign.roi) >= 0
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {parseFloat(campaign.roi).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
