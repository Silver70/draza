import { eq, sql, desc, and, gte, lte, isNull, inArray, like, or } from 'drizzle-orm';
import { db } from '../../../shared/db';
import {
  campaignsTable,
  campaignVisitsTable,
  campaignConversionsTable,
  campaignAnalyticsSnapshotsTable,
} from '../../../shared/db/campaign';
import { ordersTable, orderItemsTable } from '../../../shared/db/order';
import { customersTable } from '../../../shared/db/customer';
import { productsTable, productVariantsTable } from '../../../shared/db/catalogue';

export const campaignsRepo = {
  // ==================== CAMPAIGN CRUD ====================

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    parentCampaignId?: string;
    name: string;
    description?: string;
    platform: string;
    campaignType: string;
    postUrl?: string;
    trackingCode: string;
    cost: string;
    budget: string;
    startsAt?: Date;
    endsAt?: Date;
    metadata?: any;
  }) {
    const result = await db
      .insert(campaignsTable)
      .values({
        parentCampaignId: data.parentCampaignId,
        name: data.name,
        description: data.description,
        platform: data.platform as any,
        campaignType: data.campaignType as any,
        postUrl: data.postUrl,
        trackingCode: data.trackingCode,
        cost: data.cost,
        budget: data.budget,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        metadata: data.metadata,
      })
      .returning();

    return result[0];
  },

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string) {
    const result = await db.query.campaignsTable.findFirst({
      where: eq(campaignsTable.id, id),
    });

    return result;
  },

  /**
   * Get campaign by tracking code
   */
  async getCampaignByTrackingCode(trackingCode: string) {
    const result = await db.query.campaignsTable.findFirst({
      where: eq(campaignsTable.trackingCode, trackingCode),
    });

    return result;
  },

  /**
   * List campaigns with optional filters
   */
  async listCampaigns(filters: {
    platform?: string;
    isActive?: boolean;
    parentCampaignId?: string;
    search?: string;
  }) {
    const conditions = [];

    if (filters.platform) {
      conditions.push(eq(campaignsTable.platform, filters.platform as any));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(campaignsTable.isActive, filters.isActive));
    }

    if (filters.parentCampaignId !== undefined) {
      if (filters.parentCampaignId === null || filters.parentCampaignId === '') {
        // Get parent campaigns only
        conditions.push(isNull(campaignsTable.parentCampaignId));
      } else {
        conditions.push(eq(campaignsTable.parentCampaignId, filters.parentCampaignId));
      }
    }

    if (filters.search) {
      conditions.push(
        or(
          like(campaignsTable.name, `%${filters.search}%`),
          like(campaignsTable.trackingCode, `%${filters.search}%`)
        )!
      );
    }

    const result = await db.query.campaignsTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(campaignsTable.createdAt),
    });

    return result;
  },

  /**
   * Get child campaigns
   */
  async getChildCampaigns(parentCampaignId: string) {
    const result = await db.query.campaignsTable.findMany({
      where: eq(campaignsTable.parentCampaignId, parentCampaignId),
      orderBy: desc(campaignsTable.createdAt),
    });

    return result;
  },

  /**
   * Update campaign
   */
  async updateCampaign(
    id: string,
    data: {
      name?: string;
      description?: string;
      postUrl?: string;
      cost?: string;
      budget?: string;
      startsAt?: Date;
      endsAt?: Date;
      isActive?: boolean;
      metadata?: any;
    }
  ) {
    const result = await db
      .update(campaignsTable)
      .set(data)
      .where(eq(campaignsTable.id, id))
      .returning();

    return result[0];
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string) {
    await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  },

  // ==================== VISIT TRACKING ====================

  /**
   * Create a visit record
   */
  async createVisit(data: {
    campaignId: string;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    landingPage?: string;
    country?: string;
    city?: string;
    deviceType?: string;
  }) {
    const result = await db
      .insert(campaignVisitsTable)
      .values({
        campaignId: data.campaignId,
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
        landingPage: data.landingPage,
        country: data.country,
        city: data.city,
        deviceType: data.deviceType as any,
      })
      .returning();

    return result[0];
  },

  /**
   * Find active visit by session ID
   */
  async findActiveVisitBySessionId(sessionId: string) {
    const result = await db.query.campaignVisitsTable.findFirst({
      where: and(
        eq(campaignVisitsTable.sessionId, sessionId),
        gte(campaignVisitsTable.expiresAt, new Date())
      ),
      orderBy: desc(campaignVisitsTable.visitedAt),
    });

    return result;
  },

  /**
   * Find all active visits by session ID (for last-touch attribution)
   */
  async findAllActiveVisitsBySessionId(sessionId: string) {
    const result = await db.query.campaignVisitsTable.findMany({
      where: and(
        eq(campaignVisitsTable.sessionId, sessionId),
        gte(campaignVisitsTable.expiresAt, new Date())
      ),
      orderBy: desc(campaignVisitsTable.visitedAt),
    });

    return result;
  },

  /**
   * Update visit activity
   */
  async updateVisitActivity(id: string) {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Extend by 30 days

    const result = await db
      .update(campaignVisitsTable)
      .set({
        lastActivityAt: now,
        expiresAt: expiresAt,
      })
      .where(eq(campaignVisitsTable.id, id))
      .returning();

    return result[0];
  },

  /**
   * Mark visit as converted
   */
  async markVisitAsConverted(
    visitId: string,
    orderId: string,
    customerId: string
  ) {
    const result = await db
      .update(campaignVisitsTable)
      .set({
        converted: true,
        conversionAt: new Date(),
        attributedOrderId: orderId,
        customerId: customerId,
      })
      .where(eq(campaignVisitsTable.id, visitId))
      .returning();

    return result[0];
  },

  /**
   * Get visits for a campaign
   */
  async getVisitsForCampaign(campaignId: string) {
    const result = await db.query.campaignVisitsTable.findMany({
      where: eq(campaignVisitsTable.campaignId, campaignId),
      orderBy: desc(campaignVisitsTable.visitedAt),
    });

    return result;
  },

  /**
   * Get active visits for a campaign
   */
  async getActiveVisitsForCampaign(campaignId: string) {
    const result = await db.query.campaignVisitsTable.findMany({
      where: and(
        eq(campaignVisitsTable.campaignId, campaignId),
        gte(campaignVisitsTable.expiresAt, new Date())
      ),
      orderBy: desc(campaignVisitsTable.visitedAt),
    });

    return result;
  },

  // ==================== CONVERSION TRACKING ====================

  /**
   * Create a conversion record
   */
  async createConversion(data: {
    campaignId: string;
    visitId: string;
    orderId: string;
    customerId: string;
    revenue: string;
  }) {
    const result = await db
      .insert(campaignConversionsTable)
      .values(data)
      .returning();

    return result[0];
  },

  /**
   * Get conversions for a campaign
   */
  async getConversionsForCampaign(campaignId: string) {
    const result = await db.query.campaignConversionsTable.findMany({
      where: eq(campaignConversionsTable.campaignId, campaignId),
      with: {
        order: true,
        customer: true,
      },
      orderBy: desc(campaignConversionsTable.convertedAt),
    });

    return result;
  },

  // ==================== ANALYTICS QUERIES ====================

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string, startDate?: Date, endDate?: Date) {
    const conditions = [eq(campaignVisitsTable.campaignId, campaignId)];

    if (startDate) {
      conditions.push(gte(campaignVisitsTable.visitedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(campaignVisitsTable.visitedAt, endDate));
    }

    const result = await db
      .select({
        totalVisits: sql<number>`COUNT(*)::int`,
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${campaignVisitsTable.sessionId})::int`,
        totalConversions: sql<number>`COUNT(*) FILTER (WHERE ${campaignVisitsTable.converted} = true)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(
          CASE WHEN ${campaignVisitsTable.converted} = true
          THEN (SELECT ${ordersTable.total} FROM ${ordersTable} WHERE ${ordersTable.id} = ${campaignVisitsTable.attributedOrderId})
          ELSE 0 END
        ), 0)`,
      })
      .from(campaignVisitsTable)
      .where(and(...conditions));

    return result[0];
  },

  /**
   * Get timeline data for campaign
   */
  async getCampaignTimeline(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const conditions = [eq(campaignVisitsTable.campaignId, campaignId)];

    if (startDate) {
      conditions.push(gte(campaignVisitsTable.visitedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(campaignVisitsTable.visitedAt, endDate));
    }

    const result = await db
      .select({
        date: sql<string>`DATE(${campaignVisitsTable.visitedAt})`,
        visits: sql<number>`COUNT(*)::int`,
        conversions: sql<number>`COUNT(*) FILTER (WHERE ${campaignVisitsTable.converted} = true)::int`,
        revenue: sql<string>`COALESCE(SUM(
          CASE WHEN ${campaignVisitsTable.converted} = true
          THEN (SELECT ${ordersTable.total} FROM ${ordersTable} WHERE ${ordersTable.id} = ${campaignVisitsTable.attributedOrderId})
          ELSE 0 END
        ), 0)`,
      })
      .from(campaignVisitsTable)
      .where(and(...conditions))
      .groupBy(sql`DATE(${campaignVisitsTable.visitedAt})`)
      .orderBy(sql`DATE(${campaignVisitsTable.visitedAt})`);

    return result;
  },

  /**
   * Get top products from campaign conversions
   */
  async getTopProductsFromCampaign(campaignId: string, limit: number = 10) {
    const result = await db
      .select({
        productId: productsTable.id,
        productName: productsTable.name,
        quantitySold: sql<number>`SUM(${orderItemsTable.quantity})::int`,
        revenue: sql<string>`SUM(${orderItemsTable.totalPrice})`,
      })
      .from(campaignConversionsTable)
      .innerJoin(
        orderItemsTable,
        eq(campaignConversionsTable.orderId, orderItemsTable.orderId)
      )
      .innerJoin(
        productVariantsTable,
        eq(orderItemsTable.productVariantId, productVariantsTable.id)
      )
      .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
      .where(eq(campaignConversionsTable.campaignId, campaignId))
      .groupBy(productsTable.id, productsTable.name)
      .orderBy(desc(sql`SUM(${orderItemsTable.totalPrice})`))
      .limit(limit);

    return result;
  },

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(campaignId: string) {
    const result = await db
      .select({
        deviceType: campaignVisitsTable.deviceType,
        visits: sql<number>`COUNT(*)::int`,
        conversions: sql<number>`COUNT(*) FILTER (WHERE ${campaignVisitsTable.converted} = true)::int`,
      })
      .from(campaignVisitsTable)
      .where(eq(campaignVisitsTable.campaignId, campaignId))
      .groupBy(campaignVisitsTable.deviceType)
      .orderBy(desc(sql`COUNT(*)`));

    return result;
  },

  /**
   * Get geographic breakdown
   */
  async getGeographicBreakdown(campaignId: string) {
    const result = await db
      .select({
        country: campaignVisitsTable.country,
        visits: sql<number>`COUNT(*)::int`,
        conversions: sql<number>`COUNT(*) FILTER (WHERE ${campaignVisitsTable.converted} = true)::int`,
        revenue: sql<string>`COALESCE(SUM(
          CASE WHEN ${campaignVisitsTable.converted} = true
          THEN (SELECT ${ordersTable.total} FROM ${ordersTable} WHERE ${ordersTable.id} = ${campaignVisitsTable.attributedOrderId})
          ELSE 0 END
        ), 0)`,
      })
      .from(campaignVisitsTable)
      .where(eq(campaignVisitsTable.campaignId, campaignId))
      .groupBy(campaignVisitsTable.country)
      .orderBy(desc(sql`COUNT(*)`));

    return result;
  },

  /**
   * Get campaign leaderboard
   */
  async getCampaignLeaderboard(metric: 'roi' | 'revenue' | 'conversions' | 'visits', limit: number = 10) {
    // First, get all campaigns with their metrics
    const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.isActive, true));

    const campaignStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await this.getCampaignMetrics(campaign.id);
        const cost = parseFloat(campaign.cost);
        const revenue = parseFloat(metrics.totalRevenue);
        const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          platform: campaign.platform,
          trackingCode: campaign.trackingCode,
          cost: campaign.cost,
          visits: metrics.totalVisits,
          conversions: metrics.totalConversions,
          revenue: metrics.totalRevenue,
          roi: roi.toFixed(2),
        };
      })
    );

    // Sort by the specified metric
    campaignStats.sort((a, b) => {
      if (metric === 'roi') {
        return parseFloat(b.roi) - parseFloat(a.roi);
      } else if (metric === 'revenue') {
        return parseFloat(b.revenue) - parseFloat(a.revenue);
      } else if (metric === 'conversions') {
        return b.conversions - a.conversions;
      } else {
        return b.visits - a.visits;
      }
    });

    return campaignStats.slice(0, limit);
  },

  /**
   * Generate tracking code
   */
  generateTrackingCode(name: string, platform: string): string {
    const sanitized = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20);
    const platformPrefix = platform.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${platformPrefix}_${sanitized}_${timestamp}`;
  },
};
