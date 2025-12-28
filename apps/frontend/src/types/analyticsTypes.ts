// Dashboard Overview Types
export type DashboardOverview = {
  totalRevenue: string
  totalOrders: number
  totalCustomers: number
  averageOrderValue: string
  revenueByStatus: {
    pending: string
    processing: string
    shipped: string
    delivered: string
    cancelled: string
    refunded: string
  }
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    refunded: number
  }
  customerBreakdown: {
    registered: number
    guest: number
  }
  lowStockCount: number
  outOfStockCount: number
  taxCollected: string
  shippingCollected: string
}

// Revenue Trend Types
export type RevenueTrend = {
  date: string
  revenue: string
  orderCount: number
}

// Recent Order Types
export type RecentOrder = {
  id: string
  orderNumber: string
  customerName: string
  total: string
  status: string
  createdAt: Date
}

// Response wrappers
export type DashboardOverviewResponse = {
  success: boolean
  data: DashboardOverview
}

export type RevenueTrendResponse = {
  success: boolean
  data: RevenueTrend[]
}

export type RecentOrdersResponse = {
  success: boolean
  data: RecentOrder[]
}

// Order Status for filtering/display
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
