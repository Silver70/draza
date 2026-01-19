import { campaignsRepo } from '../repo';
import type {
  Campaign,
  CampaignAnalytics,
  CampaignSummary,
  ParentCampaignAnalytics,
} from '../analytics.types';

export const campaignsService = {
  // ==================== CAMPAIGN MANAGEMENT ====================

  /**
   * Create a new campaign
   */
  createCampaign: async (organizationId: string, data: {
    parentCampaignId?: string;
    name: string;
    description?: string;
    platform: string;
    campaignType: string;
    postUrl?: string;
    cost?: number;
    budget?: number;
    startsAt?: string;
    endsAt?: string;
    metadata?: any;
  }): Promise<{ campaign: Campaign; trackingUrl: string }> => {
    // Generate tracking code
    const trackingCode = campaignsRepo.generateTrackingCode(
      data.name,
      data.platform
    );

    // Create campaign
    const campaign = await campaignsRepo.createCampaign({
      parentCampaignId: data.parentCampaignId,
      name: data.name,
      description: data.description,
      platform: data.platform,
      campaignType: data.campaignType,
      postUrl: data.postUrl,
      trackingCode,
      cost: (data.cost || 0).toFixed(2),
      budget: (data.budget || 0).toFixed(2),
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      metadata: data.metadata,
    }, organizationId);

    // Generate tracking URL (you'll replace with your actual domain)
    const trackingUrl = `${process.env.FRONTEND_URL || 'https://yourstore.com'}?utm_campaign=${trackingCode}`;

    return {
      campaign: campaign as Campaign,
      trackingUrl,
    };
  },

  /**
   * Get campaign by ID
   */
  getCampaignById: async (id: string, organizationId: string): Promise<Campaign | undefined> => {
    const campaign = await campaignsRepo.getCampaignById(id, organizationId);
    return campaign as Campaign | undefined;
  },

  /**
   * List campaigns with filters
   */
  listCampaigns: async (organizationId: string, filters: {
    platform?: string;
    isActive?: boolean;
    parentCampaignId?: string;
    search?: string;
  }): Promise<Campaign[]> => {
    const campaigns = await campaignsRepo.listCampaigns(filters, organizationId);
    return campaigns as Campaign[];
  },

  /**
   * Get child campaigns
   */
  getChildCampaigns: async (parentCampaignId: string, organizationId: string): Promise<Campaign[]> => {
    const campaigns = await campaignsRepo.getChildCampaigns(parentCampaignId, organizationId);
    return campaigns as Campaign[];
  },

  /**
   * Update campaign
   */
  updateCampaign: async (
    id: string,
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      postUrl?: string;
      cost?: number;
      budget?: number;
      startsAt?: string;
      endsAt?: string;
      isActive?: boolean;
      metadata?: any;
    }
  ): Promise<Campaign> => {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.postUrl !== undefined) updateData.postUrl = data.postUrl;
    if (data.cost !== undefined) updateData.cost = data.cost.toFixed(2);
    if (data.budget !== undefined) updateData.budget = data.budget.toFixed(2);
    if (data.startsAt) updateData.startsAt = new Date(data.startsAt);
    if (data.endsAt) updateData.endsAt = new Date(data.endsAt);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const campaign = await campaignsRepo.updateCampaign(id, updateData, organizationId);
    return campaign as Campaign;
  },

  /**
   * Delete campaign
   */
  deleteCampaign: async (id: string, organizationId: string): Promise<void> => {
    await campaignsRepo.deleteCampaign(id, organizationId);
  },

  /**
   * Activate campaign
   */
  activateCampaign: async (id: string, organizationId: string): Promise<Campaign> => {
    const campaign = await campaignsRepo.updateCampaign(id, { isActive: true }, organizationId);
    return campaign as Campaign;
  },

  /**
   * Deactivate campaign
   */
  deactivateCampaign: async (id: string, organizationId: string): Promise<Campaign> => {
    const campaign = await campaignsRepo.updateCampaign(id, { isActive: false }, organizationId);
    return campaign as Campaign;
  },

  // ==================== VISIT TRACKING ====================

  /**
   * Track a visit
   */
  trackVisit: async (organizationId: string, data: {
    trackingCode: string;
    sessionId: string;
    landingPage?: string;
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
    country?: string;
    city?: string;
  }): Promise<{ visitId: string; campaignId: string; expiresAt: Date }> => {
    // Find campaign by tracking code
    const campaign = await campaignsRepo.getCampaignByTrackingCode(
      data.trackingCode,
      organizationId
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.isActive) {
      throw new Error('Campaign is not active');
    }

    // Check if session already has an active visit
    const existingVisit = await campaignsRepo.findActiveVisitBySessionId(
      organizationId,
      data.sessionId
    );

    if (existingVisit && existingVisit.campaignId === campaign.id) {
      // Update existing visit activity
      const updated = await campaignsRepo.updateVisitActivity(organizationId, existingVisit.id);
      return {
        visitId: updated.id,
        campaignId: updated.campaignId,
        expiresAt: updated.expiresAt,
      };
    }

    // Detect device type from user agent
    let deviceType = 'other';
    if (data.userAgent) {
      const ua = data.userAgent.toLowerCase();
      if (/mobile|android|iphone|ipod/.test(ua)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/.test(ua)) {
        deviceType = 'tablet';
      } else if (/mozilla|chrome|safari|firefox/.test(ua)) {
        deviceType = 'desktop';
      }
    }

    // Create new visit
    const visit = await campaignsRepo.createVisit({
      campaignId: campaign.id,
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referrer: data.referrer,
      landingPage: data.landingPage,
      country: data.country,
      city: data.city,
      deviceType,
    }, organizationId);

    return {
      visitId: visit.id,
      campaignId: visit.campaignId,
      expiresAt: visit.expiresAt,
    };
  },

  /**
   * Update visit activity (extend expiration)
   */
  updateVisitActivity: async (organizationId: string, sessionId: string): Promise<void> => {
    const visit = await campaignsRepo.findActiveVisitBySessionId(organizationId, sessionId);
    if (visit) {
      await campaignsRepo.updateVisitActivity(organizationId, visit.id);
    }
  },

  /**
   * Process campaign attribution for an order
   * This should be called from the orders service when creating an order
   */
  attributeOrder: async (
    sessionId: string,
    orderId: string,
    customerId: string,
    orderTotal: string,
    organizationId: string
  ): Promise<void> => {
    // Find all active visits for this session (last-touch attribution)
    const visits = await campaignsRepo.findAllActiveVisitsBySessionId(sessionId);

    if (visits.length === 0) {
      return; // No campaign attribution
    }

    // Use the most recent visit (last-touch attribution)
    const lastVisit = visits[0];

    // Mark visit as converted
    await campaignsRepo.markVisitAsConverted(
      lastVisit.id,
      orderId,
      customerId
    );

    // Create conversion record
    await campaignsRepo.createConversion({
      campaignId: lastVisit.campaignId,
      visitId: lastVisit.id,
      orderId,
      customerId,
      revenue: orderTotal,
    }, organizationId);
  },

  /**
   * Get visits for a campaign
   */
  getVisitsForCampaign: async (campaignId: string, organizationId: string) => {
    return await campaignsRepo.getVisitsForCampaign(campaignId, organizationId);
  },

  /**
   * Get conversions for a campaign
   */
  getConversionsForCampaign: async (campaignId: string, organizationId: string) => {
    return await campaignsRepo.getConversionsForCampaign(campaignId, organizationId);
  },

  // ==================== ANALYTICS ====================

  /**
   * Get comprehensive campaign analytics
   */
  getCampaignAnalytics: async (
    campaignId: string,
    organizationId: string,
    options: {
      startDate?: string;
      endDate?: string;
      includeTimeline?: boolean;
      includeProducts?: boolean;
      includeDeviceBreakdown?: boolean;
      includeGeographic?: boolean;
    } = {}
  ): Promise<CampaignAnalytics> => {
    // Get campaign
    const campaign = await campaignsRepo.getCampaignById(campaignId, organizationId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Parse dates
    const startDate = options.startDate ? new Date(options.startDate) : undefined;
    const endDate = options.endDate ? new Date(options.endDate) : undefined;

    // Get metrics
    const metrics = await campaignsRepo.getCampaignMetrics(
      campaignId,
      organizationId,
      startDate,
      endDate
    );

    // Calculate additional metrics
    const cost = parseFloat(campaign.cost);
    const revenue = parseFloat(metrics.totalRevenue);
    const conversionRate =
      metrics.totalVisits > 0
        ? ((metrics.totalConversions / metrics.totalVisits) * 100).toFixed(2)
        : '0.00';
    const averageOrderValue =
      metrics.totalConversions > 0
        ? (revenue / metrics.totalConversions).toFixed(2)
        : '0.00';
    const roi = cost > 0 ? (((revenue - cost) / cost) * 100).toFixed(2) : '0.00';
    const costPerVisit =
      metrics.totalVisits > 0 ? (cost / metrics.totalVisits).toFixed(2) : '0.00';
    const costPerConversion =
      metrics.totalConversions > 0
        ? (cost / metrics.totalConversions).toFixed(2)
        : '0.00';

    const result: CampaignAnalytics = {
      campaign: campaign as Campaign,
      metrics: {
        totalVisits: metrics.totalVisits,
        uniqueVisitors: metrics.uniqueVisitors,
        totalConversions: metrics.totalConversions,
        conversionRate,
        totalRevenue: revenue.toFixed(2),
        averageOrderValue,
        roi,
        costPerVisit,
        costPerConversion,
      },
    };

    // Optional: Include timeline
    if (options.includeTimeline) {
      const timeline = await campaignsRepo.getCampaignTimeline(
        campaignId,
        organizationId,
        startDate,
        endDate
      );
      result.timeline = timeline.map((t) => ({
        date: t.date,
        visits: t.visits,
        conversions: t.conversions,
        revenue: parseFloat(t.revenue).toFixed(2),
      }));
    }

    // Optional: Include top products
    if (options.includeProducts) {
      const products = await campaignsRepo.getTopProductsFromCampaign(campaignId, organizationId);
      result.topProducts = products.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantitySold: p.quantitySold,
        revenue: parseFloat(p.revenue).toFixed(2),
      }));
    }

    // Optional: Include device breakdown
    if (options.includeDeviceBreakdown) {
      const devices = await campaignsRepo.getDeviceBreakdown(campaignId, organizationId);
      result.deviceBreakdown = devices.map((d) => ({
        deviceType: d.deviceType || 'unknown',
        visits: d.visits,
        conversions: d.conversions,
      }));
    }

    // Optional: Include geographic breakdown
    if (options.includeGeographic) {
      const geo = await campaignsRepo.getGeographicBreakdown(campaignId, organizationId);
      result.geographicBreakdown = geo.map((g) => ({
        country: g.country || 'Unknown',
        visits: g.visits,
        conversions: g.conversions,
        revenue: parseFloat(g.revenue).toFixed(2),
      }));
    }

    return result;
  },

  /**
   * Get parent campaign analytics with children
   */
  getParentCampaignAnalytics: async (
    parentCampaignId: string,
    organizationId: string
  ): Promise<ParentCampaignAnalytics> => {
    // Get parent campaign
    const campaign = await campaignsRepo.getCampaignById(parentCampaignId, organizationId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get child campaigns
    const children = await campaignsRepo.getChildCampaigns(parentCampaignId, organizationId);

    // Get metrics for all children
    const childMetrics = await Promise.all(
      children.map(async (child) => {
        const metrics = await campaignsRepo.getCampaignMetrics(child.id, organizationId);
        const cost = parseFloat(child.cost);
        const revenue = parseFloat(metrics.totalRevenue);
        const roi = cost > 0 ? (((revenue - cost) / cost) * 100).toFixed(2) : '0.00';

        return {
          id: child.id,
          name: child.name,
          platform: child.platform,
          trackingCode: child.trackingCode,
          cost: child.cost,
          visits: metrics.totalVisits,
          conversions: metrics.totalConversions,
          revenue: revenue.toFixed(2),
          roi,
        };
      })
    );

    // Aggregate metrics
    const totalVisits = childMetrics.reduce((sum, m) => sum + m.visits, 0);
    const totalConversions = childMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = childMetrics.reduce(
      (sum, m) => sum + parseFloat(m.revenue),
      0
    );
    const totalCost = childMetrics.reduce((sum, m) => sum + parseFloat(m.cost), 0);

    // Calculate unique visitors across all children
    const uniqueVisitors = totalVisits; // Simplified - could do actual unique count

    const conversionRate =
      totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(2) : '0.00';
    const averageOrderValue =
      totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0.00';
    const roi =
      totalCost > 0
        ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(2)
        : '0.00';
    const costPerConversion =
      totalConversions > 0 ? (totalCost / totalConversions).toFixed(2) : '0.00';

    // Platform breakdown
    const platformMap = new Map<string, { visits: number; conversions: number; revenue: number }>();
    childMetrics.forEach((m) => {
      const existing = platformMap.get(m.platform) || {
        visits: 0,
        conversions: 0,
        revenue: 0,
      };
      platformMap.set(m.platform, {
        visits: existing.visits + m.visits,
        conversions: existing.conversions + m.conversions,
        revenue: existing.revenue + parseFloat(m.revenue),
      });
    });

    const platformBreakdown = Array.from(platformMap.entries()).map(
      ([platform, data]) => ({
        platform,
        visits: data.visits,
        conversions: data.conversions,
        revenue: data.revenue.toFixed(2),
      })
    );

    return {
      campaign: campaign as Campaign,
      metrics: {
        totalVisits,
        uniqueVisitors,
        totalConversions,
        conversionRate,
        totalRevenue: totalRevenue.toFixed(2),
        averageOrderValue,
        roi,
        costPerConversion,
      },
      children: childMetrics,
      platformBreakdown,
    };
  },

  /**
   * Get campaign leaderboard
   */
  getCampaignLeaderboard: async (
    organizationId: string,
    metric: 'roi' | 'revenue' | 'conversions' | 'visits' = 'roi',
    limit: number = 10
  ): Promise<CampaignSummary[]> => {
    return await campaignsRepo.getCampaignLeaderboard(organizationId, metric, limit);
  },

  /**
   * Get overview of all campaigns
   */
  getCampaignsOverview: async (organizationId: string) => {
    const campaigns = await campaignsRepo.listCampaigns({ isActive: true }, organizationId);

    const stats = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await campaignsRepo.getCampaignMetrics(campaign.id, organizationId);
        return {
          totalVisits: metrics.totalVisits,
          totalConversions: metrics.totalConversions,
          totalRevenue: parseFloat(metrics.totalRevenue),
          totalCost: parseFloat(campaign.cost),
        };
      })
    );

    const totals = stats.reduce(
      (acc, stat) => ({
        visits: acc.visits + stat.totalVisits,
        conversions: acc.conversions + stat.totalConversions,
        revenue: acc.revenue + stat.totalRevenue,
        cost: acc.cost + stat.totalCost,
      }),
      { visits: 0, conversions: 0, revenue: 0, cost: 0 }
    );

    const roi =
      totals.cost > 0
        ? (((totals.revenue - totals.cost) / totals.cost) * 100).toFixed(2)
        : '0.00';
    const conversionRate =
      totals.visits > 0
        ? ((totals.conversions / totals.visits) * 100).toFixed(2)
        : '0.00';

    return {
      totalCampaigns: campaigns.length,
      totalVisits: totals.visits,
      totalConversions: totals.conversions,
      totalRevenue: totals.revenue.toFixed(2),
      totalCost: totals.cost.toFixed(2),
      overallROI: roi,
      conversionRate,
    };
  },
};
