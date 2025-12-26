import { pgTable, text, timestamp, uuid, numeric, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Shipping calculation types
export const shippingCalculationTypeEnum = pgEnum('shipping_calculation_type', [
  'flat_rate',      // Fixed price regardless of order
  'weight_based',   // Based on total weight
  'price_tier',     // Based on order subtotal
  'free_threshold', // Free over certain amount, flat rate below
]);

// Shipping carriers
export const shippingCarrierEnum = pgEnum('shipping_carrier', [
  'usps',
  'fedex',
  'ups',
  'dhl',
  'other',
]);

// Shipping methods (Standard, Express, Overnight, etc.)
export const shippingMethodsTable = pgTable('shipping_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g., "Standard Shipping", "Express", "Overnight"
  displayName: text('display_name').notNull(), // User-facing name
  description: text('description'),
  carrier: shippingCarrierEnum('carrier').notNull(),
  calculationType: shippingCalculationTypeEnum('calculation_type').notNull(),
  baseRate: numeric('base_rate', { precision: 10, scale: 2 }).notNull(), // Base/flat rate
  freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }), // Free over this amount
  estimatedDaysMin: integer('estimated_days_min'), // Min delivery days
  estimatedDaysMax: integer('estimated_days_max'), // Max delivery days
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0), // For sorting in UI
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Shipping rate tiers for weight or price-based calculations
export const shippingRateTiersTable = pgTable('shipping_rate_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  shippingMethodId: uuid('shipping_method_id')
    .notNull()
    .references(() => shippingMethodsTable.id, { onDelete: 'cascade' }),
  minValue: numeric('min_value', { precision: 10, scale: 2 }).notNull(), // Min weight (lbs) or price
  maxValue: numeric('max_value', { precision: 10, scale: 2 }), // null means no max
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(), // Shipping cost for this tier
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const shippingMethodsRelations = relations(shippingMethodsTable, ({ many }) => ({
  rateTiers: many(shippingRateTiersTable),
}));

export const shippingRateTiersRelations = relations(shippingRateTiersTable, ({ one }) => ({
  shippingMethod: one(shippingMethodsTable, {
    fields: [shippingRateTiersTable.shippingMethodId],
    references: [shippingMethodsTable.id],
  }),
}));
