import type { CampaignPlatform } from '../types/analyticsTypes'

/**
 * Format ROI as a percentage with 2 decimal places
 */
export function formatROI(roi: string | number): string {
  const roiValue = typeof roi === 'string' ? parseFloat(roi) : roi
  return `${roiValue.toFixed(2)}%`
}

/**
 * Format conversion rate as a percentage with 2 decimal places
 */
export function formatConversionRate(rate: string | number): string {
  const rateValue = typeof rate === 'string' ? parseFloat(rate) : rate
  return `${rateValue.toFixed(2)}%`
}

/**
 * Format currency with proper separators
 */
export function formatCurrency(amount: string | number): string {
  const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount
  return `$${amountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Calculate ROI from cost and revenue
 */
export function calculateROI(revenue: string | number, cost: string | number): number {
  const revenueValue = typeof revenue === 'string' ? parseFloat(revenue) : revenue
  const costValue = typeof cost === 'string' ? parseFloat(cost) : cost

  if (costValue === 0) {
    return revenueValue > 0 ? Infinity : 0
  }

  return ((revenueValue - costValue) / costValue) * 100
}

/**
 * Calculate conversion rate from visits and conversions
 */
export function calculateConversionRate(
  conversions: number,
  visits: number,
): number {
  if (visits === 0) return 0
  return (conversions / visits) * 100
}

/**
 * Calculate average order value from revenue and conversions
 */
export function calculateAverageOrderValue(
  revenue: string | number,
  conversions: number,
): number {
  const revenueValue = typeof revenue === 'string' ? parseFloat(revenue) : revenue
  if (conversions === 0) return 0
  return revenueValue / conversions
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: CampaignPlatform): string {
  const platformNames: Record<CampaignPlatform, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'YouTube',
    multi: 'Multi-Platform',
    other: 'Other',
  }
  return platformNames[platform] || platform
}

/**
 * Get platform color for UI elements
 */
export function getPlatformColor(platform: CampaignPlatform): string {
  const platformColors: Record<CampaignPlatform, string> = {
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    facebook: 'bg-blue-600',
    twitter: 'bg-sky-500',
    youtube: 'bg-red-600',
    multi: 'bg-gradient-to-r from-blue-500 to-purple-500',
    other: 'bg-gray-500',
  }
  return platformColors[platform] || 'bg-gray-500'
}

/**
 * Get platform icon class (for use with icon libraries like lucide-react)
 */
export function getPlatformIcon(platform: CampaignPlatform): string {
  const platformIcons: Record<CampaignPlatform, string> = {
    instagram: 'Instagram',
    tiktok: 'Music', // TikTok not in lucide, use Music as alternative
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'Youtube',
    multi: 'Network', // Multi-platform uses Network icon
    other: 'Globe',
  }
  return platformIcons[platform] || 'Globe'
}

/**
 * Generate a tracking URL with campaign code
 */
export function generateTrackingURL(
  baseURL: string,
  trackingCode: string,
  params?: Record<string, string>,
): string {
  const url = new URL(baseURL)
  url.searchParams.set('utm_campaign', trackingCode)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return url.toString()
}

/**
 * Parse tracking code to extract platform and campaign info
 */
export function parseTrackingCode(trackingCode: string): {
  platform: string
  campaignName: string
  timestamp: string
} {
  // Expected format: PLATFORM_CAMPAIGN_NAME_TIMESTAMP
  const parts = trackingCode.split('_')

  if (parts.length < 3) {
    return {
      platform: 'unknown',
      campaignName: trackingCode,
      timestamp: '',
    }
  }

  const platform = parts[0]
  const timestamp = parts[parts.length - 1]
  const campaignName = parts.slice(1, -1).join('_')

  return {
    platform,
    campaignName,
    timestamp,
  }
}

/**
 * Get ROI status (positive, negative, neutral)
 */
export function getROIStatus(roi: string | number): 'positive' | 'negative' | 'neutral' {
  const roiValue = typeof roi === 'string' ? parseFloat(roi) : roi

  if (roiValue > 0) return 'positive'
  if (roiValue < 0) return 'negative'
  return 'neutral'
}

/**
 * Get ROI status color for UI
 */
export function getROIStatusColor(roi: string | number): string {
  const status = getROIStatus(roi)

  const colors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return colors[status]
}

/**
 * Format date range for API calls
 */
export function formatDateRange(startDate: Date, endDate: Date): {
  startDate: string
  endDate: string
} {
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

/**
 * Get predefined date range presets
 */
export function getDateRangePreset(
  preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth',
): { startDate: Date; endDate: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
      }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: yesterday,
        endDate: yesterday,
      }
    }

    case 'last7days': {
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return {
        startDate: sevenDaysAgo,
        endDate: today,
      }
    }

    case 'last30days': {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return {
        startDate: thirtyDaysAgo,
        endDate: today,
      }
    }

    case 'thisMonth': {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: firstDayOfMonth,
        endDate: today,
      }
    }

    case 'lastMonth': {
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        startDate: firstDayOfLastMonth,
        endDate: lastDayOfLastMonth,
      }
    }

    default:
      return {
        startDate: today,
        endDate: today,
      }
  }
}

/**
 * Sort campaigns by metric
 */
export function sortCampaignsByMetric<
  T extends { visits?: number; conversions?: number; revenue?: string; roi?: string },
>(campaigns: T[], metric: 'visits' | 'conversions' | 'revenue' | 'roi', order: 'asc' | 'desc' = 'desc'): T[] {
  return [...campaigns].sort((a, b) => {
    let aValue = 0
    let bValue = 0

    switch (metric) {
      case 'visits':
        aValue = a.visits || 0
        bValue = b.visits || 0
        break
      case 'conversions':
        aValue = a.conversions || 0
        bValue = b.conversions || 0
        break
      case 'revenue':
        aValue = parseFloat(a.revenue || '0')
        bValue = parseFloat(b.revenue || '0')
        break
      case 'roi':
        aValue = parseFloat(a.roi || '0')
        bValue = parseFloat(b.roi || '0')
        break
    }

    return order === 'desc' ? bValue - aValue : aValue - bValue
  })
}

/**
 * Check if campaign is active based on dates
 */
export function isCampaignActive(
  startDate: Date | string | null,
  endDate: Date | string | null,
): boolean {
  const now = new Date()

  if (!startDate) return true // No start date means always active

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate

  if (now < start) return false // Not started yet

  if (!endDate) return true // No end date means active indefinitely

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  return now <= end
}

/**
 * Get campaign status text
 */
export function getCampaignStatus(
  isActive: boolean,
  startDate: Date | string | null,
  endDate: Date | string | null,
): 'active' | 'scheduled' | 'ended' | 'paused' {
  if (!isActive) return 'paused'

  const dateActive = isCampaignActive(startDate, endDate)

  if (!dateActive) {
    if (startDate) {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate
      if (new Date() < start) return 'scheduled'
    }
    return 'ended'
  }

  return 'active'
}

/**
 * Get campaign status color
 */
export function getCampaignStatusColor(
  status: 'active' | 'scheduled' | 'ended' | 'paused',
): string {
  const colors = {
    active: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    ended: 'bg-gray-100 text-gray-800',
    paused: 'bg-yellow-100 text-yellow-800',
  }

  return colors[status]
}
