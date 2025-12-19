import { eq } from "drizzle-orm";
import { db } from "../../../shared/db";
import { productsTable, productVariantsTable, categoriesTable } from "../../../shared/db/catalogue";
import { NewProduct, UpdateProduct, NewProductVariant, UpdateProductVariant } from "../products.types";

export const productsRepo = {
  async createProduct(data: NewProduct) {
    const [newProduct] = await db
      .insert(productsTable)
      .values(data)
      .returning();
    return newProduct;
  },

  async getProductById(id: string) {
    const product = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);
    return product[0];
  },

  async getAllProducts() {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        categoryId: productsTable.categoryId,
        isActive: productsTable.isActive,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          slug: categoriesTable.slug,
        },
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));
    return products;
  },

  async updateProduct(id: string, data: UpdateProduct) {
    const [updatedProduct] = await db
      .update(productsTable)
      .set(data)
      .where(eq(productsTable.id, id))
      .returning();
    return updatedProduct;
  },

  async deleteProduct(id: string) {
    await db
      .delete(productsTable)
      .where(eq(productsTable.id, id));
  },
};

// Product Variants Repository
export const productVariantsRepo = {
  async createProductVariant(data: NewProductVariant) {
    const [newVariant] = await db
      .insert(productVariantsTable)
      .values(data)
      .returning();
    return newVariant;
  },

  async getProductVariantById(id: string) {
    const variant = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.id, id))
      .limit(1);
    return variant[0];
  },

  async getProductVariantsByProductId(productId: string) {
    const variants = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, productId));
    return variants;
  },

  async getProductVariantBySku(sku: string) {
    const variant = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.sku, sku))
      .limit(1);
    return variant[0];
  },

  async updateProductVariant(id: string, data: UpdateProductVariant) {
    const [updatedVariant] = await db
      .update(productVariantsTable)
      .set(data)
      .where(eq(productVariantsTable.id, id))
      .returning();
    return updatedVariant;
  },

  async deleteProductVariant(id: string) {
    await db
      .delete(productVariantsTable)
      .where(eq(productVariantsTable.id, id));
  },
};
