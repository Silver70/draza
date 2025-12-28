import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import {
  DashboardOverviewResponse,
  RevenueTrendResponse,
  RecentOrdersResponse,
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
