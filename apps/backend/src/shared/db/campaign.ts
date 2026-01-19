import { pgTable, text, timestamp, uuid, numeric, integer, boolean, date, pgEnum, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customersTable } from './customer';
import { ordersTable } from './order';

// Enums
export const platformEnum = pgEnum('campaign_platform', [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'twitter',
  'multi',
  'other',
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'post',
  'reel',
  'story',
  'video',
  'ad',
  'campaign', // For parent campaigns
]);

export const deviceTypeEnum = pgEnum('device_type', [
  'mobile',
  'tablet',
  'desktop',
  'other',
]);

// ==================== CAMPAIGNS TABLE ====================

export const campaignsTable = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(), // Tenant isolation
  parentCampaignId: uuid('parent_campaign_id').references((): any => campaignsTable.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  platform: platformEnum('platform').notNull(),
  campaignType: campaignTypeEnum('campaign_type').notNull(),
  postUrl: text('post_url'),
  trackingCode: text('tracking_code').notNull().unique(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  budget: numeric('budget', { precision: 10, scale: 2 }).notNull().default('0'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'), // For hashtags, influencer info, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ==================== CAMPAIGN VISITS TABLE ====================

export const campaignVisitsTable = pgTable('campaign_visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(), // Tenant isolation
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaignsTable.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  customerId: uuid('customer_id').references(() => customersTable.id, {
    onDelete: 'set null',
  }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  landingPage: text('landing_page'),
  country: text('country'),
  city: text('city'),
  deviceType: deviceTypeEnum('device_type'),
  visitedAt: timestamp('visited_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  converted: boolean('converted').notNull().default(false),
  conversionAt: timestamp('conversion_at'),
  attributedOrderId: uuid('attributed_order_id').references(() => ordersTable.id, {
    onDelete: 'set null',
  }),
  expiresAt: timestamp('expires_at')
    .notNull()
    .$default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days from now
      return date;
    }),
});

// ==================== CAMPAIGN CONVERSIONS TABLE ====================

export const campaignConversionsTable = pgTable('campaign_conversions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(), // Tenant isolation
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaignsTable.id, { onDelete: 'cascade' }),
  visitId: uuid('visit_id')
    .notNull()
    .references(() => campaignVisitsTable.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customersTable.id, { onDelete: 'cascade' }),
  revenue: numeric('revenue', { precision: 10, scale: 2 }).notNull(),
  convertedAt: timestamp('converted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==================== CAMPAIGN ANALYTICS SNAPSHOTS TABLE ====================

export const campaignAnalyticsSnapshotsTable = pgTable(
  'campaign_analytics_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaignsTable.id, { onDelete: 'cascade' }),
    snapshotDate: date('snapshot_date').notNull(),
    snapshotHour: integer('snapshot_hour'), // NULL for daily, 0-23 for hourly
    totalVisits: integer('total_visits').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    totalConversions: integer('total_conversions').notNull().default(0),
    totalRevenue: numeric('total_revenue', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    conversionRate: numeric('conversion_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    roi: numeric('roi', { precision: 10, scale: 2 }).notNull().default('0'),
    averageOrderValue: numeric('average_order_value', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate snapshots
    uniqueSnapshot: unique().on(table.campaignId, table.snapshotDate, table.snapshotHour),
  })
);

// ==================== RELATIONS ====================

export const campaignsRelations = relations(campaignsTable, ({ one, many }) => ({
  parentCampaign: one(campaignsTable, {
    fields: [campaignsTable.parentCampaignId],
    references: [campaignsTable.id],
    relationName: 'campaign_hierarchy',
  }),
  childCampaigns: many(campaignsTable, {
    relationName: 'campaign_hierarchy',
  }),
  visits: many(campaignVisitsTable),
  conversions: many(campaignConversionsTable),
  snapshots: many(campaignAnalyticsSnapshotsTable),
}));

export const campaignVisitsRelations = relations(campaignVisitsTable, ({ one }) => ({
  campaign: one(campaignsTable, {
    fields: [campaignVisitsTable.campaignId],
    references: [campaignsTable.id],
  }),
  customer: one(customersTable, {
    fields: [campaignVisitsTable.customerId],
    references: [customersTable.id],
  }),
  attributedOrder: one(ordersTable, {
    fields: [campaignVisitsTable.attributedOrderId],
    references: [ordersTable.id],
  }),
  conversion: one(campaignConversionsTable, {
    fields: [campaignVisitsTable.id],
    references: [campaignConversionsTable.visitId],
  }),
}));

export const campaignConversionsRelations = relations(
  campaignConversionsTable,
  ({ one }) => ({
    campaign: one(campaignsTable, {
      fields: [campaignConversionsTable.campaignId],
      references: [campaignsTable.id],
    }),
    visit: one(campaignVisitsTable, {
      fields: [campaignConversionsTable.visitId],
      references: [campaignVisitsTable.id],
    }),
    order: one(ordersTable, {
      fields: [campaignConversionsTable.orderId],
      references: [ordersTable.id],
    }),
    customer: one(customersTable, {
      fields: [campaignConversionsTable.customerId],
      references: [customersTable.id],
    }),
  })
);

export const campaignAnalyticsSnapshotsRelations = relations(
  campaignAnalyticsSnapshotsTable,
  ({ one }) => ({
    campaign: one(campaignsTable, {
      fields: [campaignAnalyticsSnapshotsTable.campaignId],
      references: [campaignsTable.id],
    }),
  })
);
