import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orderItemsTable } from "./order";

// Image type enum - for different use cases
export const imageTypeEnum = pgEnum("image_type", [
  "thumbnail",  // Small preview image
  "gallery",    // Main gallery images
  "hero",       // Large hero/banner images
  "zoom",       // High-resolution zoomable images
]);

//@ts-ignore
export const categoriesTable = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  //@ts-ignore
  parentId: uuid("parent_id").references(() => categoriesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const productsTable = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const productVariantsTable = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  sku: text("sku").notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const attributesTable = pgTable("attributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const attributeValuesTable = pgTable("attribute_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  attributeId: uuid("attribute_id")
    .notNull()
    .references(() => attributesTable.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
});

export const productVariantAttributesTable = pgTable(
  "product_variant_attributes",
  {
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: "cascade" }),
    attributeValueId: uuid("attribute_value_id")
      .notNull()
      .references(() => attributeValuesTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.productVariantId, table.attributeValueId],
    }),
  })
);

export const collectionsTable = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const collectionProductsTable = pgTable(
  "collection_products",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    position: integer("position"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.productId] }),
  })
);

// Product-level images (general/marketing images)
export const productImagesTable = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(), // Image URL or path
  altText: text("alt_text"), // Accessibility text
  type: imageTypeEnum("type").default("gallery"),
  position: integer("position").notNull().default(0), // Display order
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Variant-level images (variant-specific images, e.g., different colors)
export const productVariantImagesTable = pgTable("product_variant_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  type: imageTypeEnum("type").default("gallery"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
  parent: one(categoriesTable, {
    fields: [categoriesTable.parentId],
    references: [categoriesTable.id],
    relationName: "parent_children",
  }),
  children: many(categoriesTable, {
    relationName: "parent_children",
  }),
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.categoryId],
    references: [categoriesTable.id],
  }),
  variants: many(productVariantsTable),
  images: many(productImagesTable),
}));

export const productVariantsRelations = relations(
  productVariantsTable,
  ({ one, many }) => ({
    product: one(productsTable, {
      fields: [productVariantsTable.productId],
      references: [productsTable.id],
    }),
    attributes: many(productVariantAttributesTable),
    orderItems: many(orderItemsTable),
    images: many(productVariantImagesTable),
  })
);

export const attributesRelations = relations(attributesTable, ({ many }) => ({
  values: many(attributeValuesTable),
}));

export const attributeValuesRelations = relations(
  attributeValuesTable,
  ({ one, many }) => ({
    attribute: one(attributesTable, {
      fields: [attributeValuesTable.attributeId],
      references: [attributesTable.id],
    }),
    productVariants: many(productVariantAttributesTable),
  })
);

export const productVariantAttributesRelations = relations(
  productVariantAttributesTable,
  ({ one }) => ({
    productVariant: one(productVariantsTable, {
      fields: [productVariantAttributesTable.productVariantId],
      references: [productVariantsTable.id],
    }),
    attributeValue: one(attributeValuesTable, {
      fields: [productVariantAttributesTable.attributeValueId],
      references: [attributeValuesTable.id],
    }),
  })
);

export const collectionsRelations = relations(collectionsTable, ({ many }) => ({
  collectionProducts: many(collectionProductsTable),
}));

export const collectionProductsRelations = relations(
  collectionProductsTable,
  ({ one }) => ({
    collection: one(collectionsTable, {
      fields: [collectionProductsTable.collectionId],
      references: [collectionsTable.id],
    }),
    product: one(productsTable, {
      fields: [collectionProductsTable.productId],
      references: [productsTable.id],
    }),
  })
);

export const productImagesRelations = relations(
  productImagesTable,
  ({ one }) => ({
    product: one(productsTable, {
      fields: [productImagesTable.productId],
      references: [productsTable.id],
    }),
  })
);

export const productVariantImagesRelations = relations(
  productVariantImagesTable,
  ({ one }) => ({
    productVariant: one(productVariantsTable, {
      fields: [productVariantImagesTable.productVariantId],
      references: [productVariantsTable.id],
    }),
  })
);
