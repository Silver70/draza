import { pgTable, text, timestamp, uuid, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customersTable } from './customer';
import { addressesTable } from './address';
import { productVariantsTable } from './catalogue';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const ordersTable = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customersTable.id),
  shippingAddressId: uuid('shipping_address_id')
    .notNull()
    .references(() => addressesTable.id),
  billingAddressId: uuid('billing_address_id')
    .notNull()
    .references(() => addressesTable.id),
  status: orderStatusEnum('status').notNull().default('pending'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderItemsTable = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  productVariantId: uuid('product_variant_id')
    .notNull()
    .references(() => productVariantsTable.id),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [ordersTable.customerId],
    references: [customersTable.id],
  }),
  shippingAddress: one(addressesTable, {
    fields: [ordersTable.shippingAddressId],
    references: [addressesTable.id],
    relationName: 'shipping_address',
  }),
  billingAddress: one(addressesTable, {
    fields: [ordersTable.billingAddressId],
    references: [addressesTable.id],
    relationName: 'billing_address',
  }),
  items: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
  productVariant: one(productVariantsTable, {
    fields: [orderItemsTable.productVariantId],
    references: [productVariantsTable.id],
  }),
}));
