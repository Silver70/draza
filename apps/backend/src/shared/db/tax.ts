import { pgTable, text, timestamp, uuid, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { productsTable } from './catalogue';

// Tax jurisdiction types (state, county, city, etc.)
export const jurisdictionTypeEnum = pgEnum('jurisdiction_type', [
  'country',
  'state',
  'county',
  'city',
]);

// Tax jurisdictions (states, counties, cities)
export const taxJurisdictionsTable = pgTable('tax_jurisdictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(), // Tenant isolation
  name: text('name').notNull(), // e.g., "California", "Los Angeles County"
  type: jurisdictionTypeEnum('type').notNull(),
  country: text('country').notNull().default('USA'),
  stateCode: text('state_code'), // e.g., "CA", "NY" - for state-level lookup
  countyName: text('county_name'), // for county-level lookup
  cityName: text('city_name'), // for city-level lookup
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(), // e.g., 0.0725 for 7.25%
  effectiveFrom: timestamp('effective_from').notNull().defaultNow(),
  effectiveTo: timestamp('effective_to'), // null means currently active
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Product-specific tax settings
export const productTaxSettingsTable = pgTable('product_tax_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => productsTable.id, { onDelete: 'cascade' })
    .unique(),
  isTaxExempt: boolean('is_tax_exempt').notNull().default(false),
  exemptionCategory: text('exemption_category'), // e.g., "food", "medical", "clothing"
  exemptionReason: text('exemption_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const taxJurisdictionsRelations = relations(taxJurisdictionsTable, () => ({
  // Could add relations to orders if we want to query "all orders in this jurisdiction"
}));

export const productTaxSettingsRelations = relations(productTaxSettingsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [productTaxSettingsTable.productId],
    references: [productsTable.id],
  }),
}));
