import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  Target,
  Copy,
  ExternalLink,
  BarChart3,
  Globe,
  Smartphone
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import {
  campaignQueryOptions,
  campaignAnalyticsQueryOptions,
} from '~/utils/analytics'
import {
  getPlatformDisplayName,
  getPlatformColor,
  getCampaignStatus,
  getCampaignStatusColor,
  formatCurrency,
  formatROI,
  formatConversionRate,
  getROIStatusColor,
} from '~/utils/campaigns'
import { toast } from 'sonner'

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(campaignQueryOptions(params.campaignId)),
      queryClient.ensureQueryData(
        campaignAnalyticsQueryOptions(params.campaignId, {
          includeTimeline: true,
          includeProducts: true,
        })
      ),
    ])
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  const navigate = useNavigate()

  const { data: campaign } = useSuspenseQuery(campaignQueryOptions(campaignId))
  const { data: analytics } = useSuspenseQuery(
    campaignAnalyticsQueryOptions(campaignId, {
      includeTimeline: true,
      includeProducts: true,
    })
  )

  const status = getCampaignStatus(campaign.isActive, campaign.startsAt, campaign.endsAt)
  const statusColor = getCampaignStatusColor(status)
  const platformColor = getPlatformColor(campaign.platform)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/campaigns' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge className={statusColor}>
              {status}
            </Badge>
            {campaign.parentCampaignId && (
              <Badge variant="outline">Sub-campaign</Badge>
            )}
          </div>
          {campaign.description && (
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Campaign Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Platform</p>
            <Badge className={`${platformColor} text-white`}>
              {getPlatformDisplayName(campaign.platform)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Type</p>
            <p className="font-medium capitalize">{campaign.campaignType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tracking Code</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {campaign.trackingCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(campaign.trackingCode, 'Tracking code')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {campaign.postUrl && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Post URL</p>
              <a
                href={campaign.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                View Post
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.metrics.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.metrics.uniqueVisitors.toLocaleString()} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.metrics.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatConversionRate(analytics.metrics.conversionRate)} conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(analytics.metrics.averageOrderValue)} avg order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getROIStatusColor(analytics.metrics.roi)}`}>
              {formatROI(analytics.metrics.roi)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(analytics.metrics.costPerConversion)} per conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget & Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Budget & Costs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(campaign.cost)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(campaign.budget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cost per Visit</p>
            <p className="text-2xl font-bold">{formatCurrency(analytics.metrics.costPerVisit)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      {analytics.topProducts && analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performing Products
            </CardTitle>
            <CardDescription>
              Products with the most sales from this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantitySold} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device & Geographic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.deviceBreakdown && analytics.deviceBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.deviceBreakdown.map((device) => (
                  <div key={device.deviceType} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{device.deviceType || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.conversions} conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{device.visits.toLocaleString()} visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.geographicBreakdown && analytics.geographicBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.geographicBreakdown.slice(0, 5).map((geo) => (
                  <div key={geo.country} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{geo.country}</p>
                      <p className="text-sm text-muted-foreground">
                        {geo.conversions} conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(geo.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{geo.visits} visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      {analytics.timeline && analytics.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Timeline
            </CardTitle>
            <CardDescription>
              Visits and conversions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.timeline.slice(-10).map((day) => (
                <div key={day.date} className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">{new Date(day.date).toLocaleDateString()}</p>
                  <div className="flex gap-4">
                    <p>
                      <span className="text-muted-foreground">Visits:</span> {day.visits}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Conversions:</span> {day.conversions}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(day.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
