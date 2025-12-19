import { eq } from "drizzle-orm";
import { db } from "../../../shared/db";
import { collectionsTable, collectionProductsTable } from "../../../shared/db/catalogue";
import { NewCollection, UpdateCollection, NewCollectionProduct } from "../products.types";

export const collectionsRepo = {
  async createCollection(data: NewCollection) {
    const [newCollection] = await db
      .insert(collectionsTable)
      .values(data)
      .returning();
    return newCollection;
  },

  async getCollectionById(id: string) {
    const collection = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .limit(1);
    return collection[0];
  },

  async getCollectionBySlug(slug: string) {
    const collection = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, slug))
      .limit(1);
    return collection[0];
  },

  async getAllCollections() {
    const collections = await db.select().from(collectionsTable);
    return collections;
  },

  async getActiveCollections() {
    const collections = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.isActive, true));
    return collections;
  },

  async updateCollection(id: string, data: UpdateCollection) {
    const [updatedCollection] = await db
      .update(collectionsTable)
      .set(data)
      .where(eq(collectionsTable.id, id))
      .returning();
    return updatedCollection;
  },

  async deleteCollection(id: string) {
    await db
      .delete(collectionsTable)
      .where(eq(collectionsTable.id, id));
  },
};

// Collection Products Repository
export const collectionProductsRepo = {
  async addProductToCollection(data: NewCollectionProduct) {
    const [newCollectionProduct] = await db
      .insert(collectionProductsTable)
      .values(data)
      .returning();
    return newCollectionProduct;
  },

  async getProductsByCollectionId(collectionId: string) {
    const products = await db
      .select()
      .from(collectionProductsTable)
      .where(eq(collectionProductsTable.collectionId, collectionId));
    return products;
  },

  async getCollectionsByProductId(productId: string) {
    const collections = await db
      .select()
      .from(collectionProductsTable)
      .where(eq(collectionProductsTable.productId, productId));
    return collections;
  },

  async removeProductFromCollection(collectionId: string, productId: string) {
    await db
      .delete(collectionProductsTable)
      .where(
        eq(collectionProductsTable.collectionId, collectionId) &&
        eq(collectionProductsTable.productId, productId)
      );
  },
};
