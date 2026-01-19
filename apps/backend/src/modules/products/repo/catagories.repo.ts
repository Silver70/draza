import { eq, and, sql, isNull } from "drizzle-orm";
import { db } from "../../../shared/db";
import { categoriesTable } from "../../../shared/db/catalogue";
import { NewCategory, UpdateCategory } from "../products.types";

export const categoriesRepo = {
  async createCategory(data: NewCategory, organizationId: string) {
    const newCategory = await db
      .insert(categoriesTable)
      .values({ ...data, organizationId })
      .returning();
    return newCategory;
  },

  async getCategoryById(id: string, organizationId: string) {
    const category = await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, id), eq(categoriesTable.organizationId, organizationId)))
      .limit(1);
    return category[0];
  },

  async getCategoryBySlug(slug: string, organizationId: string) {
    const category = await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.slug, slug), eq(categoriesTable.organizationId, organizationId)))
      .limit(1);
    return category[0];
  },

  async getAllCategories(organizationId: string) {
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.organizationId, organizationId));
    return categories;
  },

  async getCategoriesByParentId(parentId: string | null, organizationId: string) {
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(and(
        parentId ? eq(categoriesTable.parentId, parentId) : isNull(categoriesTable.parentId),
        eq(categoriesTable.organizationId, organizationId)
      ));
    return categories;
  },

  async updateCategory(id: string, data: UpdateCategory) {
    const [updatedCategory] = await db
      .update(categoriesTable)
      .set(data)
      .where(eq(categoriesTable.id, id))
      .returning();
    return updatedCategory;
  },

  async deleteCategory(id: string) {
    await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id));
  },
};
