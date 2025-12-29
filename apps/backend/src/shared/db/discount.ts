import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productsTable, collectionsTable } from "./catalogue";
import { ordersTable } from "./order";

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
]);

export const discountScopeEnum = pgEnum("discount_scope", [
  "store_wide",
  "collection",
  "product",
  "code",
]);

// Core discounts table
export const discountsTable = pgTable("discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  scope: discountScopeEnum("scope").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(10),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Discount codes table (for code-based discounts)
export const discountCodesTable = pgTable("discount_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  discountId: uuid("discount_id")
    .notNull()
    .references(() => discountsTable.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  minimumOrderValue: numeric("minimum_order_value", {
    precision: 10,
    scale: 2,
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Junction table: Discounts <-> Products
export const discountProductsTable = pgTable(
  "discount_products",
  {
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discountsTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.discountId, table.productId] }),
  })
);

// Junction table: Discounts <-> Collections
export const discountCollectionsTable = pgTable(
  "discount_collections",
  {
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discountsTable.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.discountId, table.collectionId] }),
  })
);

// Track applied discounts in orders
export const orderDiscountsTable = pgTable("order_discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  discountId: uuid("discount_id").references(() => discountsTable.id),
  code: text("code"),
  discountType: discountTypeEnum("discount_type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  appliedAmount: numeric("applied_amount", { precision: 10, scale: 2 })
    .notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const discountsRelations = relations(discountsTable, ({ many }) => ({
  codes: many(discountCodesTable),
  discountProducts: many(discountProductsTable),
  discountCollections: many(discountCollectionsTable),
  orderDiscounts: many(orderDiscountsTable),
}));

export const discountCodesRelations = relations(
  discountCodesTable,
  ({ one }) => ({
    discount: one(discountsTable, {
      fields: [discountCodesTable.discountId],
      references: [discountsTable.id],
    }),
  })
);

export const discountProductsRelations = relations(
  discountProductsTable,
  ({ one }) => ({
    discount: one(discountsTable, {
      fields: [discountProductsTable.discountId],
      references: [discountsTable.id],
    }),
    product: one(productsTable, {
      fields: [discountProductsTable.productId],
      references: [productsTable.id],
    }),
  })
);

export const discountCollectionsRelations = relations(
  discountCollectionsTable,
  ({ one }) => ({
    discount: one(discountsTable, {
      fields: [discountCollectionsTable.discountId],
      references: [discountsTable.id],
    }),
    collection: one(collectionsTable, {
      fields: [discountCollectionsTable.collectionId],
      references: [collectionsTable.id],
    }),
  })
);

export const orderDiscountsRelations = relations(
  orderDiscountsTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [orderDiscountsTable.orderId],
      references: [ordersTable.id],
    }),
    discount: one(discountsTable, {
      fields: [orderDiscountsTable.discountId],
      references: [discountsTable.id],
    }),
  })
);
