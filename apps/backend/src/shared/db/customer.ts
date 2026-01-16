import {  pgTable, text, timestamp, boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { usersTable } from './user';
import { addressesTable } from './address';
import { ordersTable } from './order';



export const customersTable = pgTable('customers_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => usersTable.id),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone_number: varchar('phone_number', {length: 20}).notNull().unique(),
  is_guest: boolean('is_guest').notNull().default(false),
  acquisition_campaign_id: uuid('acquisition_campaign_id'), // First campaign that acquired this customer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const customersRelations = relations(customersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [customersTable.user_id],
    references: [usersTable.id],
  }),
  addresses: many(addressesTable),
  orders: many(ordersTable),
}));

export type InsertCustomer = typeof customersTable.$inferInsert;
export type SelectCustomer = typeof customersTable.$inferSelect;