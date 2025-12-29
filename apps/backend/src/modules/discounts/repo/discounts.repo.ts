import { eq, and, gte, lte, isNull, or, sql } from "drizzle-orm";
import { db } from "../../../shared/db";
import {
  discountsTable,
  discountCodesTable,
  discountProductsTable,
  discountCollectionsTable,
  orderDiscountsTable,
} from "../../../shared/db/discount";
import {
  productsTable,
  collectionsTable,
} from "../../../shared/db/catalogue";
import {
  NewDiscount,
  UpdateDiscount,
  NewDiscountCode,
  UpdateDiscountCode,
  NewDiscountProduct,
  NewDiscountCollection,
  NewOrderDiscount,
} from "../discounts.types";

export const discountsRepo = {
  async createDiscount(data: NewDiscount) {
    const [newDiscount] = await db
      .insert(discountsTable)
      .values(data)
      .returning();
    return newDiscount;
  },

  async getDiscountById(id: string) {
    const discount = await db
      .select()
      .from(discountsTable)
      .where(eq(discountsTable.id, id))
      .limit(1);
    return discount[0];
  },

  async getAllDiscounts() {
    const discounts = await db.select().from(discountsTable);
    return discounts;
  },

  async getActiveDiscounts() {
    const now = new Date();
    const discounts = await db
      .select()
      .from(discountsTable)
      .where(
        and(
          eq(discountsTable.isActive, true),
          lte(discountsTable.startsAt, now),
          or(isNull(discountsTable.endsAt), gte(discountsTable.endsAt, now))
        )
      );
    return discounts;
  },

  async getDiscountsByScope(scope: "store_wide" | "collection" | "product" | "code") {
    const discounts = await db
      .select()
      .from(discountsTable)
      .where(eq(discountsTable.scope, scope));
    return discounts;
  },

  async updateDiscount(id: string, data: UpdateDiscount) {
    const [updatedDiscount] = await db
      .update(discountsTable)
      .set(data)
      .where(eq(discountsTable.id, id))
      .returning();
    return updatedDiscount;
  },

  async deleteDiscount(id: string) {
    await db.delete(discountsTable).where(eq(discountsTable.id, id));
  },

  async getDiscountWithDetails(id: string) {
    const discount = await db
      .select()
      .from(discountsTable)
      .where(eq(discountsTable.id, id))
      .limit(1);

    if (!discount[0]) return null;

    const codes = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.discountId, id));

    const discountProducts = await db
      .select({
        discountId: discountProductsTable.discountId,
        productId: discountProductsTable.productId,
        product: {
          id: productsTable.id,
          name: productsTable.name,
          slug: productsTable.slug,
        },
      })
      .from(discountProductsTable)
      .leftJoin(
        productsTable,
        eq(discountProductsTable.productId, productsTable.id)
      )
      .where(eq(discountProductsTable.discountId, id));

    const discountCollections = await db
      .select({
        discountId: discountCollectionsTable.discountId,
        collectionId: discountCollectionsTable.collectionId,
        collection: {
          id: collectionsTable.id,
          name: collectionsTable.name,
          slug: collectionsTable.slug,
        },
      })
      .from(discountCollectionsTable)
      .leftJoin(
        collectionsTable,
        eq(discountCollectionsTable.collectionId, collectionsTable.id)
      )
      .where(eq(discountCollectionsTable.discountId, id));

    return {
      ...discount[0],
      codes,
      discountProducts,
      discountCollections,
    };
  },
};

export const discountCodesRepo = {
  async createDiscountCode(data: NewDiscountCode) {
    const [newCode] = await db
      .insert(discountCodesTable)
      .values(data)
      .returning();
    return newCode;
  },

  async getDiscountCodeById(id: string) {
    const code = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.id, id))
      .limit(1);
    return code[0];
  },

  async getDiscountCodeByCode(code: string) {
    const discountCode = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.code, code))
      .limit(1);
    return discountCode[0];
  },

  async getDiscountCodesByDiscountId(discountId: string) {
    const codes = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.discountId, discountId));
    return codes;
  },

  async updateDiscountCode(id: string, data: UpdateDiscountCode) {
    const [updatedCode] = await db
      .update(discountCodesTable)
      .set(data)
      .where(eq(discountCodesTable.id, id))
      .returning();
    return updatedCode;
  },

  async deleteDiscountCode(id: string) {
    await db.delete(discountCodesTable).where(eq(discountCodesTable.id, id));
  },

  async incrementUsageCount(id: string) {
    const [updatedCode] = await db
      .update(discountCodesTable)
      .set({ usageCount: sql`${discountCodesTable.usageCount} + 1` })
      .where(eq(discountCodesTable.id, id))
      .returning();
    return updatedCode;
  },
};

export const discountProductsRepo = {
  async addProductToDiscount(data: NewDiscountProduct) {
    const [newDiscountProduct] = await db
      .insert(discountProductsTable)
      .values(data)
      .returning();
    return newDiscountProduct;
  },

  async removeProductFromDiscount(discountId: string, productId: string) {
    await db
      .delete(discountProductsTable)
      .where(
        and(
          eq(discountProductsTable.discountId, discountId),
          eq(discountProductsTable.productId, productId)
        )
      );
  },

  async getProductsByDiscountId(discountId: string) {
    const products = await db
      .select({
        discountId: discountProductsTable.discountId,
        productId: discountProductsTable.productId,
        product: productsTable,
      })
      .from(discountProductsTable)
      .leftJoin(
        productsTable,
        eq(discountProductsTable.productId, productsTable.id)
      )
      .where(eq(discountProductsTable.discountId, discountId));
    return products;
  },

  async getDiscountsByProductId(productId: string) {
    const discounts = await db
      .select({
        discount: discountsTable,
      })
      .from(discountProductsTable)
      .leftJoin(
        discountsTable,
        eq(discountProductsTable.discountId, discountsTable.id)
      )
      .where(eq(discountProductsTable.productId, productId));
    return discounts;
  },
};

export const discountCollectionsRepo = {
  async addCollectionToDiscount(data: NewDiscountCollection) {
    const [newDiscountCollection] = await db
      .insert(discountCollectionsTable)
      .values(data)
      .returning();
    return newDiscountCollection;
  },

  async removeCollectionFromDiscount(
    discountId: string,
    collectionId: string
  ) {
    await db
      .delete(discountCollectionsTable)
      .where(
        and(
          eq(discountCollectionsTable.discountId, discountId),
          eq(discountCollectionsTable.collectionId, collectionId)
        )
      );
  },

  async getCollectionsByDiscountId(discountId: string) {
    const collections = await db
      .select({
        discountId: discountCollectionsTable.discountId,
        collectionId: discountCollectionsTable.collectionId,
        collection: collectionsTable,
      })
      .from(discountCollectionsTable)
      .leftJoin(
        collectionsTable,
        eq(discountCollectionsTable.collectionId, collectionsTable.id)
      )
      .where(eq(discountCollectionsTable.discountId, discountId));
    return collections;
  },

  async getDiscountsByCollectionId(collectionId: string) {
    const discounts = await db
      .select({
        discount: discountsTable,
      })
      .from(discountCollectionsTable)
      .leftJoin(
        discountsTable,
        eq(discountCollectionsTable.discountId, discountsTable.id)
      )
      .where(eq(discountCollectionsTable.collectionId, collectionId));
    return discounts;
  },
};

export const orderDiscountsRepo = {
  async createOrderDiscount(data: NewOrderDiscount) {
    const [newOrderDiscount] = await db
      .insert(orderDiscountsTable)
      .values(data)
      .returning();
    return newOrderDiscount;
  },

  async getOrderDiscountsByOrderId(orderId: string) {
    const orderDiscounts = await db
      .select()
      .from(orderDiscountsTable)
      .where(eq(orderDiscountsTable.orderId, orderId));
    return orderDiscounts;
  },
};
