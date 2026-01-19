import { eq, sql } from "drizzle-orm";
import { db } from "../../../shared/db";
import { productsTable, productVariantsTable, categoriesTable, productImagesTable } from "../../../shared/db/catalogue";
import { NewProduct, UpdateProduct, NewProductVariant, UpdateProductVariant } from "../products.types";

export const productsRepo = {
  async createProduct(data: Omit<NewProduct, "organizationId">, organizationId: string) {
    const [newProduct] = await db
      .insert(productsTable)
      .values({ ...data, organizationId })
      .returning();
    return newProduct;
  },

  async getProductById(id: string, organizationId: string) {
    // Fetch product with category (filtered by organization)
    const productResult = await db
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
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(sql`${productsTable.id} = ${id} AND ${productsTable.organizationId} = ${organizationId}`)
      .limit(1);

    if (!productResult[0]) {
      return undefined;
    }

    // Fetch images for this product
    const images = await db
      .select()
      .from(productImagesTable)
      .where(eq(productImagesTable.productId, id))
      .orderBy(productImagesTable.position);

    return {
      ...productResult[0],
      images,
    };
  },

  async getAllProducts(organizationId: string) {
    // Fetch all products with categories (filtered by organization)
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
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.organizationId, organizationId));

    // Fetch all images for all products in one query
    const allImages = await db
      .select()
      .from(productImagesTable)
      .orderBy(productImagesTable.position);

    // Group images by product ID
    const imagesByProduct = allImages.reduce((acc, image) => {
      if (!acc[image.productId]) {
        acc[image.productId] = [];
      }
      acc[image.productId].push(image);
      return acc;
    }, {} as Record<string, typeof allImages>);

    // Attach images to products
    return products.map(product => ({
      ...product,
      images: imagesByProduct[product.id] || [],
    }));
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
  async createProductVariant(data: NewProductVariant, organizationId?: string) {
    const [newVariant] = await db
      .insert(productVariantsTable)
      .values(organizationId ? { ...data, organizationId } : data)
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
