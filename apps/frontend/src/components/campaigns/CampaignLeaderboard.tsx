import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react'
import { cn } from '~/lib/utils'

type CampaignLeaderboardEntry = {
  id: string
  name: string
  platform: string
  trackingCode: string
  cost: string
  visits: number
  conversions: number
  revenue: string
  roi: string
}

type CampaignLeaderboardProps = {
  campaigns: CampaignLeaderboardEntry[]
}

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return Instagram
    case 'facebook':
      return Facebook
    case 'youtube':
      return Youtube
    case 'twitter':
      return Twitter
    default:
      return null
  }
}

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return '#E4405F'
    case 'facebook':
      return '#1877F2'
    case 'youtube':
      return '#FF0000'
    case 'twitter':
      return '#1DA1F2'
    case 'tiktok':
      return '#000000'
    default:
      return 'oklch(var(--primary))'
  }
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
  },
} satisfies ChartConfig

export function CampaignLeaderboard({ campaigns }: CampaignLeaderboardProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No campaigns yet. Create your first campaign to start tracking!
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get top 4 campaigns by revenue
  const topCampaigns = campaigns
    .slice(0, 4)
    .map((campaign) => ({
      name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
      fullName: campaign.name,
      revenue: parseFloat(campaign.revenue),
      platform: campaign.platform,
      roi: parseFloat(campaign.roi),
      conversions: campaign.conversions,
      fill: getPlatformColor(campaign.platform),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={topCampaigns} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `$${Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  }
                />
              }
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Campaign details below chart */}
        <div className="mt-6 space-y-3">
          {topCampaigns.map((campaign, index) => {
            const PlatformIcon = getPlatformIcon(campaign.platform)
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {PlatformIcon && (
                    <PlatformIcon className="h-4 w-4" style={{ color: campaign.fill }} />
                  )}
                  <span className="text-sm font-medium">{campaign.fullName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {campaign.conversions} conversions
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      campaign.roi >= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {campaign.roi >= 0 ? '+' : ''}
                    {campaign.roi.toFixed(1)}% ROI
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
