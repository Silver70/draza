# Campaign Analytics API - Frontend Usage Guide

This guide shows how to use the campaign analytics types and utilities in the frontend.

## Files Overview

- **`src/types/analyticsTypes.ts`** - TypeScript types for campaigns and analytics
- **`src/utils/analytics.ts`** - API query functions using TanStack Query
- **`src/utils/campaigns.ts`** - Helper utilities for campaign data manipulation

---

## 1. Fetching Campaign Data

### Get All Campaigns

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignsQueryOptions } from '~/utils/analytics'

function CampaignsList() {
  const { data: campaigns } = useSuspenseQuery(campaignsQueryOptions())

  return (
    <div>
      {campaigns.map((campaign) => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  )
}
```

### Get Single Campaign

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignQueryOptions } from '~/utils/analytics'

function CampaignDetails({ campaignId }: { campaignId: string }) {
  const { data: campaign } = useSuspenseQuery(campaignQueryOptions(campaignId))

  return (
    <div>
      <h1>{campaign.name}</h1>
      <p>Platform: {campaign.platform}</p>
      <p>Tracking Code: {campaign.trackingCode}</p>
    </div>
  )
}
```

### Get Campaign Analytics

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignAnalyticsQueryOptions } from '~/utils/analytics'

function CampaignAnalytics({ campaignId }: { campaignId: string }) {
  const { data } = useSuspenseQuery(
    campaignAnalyticsQueryOptions(campaignId, {
      includeTimeline: true,
      includeProducts: true,
    })
  )

  return (
    <div>
      <h2>{data.campaign.name}</h2>
      <p>Total Visits: {data.analytics.totalVisits}</p>
      <p>Conversions: {data.analytics.totalConversions}</p>
      <p>Revenue: {data.analytics.totalRevenue}</p>
      <p>ROI: {data.analytics.roi}%</p>

      {/* Timeline data */}
      {data.timeline && (
        <div>
          {data.timeline.map((point) => (
            <div key={point.date}>
              {point.date}: {point.conversions} conversions
            </div>
          ))}
        </div>
      )}

      {/* Top products */}
      {data.topProducts && (
        <div>
          {data.topProducts.map((product) => (
            <div key={product.variantId}>
              {product.productName}: ${product.revenue}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Get Campaign Overview (All Campaigns Summary)

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignOverviewQueryOptions } from '~/utils/analytics'

function CampaignOverview() {
  const { data: overview } = useSuspenseQuery(campaignOverviewQueryOptions())

  return (
    <div>
      <h2>Campaign Overview</h2>
      <p>Total Campaigns: {overview.totalCampaigns}</p>
      <p>Total Visits: {overview.totalVisits}</p>
      <p>Total Conversions: {overview.totalConversions}</p>
      <p>Total Revenue: ${overview.totalRevenue}</p>
      <p>Overall ROI: {overview.overallROI}%</p>
      <p>Conversion Rate: {overview.conversionRate}%</p>
    </div>
  )
}
```

### Get Campaign Leaderboard

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignLeaderboardQueryOptions } from '~/utils/analytics'

function CampaignLeaderboard() {
  const { data: leaderboard } = useSuspenseQuery(
    campaignLeaderboardQueryOptions({
      metric: 'revenue',
      limit: 10,
    })
  )

  return (
    <div>
      <h2>Top Performing Campaigns</h2>
      {leaderboard.map((campaign, index) => (
        <div key={campaign.id}>
          #{index + 1} {campaign.name} - ${campaign.revenue}
        </div>
      ))}
    </div>
  )
}
```

### Get Campaign Visits

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignVisitsQueryOptions } from '~/utils/analytics'

function CampaignVisits({ campaignId }: { campaignId: string }) {
  const { data: visits } = useSuspenseQuery(campaignVisitsQueryOptions(campaignId))

  return (
    <div>
      {visits.map((visit) => (
        <div key={visit.id}>
          {visit.visitedAt} - {visit.country} - {visit.device}
          {visit.converted && ' ✓ Converted'}
        </div>
      ))}
    </div>
  )
}
```

### Get Campaign Conversions

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { campaignConversionsQueryOptions } from '~/utils/analytics'

function CampaignConversions({ campaignId }: { campaignId: string }) {
  const { data: conversions } = useSuspenseQuery(
    campaignConversionsQueryOptions(campaignId)
  )

  return (
    <div>
      {conversions.map((conversion) => (
        <div key={conversion.id}>
          Order: {conversion.orderId} - Revenue: ${conversion.revenue}
        </div>
      ))}
    </div>
  )
}
```

---

## 2. Creating, Updating, Deleting Campaigns

### Create Campaign

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCampaign } from '~/utils/analytics'

function CreateCampaignForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      // Invalidate campaigns list to refetch
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    mutation.mutate({
      name: formData.get('name') as string,
      platform: formData.get('platform') as string,
      cost: formData.get('cost') as string,
      budget: formData.get('budget') as string,
      isActive: true,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Campaign Name" required />
      <select name="platform" required>
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
        <option value="facebook">Facebook</option>
      </select>
      <input name="cost" type="number" step="0.01" placeholder="Cost" />
      <input name="budget" type="number" step="0.01" placeholder="Budget" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
```

### Update Campaign

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCampaign } from '~/utils/analytics'

function UpdateCampaignForm({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCampaign>[1]) =>
      updateCampaign(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] })
    },
  })

  const handleUpdate = () => {
    mutation.mutate({
      name: 'Updated Campaign Name',
      budget: '1000.00',
    })
  }

  return <button onClick={handleUpdate}>Update Campaign</button>
}
```

### Delete Campaign

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCampaign } from '~/utils/analytics'

function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? 'Deleting...' : 'Delete Campaign'}
    </button>
  )
}
```

---

## 3. Using Campaign Utility Functions

### Format ROI, Conversion Rate, Currency

```tsx
import {
  formatROI,
  formatConversionRate,
  formatCurrency,
} from '~/utils/campaigns'

function CampaignMetrics({ campaign }: { campaign: Campaign }) {
  return (
    <div>
      <p>ROI: {formatROI(campaign.roi)}</p>
      <p>Conversion Rate: {formatConversionRate(campaign.conversionRate)}</p>
      <p>Revenue: {formatCurrency(campaign.revenue)}</p>
    </div>
  )
}
```

### Get Platform Display Info

```tsx
import {
  getPlatformDisplayName,
  getPlatformColor,
  getPlatformIcon,
} from '~/utils/campaigns'

function PlatformBadge({ platform }: { platform: CampaignPlatform }) {
  return (
    <div className={`${getPlatformColor(platform)} px-3 py-1 rounded`}>
      {getPlatformDisplayName(platform)}
    </div>
  )
}
```

### Calculate Metrics

```tsx
import {
  calculateROI,
  calculateConversionRate,
  calculateAverageOrderValue,
} from '~/utils/campaigns'

function CampaignCalculations({ revenue, cost, visits, conversions }) {
  const roi = calculateROI(revenue, cost)
  const conversionRate = calculateConversionRate(conversions, visits)
  const aov = calculateAverageOrderValue(revenue, conversions)

  return (
    <div>
      <p>ROI: {roi.toFixed(2)}%</p>
      <p>Conversion Rate: {conversionRate.toFixed(2)}%</p>
      <p>Average Order Value: ${aov.toFixed(2)}</p>
    </div>
  )
}
```

### Get ROI Status

```tsx
import { getROIStatus, getROIStatusColor } from '~/utils/campaigns'

function ROIIndicator({ roi }: { roi: string }) {
  const status = getROIStatus(roi)
  const color = getROIStatusColor(roi)

  return (
    <span className={color}>
      {status === 'positive' ? '↑' : status === 'negative' ? '↓' : '→'} {roi}%
    </span>
  )
}
```

### Check Campaign Status

```tsx
import {
  getCampaignStatus,
  getCampaignStatusColor,
} from '~/utils/campaigns'

function CampaignStatusBadge({ campaign }: { campaign: Campaign }) {
  const status = getCampaignStatus(
    campaign.isActive,
    campaign.startDate,
    campaign.endDate
  )
  const colorClass = getCampaignStatusColor(status)

  return (
    <span className={`px-2 py-1 rounded ${colorClass}`}>
      {status.toUpperCase()}
    </span>
  )
}
```

### Generate Tracking URLs

```tsx
import { generateTrackingURL } from '~/utils/campaigns'

function CampaignTrackingURL({ campaign }: { campaign: Campaign }) {
  const trackingURL = generateTrackingURL(
    'https://yourstore.com',
    campaign.trackingCode,
    {
      utm_source: campaign.platform,
      utm_medium: 'social',
    }
  )

  return (
    <div>
      <p>Tracking URL:</p>
      <code>{trackingURL}</code>
    </div>
  )
}
```

### Date Range Presets

```tsx
import { getDateRangePreset, formatDateRange } from '~/utils/campaigns'

function DateRangeSelector() {
  const handlePresetSelect = (preset: string) => {
    const range = getDateRangePreset(preset as any)
    const formatted = formatDateRange(range.startDate, range.endDate)
    console.log(formatted) // { startDate: '2024-01-01', endDate: '2024-01-31' }
  }

  return (
    <div>
      <button onClick={() => handlePresetSelect('today')}>Today</button>
      <button onClick={() => handlePresetSelect('last7days')}>Last 7 Days</button>
      <button onClick={() => handlePresetSelect('last30days')}>Last 30 Days</button>
      <button onClick={() => handlePresetSelect('thisMonth')}>This Month</button>
    </div>
  )
}
```

### Sort Campaigns

```tsx
import { sortCampaignsByMetric } from '~/utils/campaigns'

function SortedCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  const [sortBy, setSortBy] = useState<'revenue' | 'conversions' | 'roi'>('revenue')

  const sortedCampaigns = sortCampaignsByMetric(campaigns, sortBy, 'desc')

  return (
    <div>
      <select onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="revenue">Revenue</option>
        <option value="conversions">Conversions</option>
        <option value="roi">ROI</option>
      </select>

      {sortedCampaigns.map((campaign) => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  )
}
```

---

## 4. Route Example with Loader

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  campaignsQueryOptions,
  campaignOverviewQueryOptions,
} from '~/utils/analytics'

export const Route = createFileRoute('/campaigns/')({
  component: CampaignsPage,
  loader: ({ context }) => {
    // Prefetch data
    context.queryClient.ensureQueryData(campaignsQueryOptions())
    context.queryClient.ensureQueryData(campaignOverviewQueryOptions())
  },
})

function CampaignsPage() {
  const { data: campaigns } = useSuspenseQuery(campaignsQueryOptions())
  const { data: overview } = useSuspenseQuery(campaignOverviewQueryOptions())

  return (
    <div>
      <h1>Campaigns</h1>
      <p>Total: {overview.totalCampaigns}</p>
      <p>Total Revenue: ${overview.totalRevenue}</p>

      <div>
        {campaigns.map((campaign) => (
          <div key={campaign.id}>{campaign.name}</div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Available Query Options

All query options follow the same pattern and can be used with `useSuspenseQuery`, `useQuery`, or in loaders:

- `campaignsQueryOptions()` - Get all campaigns
- `campaignQueryOptions(id)` - Get single campaign
- `campaignVisitsQueryOptions(campaignId)` - Get campaign visits
- `campaignConversionsQueryOptions(campaignId)` - Get campaign conversions
- `campaignAnalyticsQueryOptions(campaignId, filters?)` - Get detailed analytics
- `campaignOverviewQueryOptions()` - Get overview of all campaigns
- `campaignLeaderboardQueryOptions(filters?)` - Get top performing campaigns

## 6. Available Mutations

All mutations are async functions that return promises:

- `createCampaign(data)` - Create new campaign
- `updateCampaign(id, data)` - Update campaign
- `deleteCampaign(id)` - Delete campaign
- `trackCampaignVisit(data)` - Track a visit (storefront use)

## 7. Helper Utilities

Formatting:
- `formatROI(roi)` - Format ROI as percentage
- `formatConversionRate(rate)` - Format conversion rate
- `formatCurrency(amount)` - Format currency with $ and commas

Calculations:
- `calculateROI(revenue, cost)` - Calculate ROI percentage
- `calculateConversionRate(conversions, visits)` - Calculate conversion rate
- `calculateAverageOrderValue(revenue, conversions)` - Calculate AOV

Platform Info:
- `getPlatformDisplayName(platform)` - Get display name
- `getPlatformColor(platform)` - Get Tailwind color class
- `getPlatformIcon(platform)` - Get icon name

Status:
- `getROIStatus(roi)` - Get 'positive' | 'negative' | 'neutral'
- `getROIStatusColor(roi)` - Get Tailwind color class for ROI
- `getCampaignStatus(isActive, startDate, endDate)` - Get campaign status
- `getCampaignStatusColor(status)` - Get Tailwind color class for status

Utilities:
- `generateTrackingURL(baseURL, trackingCode, params?)` - Generate tracking URL
- `parseTrackingCode(trackingCode)` - Parse tracking code
- `formatDateRange(startDate, endDate)` - Format dates for API
- `getDateRangePreset(preset)` - Get predefined date ranges
- `sortCampaignsByMetric(campaigns, metric, order)` - Sort campaigns
- `isCampaignActive(startDate, endDate)` - Check if campaign is active

---

## TypeScript Types

All types are exported from `~/types/analyticsTypes`:

Core Types:
- `Campaign` - Campaign entity
- `CampaignVisit` - Visit record
- `CampaignConversion` - Conversion record
- `CampaignAnalytics` - Analytics summary
- `CampaignAnalyticsDetailed` - Full analytics with timeline/products
- `CampaignOverview` - Overview of all campaigns
- `CampaignLeaderboardEntry` - Leaderboard entry
- `CampaignTimelineData` - Timeline data point
- `CampaignProductPerformance` - Product performance data
- `CampaignPlatform` - Platform enum type

Response Types:
- `CampaignsListResponse`
- `CampaignResponse`
- `CampaignVisitsResponse`
- `CampaignConversionsResponse`
- `CampaignAnalyticsResponse`
- `CampaignOverviewResponse`
- `CampaignLeaderboardResponse`
- `TrackVisitResponse`

Request Types:
- `TrackVisitRequest`
