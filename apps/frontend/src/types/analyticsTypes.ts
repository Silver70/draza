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

// ==================== CAMPAIGN ANALYTICS TYPES ====================

export type CampaignPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'multi'
  | 'other'

export type CampaignType =
  | 'post'
  | 'reel'
  | 'story'
  | 'video'
  | 'ad'
  | 'campaign'

export type Campaign = {
  id: string
  parentCampaignId: string | null
  name: string
  description: string | null
  platform: CampaignPlatform
  campaignType: CampaignType
  postUrl: string | null
  trackingCode: string
  cost: string
  budget: string
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export type CampaignVisit = {
  id: string
  sessionId: string
  campaignId: string
  landingPage: string | null
  userAgent: string | null
  referrer: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  device: string | null
  converted: boolean
  orderId: string | null
  customerId: string | null
  visitedAt: Date
  expiresAt: Date
}

export type CampaignConversion = {
  id: string
  campaignId: string
  visitId: string
  orderId: string
  customerId: string
  revenue: string
  convertedAt: Date
}

export type CampaignAnalytics = {
  campaignId: string
  campaignName: string
  totalVisits: number
  totalConversions: number
  totalRevenue: string
  conversionRate: string
  roi: string
  averageOrderValue: string
}

export type CampaignTimelineData = {
  date: string
  visits: number
  conversions: number
  revenue: string
}

export type CampaignProductPerformance = {
  productId: string
  productName: string
  variantId: string
  variantSku: string
  orders: number
  quantity: number
  revenue: string
}

export type CampaignAnalyticsDetailed = {
  campaign: Campaign
  metrics: {
    totalVisits: number
    uniqueVisitors: number
    totalConversions: number
    conversionRate: string
    totalRevenue: string
    averageOrderValue: string
    roi: string
    costPerVisit: string
    costPerConversion: string
  }
  timeline?: CampaignTimelineData[]
  topProducts?: {
    productId: string
    productName: string
    quantitySold: number
    revenue: string
  }[]
  deviceBreakdown?: {
    deviceType: string
    visits: number
    conversions: number
  }[]
  geographicBreakdown?: {
    country: string
    visits: number
    conversions: number
    revenue: string
  }[]
}

export type CampaignOverview = {
  totalCampaigns: number
  totalVisits: number
  totalConversions: number
  totalRevenue: string
  totalCost: string
  overallROI: string
  conversionRate: string
}

export type CampaignLeaderboardEntry = {
  id: string
  name: string
  platform: CampaignPlatform
  trackingCode: string
  cost: string
  visits: number
  conversions: number
  revenue: string
  roi: string
}

// Response wrappers
export type CampaignsListResponse = {
  success: boolean
  data: Campaign[]
}

export type CampaignResponse = {
  success: boolean
  data: Campaign
}

export type CampaignVisitsResponse = {
  success: boolean
  data: CampaignVisit[]
}

export type CampaignConversionsResponse = {
  success: boolean
  data: CampaignConversion[]
}

export type CampaignAnalyticsResponse = {
  success: boolean
  data: CampaignAnalyticsDetailed
}

export type CampaignOverviewResponse = {
  success: boolean
  data: CampaignOverview
}

export type CampaignLeaderboardResponse = {
  success: boolean
  data: CampaignLeaderboardEntry[]
}

export type TrackVisitRequest = {
  trackingCode: string
  sessionId: string
  landingPage?: string
  userAgent?: string
  referrer?: string
  ipAddress?: string
  country?: string
  city?: string
  device?: string
}

export type TrackVisitResponse = {
  success: boolean
  data: {
    visitId: string
    campaignId: string
  }
}

// ==================== SALES TRENDS TYPES ====================

export type SalesTrend = {
  period: string
  revenue: string
  orders: number
  averageOrderValue: string
}

export type SalesTrendsResponse = {
  success: boolean
  data: SalesTrend[]
}

// ==================== CUSTOMER ANALYTICS TYPES ====================

export type TopCustomer = {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: string
}

export type TopCustomersResponse = {
  success: boolean
  data: TopCustomer[]
}

// ==================== PRODUCT ANALYTICS TYPES ====================

export type TopSellingProduct = {
  productId: string
  productName: string
  variantId: string
  sku: string
  quantitySold: number
  revenue: string
}

export type TopSellingProductsResponse = {
  success: boolean
  data: TopSellingProduct[]
}
