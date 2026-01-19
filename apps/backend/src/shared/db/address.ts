import { pgTable, text, timestamp, boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customersTable } from './customer';
import { ordersTable } from './order';

export const addressesTable = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(), // Tenant isolation
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customersTable.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  streetAddress: text('street_address').notNull(),
  apartment: text('apartment'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: text('country').notNull().default('USA'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const addressesRelations = relations(addressesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [addressesTable.customerId],
    references: [customersTable.id],
  }),
  shippingOrders: many(ordersTable, {
    relationName: 'shipping_address',
  }),
  billingOrders: many(ordersTable, {
    relationName: 'billing_address',
  }),
}));
