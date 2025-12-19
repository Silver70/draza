import { eq } from "drizzle-orm";
import { db } from "../../../shared/db";
import { categoriesTable } from "../../../shared/db/catalogue";
import { NewCategory, UpdateCategory } from "../products.types";

export const categoriesRepo = {
  async createCategory(data: NewCategory) {
    const [newCategory] = await db
      .insert(categoriesTable)
      .values(data)
      .returning();
    return newCategory;
  },

  async getCategoryById(id: string) {
    const category = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .limit(1);
    return category[0];
  },

  async getCategoryBySlug(slug: string) {
    const category = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, slug))
      .limit(1);
    return category[0];
  },

  async getAllCategories() {
    const categories = await db.select().from(categoriesTable);
    return categories;
  },

  async getCategoriesByParentId(parentId: string | null) {
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(parentId ? eq(categoriesTable.parentId, parentId) : eq(categoriesTable.parentId, null));
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
