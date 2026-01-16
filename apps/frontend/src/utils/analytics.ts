import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import {
  DashboardOverviewResponse,
  RevenueTrendResponse,
  RecentOrdersResponse,
  CampaignsListResponse,
  CampaignResponse,
  CampaignVisitsResponse,
  CampaignConversionsResponse,
  CampaignAnalyticsResponse,
  CampaignOverviewResponse,
  CampaignLeaderboardResponse,
  TrackVisitRequest,
  TrackVisitResponse,
  SalesTrendsResponse,
  TopCustomersResponse,
  TopSellingProductsResponse,
} from '../types/analyticsTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ==================== DASHBOARD OVERVIEW ====================

/**
 * Fetch comprehensive dashboard overview
 * This is the main endpoint with all key metrics
 */
export const fetchDashboardOverview = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching dashboard overview...')
    try {
      const response = await axios.get<DashboardOverviewResponse>(
        `${API_BASE_URL}/analytics/dashboard/overview`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch dashboard overview')
    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      throw error
    }
  },
)

export const dashboardOverviewQueryOptions = () =>
  queryOptions({
    queryKey: ['analytics', 'dashboard', 'overview'],
    queryFn: () => fetchDashboardOverview(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

// ==================== REVENUE TRENDS ====================

/**
 * Fetch revenue trends over time
 * @param period - 'day' | 'week' | 'month'
 * @param limit - Number of data points to return
 */
export const fetchRevenueTrend = createServerFn({ method: 'GET' })
  .inputValidator((d?: { period?: 'day' | 'week' | 'month'; limit?: number }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching revenue trend...', data)
    try {
      const params = new URLSearchParams()
      if (data?.period) params.append('period', data.period)
      if (data?.limit) params.append('limit', data.limit.toString())

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/revenue/trend${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<RevenueTrendResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch revenue trend')
    } catch (error) {
      console.error('Error fetching revenue trend:', error)
      throw error
    }
  })

export const revenueTrendQueryOptions = (filters?: {
  period?: 'day' | 'week' | 'month'
  limit?: number
}) =>
  queryOptions({
    queryKey: ['analytics', 'revenue', 'trend', filters],
    queryFn: () => fetchRevenueTrend({ data: filters }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

// ==================== RECENT ORDERS ====================

/**
 * Fetch recent orders with customer info
 * @param limit - Number of orders to return (default: 10)
 */
export const fetchRecentOrders = createServerFn({ method: 'GET' })
  .inputValidator((d?: { limit?: number }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching recent orders...', data)
    try {
      const params = new URLSearchParams()
      if (data?.limit) params.append('limit', data.limit.toString())

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/orders/recent${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<RecentOrdersResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch recent orders')
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      throw error
    }
  })

export const recentOrdersQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: ['analytics', 'orders', 'recent', limit],
    queryFn: () => fetchRecentOrders({ data: { limit } }),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (more frequently updated)
  })

// ==================== CAMPAIGN ANALYTICS ====================

/**
 * Fetch all campaigns
 */
export const fetchCampaigns = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching campaigns...')
  try {
    const response = await axios.get<CampaignsListResponse>(
      `${API_BASE_URL}/analytics/campaigns`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch campaigns')
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    throw error
  }
})

export const campaignsQueryOptions = () =>
  queryOptions({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

/**
 * Fetch a single campaign by ID
 */
export const fetchCampaign = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching campaign...', data.id)
    try {
      const response = await axios.get<CampaignResponse>(
        `${API_BASE_URL}/analytics/campaigns/${data.id}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch campaign')
    } catch (error) {
      console.error('Error fetching campaign:', error)
      throw error
    }
  })

export const campaignQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['campaigns', id],
    queryFn: () => fetchCampaign({ data: { id } }),
    staleTime: 1000 * 60 * 5,
  })

/**
 * Fetch campaign visits
 */
export const fetchCampaignVisits = createServerFn({ method: 'GET' })
  .inputValidator((d: { campaignId: string }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching campaign visits...', data.campaignId)
    try {
      const response = await axios.get<CampaignVisitsResponse>(
        `${API_BASE_URL}/analytics/campaigns/${data.campaignId}/visits`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch campaign visits')
    } catch (error) {
      console.error('Error fetching campaign visits:', error)
      throw error
    }
  })

export const campaignVisitsQueryOptions = (campaignId: string) =>
  queryOptions({
    queryKey: ['campaigns', campaignId, 'visits'],
    queryFn: () => fetchCampaignVisits({ data: { campaignId } }),
    staleTime: 1000 * 60 * 2,
  })

/**
 * Fetch campaign conversions
 */
export const fetchCampaignConversions = createServerFn({ method: 'GET' })
  .inputValidator((d: { campaignId: string }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching campaign conversions...', data.campaignId)
    try {
      const response = await axios.get<CampaignConversionsResponse>(
        `${API_BASE_URL}/analytics/campaigns/${data.campaignId}/conversions`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch campaign conversions')
    } catch (error) {
      console.error('Error fetching campaign conversions:', error)
      throw error
    }
  })

export const campaignConversionsQueryOptions = (campaignId: string) =>
  queryOptions({
    queryKey: ['campaigns', campaignId, 'conversions'],
    queryFn: () => fetchCampaignConversions({ data: { campaignId } }),
    staleTime: 1000 * 60 * 2,
  })

/**
 * Fetch detailed campaign analytics
 */
export const fetchCampaignAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(
    (d: {
      campaignId: string
      startDate?: string
      endDate?: string
      includeTimeline?: boolean
      includeProducts?: boolean
    }) => d,
  )
  .handler(async ({ data }) => {
    console.info('Fetching campaign analytics...', data.campaignId)
    try {
      const params = new URLSearchParams()
      if (data.startDate) params.append('startDate', data.startDate)
      if (data.endDate) params.append('endDate', data.endDate)
      if (data.includeTimeline) params.append('includeTimeline', 'true')
      if (data.includeProducts) params.append('includeProducts', 'true')

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/campaigns/${data.campaignId}/analytics${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<CampaignAnalyticsResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch campaign analytics')
    } catch (error) {
      console.error('Error fetching campaign analytics:', error)
      throw error
    }
  })

export const campaignAnalyticsQueryOptions = (
  campaignId: string,
  filters?: {
    startDate?: string
    endDate?: string
    includeTimeline?: boolean
    includeProducts?: boolean
  },
) =>
  queryOptions({
    queryKey: ['campaigns', campaignId, 'analytics', filters],
    queryFn: () =>
      fetchCampaignAnalytics({
        data: {
          campaignId,
          ...filters,
        },
      }),
    staleTime: 1000 * 60 * 5,
  })

/**
 * Fetch campaigns overview
 */
export const fetchCampaignOverview = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching campaign overview...')
  try {
    const response = await axios.get<CampaignOverviewResponse>(
      `${API_BASE_URL}/analytics/campaigns/overview`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch campaign overview')
  } catch (error) {
    console.error('Error fetching campaign overview:', error)
    throw error
  }
})

export const campaignOverviewQueryOptions = () =>
  queryOptions({
    queryKey: ['campaigns', 'overview'],
    queryFn: () => fetchCampaignOverview(),
    staleTime: 1000 * 60 * 5,
  })

/**
 * Fetch campaign leaderboard
 */
export const fetchCampaignLeaderboard = createServerFn({ method: 'GET' })
  .inputValidator(
    (d?: { metric?: 'revenue' | 'conversions' | 'roi' | 'visits'; limit?: number }) => d,
  )
  .handler(async ({ data }) => {
    console.info('Fetching campaign leaderboard...', data)
    try {
      const params = new URLSearchParams()
      if (data?.metric) params.append('metric', data.metric)
      if (data?.limit) params.append('limit', data.limit.toString())

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/campaigns/leaderboard${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<CampaignLeaderboardResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch campaign leaderboard')
    } catch (error) {
      console.error('Error fetching campaign leaderboard:', error)
      throw error
    }
  })

export const campaignLeaderboardQueryOptions = (filters?: {
  metric?: 'revenue' | 'conversions' | 'roi' | 'visits'
  limit?: number
}) =>
  queryOptions({
    queryKey: ['campaigns', 'leaderboard', filters],
    queryFn: () => fetchCampaignLeaderboard({ data: filters }),
    staleTime: 1000 * 60 * 5,
  })

/**
 * Track a campaign visit (mutation)
 * Note: This is typically called from the storefront, not the admin panel
 */
export const trackCampaignVisit = async (data: TrackVisitRequest) => {
  console.info('Tracking campaign visit...', data.trackingCode)
  try {
    const response = await axios.post<TrackVisitResponse>(
      `${API_BASE_URL}/analytics/campaigns/track-visit`,
      data,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to track campaign visit')
  } catch (error) {
    console.error('Error tracking campaign visit:', error)
    throw error
  }
}

// ==================== CAMPAIGN MUTATIONS ====================

/**
 * Create a new campaign
 */
export const createCampaign = async (data: {
  name: string
  description?: string
  platform: string
  campaignType: string
  parentCampaignId?: string
  postUrl?: string
  cost?: number
  budget?: number
  startsAt?: string
  endsAt?: string
  metadata?: any
}) => {
  console.info('Creating campaign...', data.name)
  try {
    const response = await axios.post<CampaignResponse>(
      `${API_BASE_URL}/analytics/campaigns`,
      data,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to create campaign')
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw error
  }
}

/**
 * Update a campaign
 */
export const updateCampaign = async (
  id: string,
  data: {
    name?: string
    description?: string
    postUrl?: string
    cost?: number
    budget?: number
    startsAt?: string
    endsAt?: string
    isActive?: boolean
    metadata?: any
  },
) => {
  console.info('Updating campaign...', id)
  try {
    const response = await axios.put<CampaignResponse>(
      `${API_BASE_URL}/analytics/campaigns/${id}`,
      data,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to update campaign')
  } catch (error) {
    console.error('Error updating campaign:', error)
    throw error
  }
}

/**
 * Delete a campaign
 */
export const deleteCampaign = async (id: string) => {
  console.info('Deleting campaign...', id)
  try {
    const response = await axios.delete<{ success: boolean; message: string }>(
      `${API_BASE_URL}/analytics/campaigns/${id}`,
    )

    if (response.data.success) {
      return response.data
    }

    throw new Error('Failed to delete campaign')
  } catch (error) {
    console.error('Error deleting campaign:', error)
    throw error
  }
}

// ==================== SALES TRENDS ====================

/**
 * Fetch sales trends over time
 * @param period - 'day' | 'week' | 'month'
 * @param limit - Number of data points to return
 */
export const fetchSalesTrends = createServerFn({ method: 'GET' })
  .inputValidator((d?: { period?: 'day' | 'week' | 'month'; limit?: number }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching sales trends...', data)
    try {
      const params = new URLSearchParams()
      if (data?.period) params.append('period', data.period)
      if (data?.limit) params.append('limit', data.limit.toString())

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/sales/trends${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<SalesTrendsResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch sales trends')
    } catch (error) {
      console.error('Error fetching sales trends:', error)
      throw error
    }
  })

export const salesTrendsQueryOptions = (filters?: {
  period?: 'day' | 'week' | 'month'
  limit?: number
}) =>
  queryOptions({
    queryKey: ['analytics', 'sales', 'trends', filters],
    queryFn: () => fetchSalesTrends({ data: filters }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

// ==================== TOP CUSTOMERS ====================

/**
 * Fetch top customers by spending
 * @param limit - Number of customers to return (default: 10)
 */
export const fetchTopCustomers = createServerFn({ method: 'GET' })
  .inputValidator((d?: { limit?: number }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching top customers...', data)
    try {
      const params = new URLSearchParams()
      if (data?.limit) params.append('limit', data.limit.toString())

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/customers/top${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<TopCustomersResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch top customers')
    } catch (error) {
      console.error('Error fetching top customers:', error)
      throw error
    }
  })

export const topCustomersQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: ['analytics', 'customers', 'top', limit],
    queryFn: () => fetchTopCustomers({ data: { limit } }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

// ==================== TOP SELLING PRODUCTS ====================

/**
 * Fetch top selling products
 * @param limit - Number of products to return (default: 10)
 * @param sortBy - Sort by 'quantity' or 'revenue' (default: 'revenue')
 */
export const fetchTopSellingProducts = createServerFn({ method: 'GET' })
  .inputValidator((d?: { limit?: number; sortBy?: 'quantity' | 'revenue' }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching top selling products...', data)
    try {
      const params = new URLSearchParams()
      if (data?.limit) params.append('limit', data.limit.toString())
      if (data?.sortBy) params.append('sortBy', data.sortBy)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/analytics/products/top-selling${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<TopSellingProductsResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch top selling products')
    } catch (error) {
      console.error('Error fetching top selling products:', error)
      throw error
    }
  })

export const topSellingProductsQueryOptions = (filters?: {
  limit?: number
  sortBy?: 'quantity' | 'revenue'
}) =>
  queryOptions({
    queryKey: ['analytics', 'products', 'top-selling', filters],
    queryFn: () => fetchTopSellingProducts({ data: filters }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
