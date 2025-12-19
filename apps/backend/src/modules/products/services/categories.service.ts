import { categoriesRepo } from "../repo/catagories.repo";
import { productsRepo } from "../repo";
import { NewCategory, UpdateCategory } from "../products.types";

export const categoriesService = {
  /**
   * Get all categories
   */
  findAll: async () => {
    const categories = await categoriesRepo.getAllCategories();
    return categories;
  },

  /**
   * Get a single category by ID
   */
  findById: async (id: string) => {
    const category = await categoriesRepo.getCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  },

  /**
   * Get category by slug (for customer-facing URLs)
   */
  findBySlug: async (slug: string) => {
    const category = await categoriesRepo.getCategoryBySlug(slug);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  },

  /**
   * Get top-level categories (no parent)
   */
  findRootCategories: async () => {
    const categories = await categoriesRepo.getCategoriesByParentId(null);
    return categories;
  },

  /**
   * Get subcategories of a parent category
   */
  findSubcategories: async (parentId: string) => {
    // Verify parent exists
    const parent = await categoriesRepo.getCategoryById(parentId);
    if (!parent) {
      throw new Error("Parent category not found");
    }

    const subcategories = await categoriesRepo.getCategoriesByParentId(parentId);
    return subcategories;
  },

  /**
   * Get category with its subcategories
   */
  findByIdWithChildren: async (id: string) => {
    const category = await categoriesRepo.getCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    const children = await categoriesRepo.getCategoriesByParentId(id);

    return {
      ...category,
      children,
    };
  },

  /**
   * Get category tree (hierarchical structure)
   */
  getCategoryTree: async () => {
    const allCategories = await categoriesRepo.getAllCategories();

    // Build a map of categories by ID for quick lookup
    const categoryMap = new Map(allCategories.map((cat) => [cat.id, { ...cat, children: [] as any[] }]));

    // Build the tree structure
    const rootCategories: any[] = [];

    for (const category of allCategories) {
      const categoryWithChildren = categoryMap.get(category.id)!;

      if (category.parentId === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      }
    }

    return rootCategories;
  },

  /**
   * Get category breadcrumb path (for navigation)
   */
  getBreadcrumb: async (id: string) => {
    const breadcrumb = [];
    let currentId: string | null = id;

    while (currentId) {
      const category = await categoriesRepo.getCategoryById(currentId);

      if (!category) {
        break;
      }

      breadcrumb.unshift(category);
      currentId = category.parentId;
    }

    return breadcrumb;
  },

  /**
   * Create a new category
   */
  create: async (data: NewCategory) => {
    // Check if slug already exists
    const existingCategory = await categoriesRepo.getCategoryBySlug(data.slug);
    if (existingCategory) {
      throw new Error("Category with this slug already exists");
    }

    // If parentId provided, verify parent exists
    if (data.parentId) {
      const parent = await categoriesRepo.getCategoryById(data.parentId);
      if (!parent) {
        throw new Error("Parent category not found");
      }
    }

    return await categoriesRepo.createCategory(data);
  },

  /**
   * Update a category
   */
  update: async (id: string, data: UpdateCategory) => {
    // Check if category exists
    const existingCategory = await categoriesRepo.getCategoryById(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }

    // If updating slug, check it's not already taken by another category
    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await categoriesRepo.getCategoryBySlug(data.slug);
      if (slugExists && slugExists.id !== id) {
        throw new Error("Category with this slug already exists");
      }
    }

    // If updating parentId, validate it
    if (data.parentId !== undefined) {
      if (data.parentId !== null) {
        // Prevent category from being its own parent
        if (data.parentId === id) {
          throw new Error("Category cannot be its own parent");
        }

        // Verify parent exists
        const parent = await categoriesRepo.getCategoryById(data.parentId);
        if (!parent) {
          throw new Error("Parent category not found");
        }

        // Prevent circular references (category cannot be parent of its ancestor)
        const isDescendant = await categoriesService.isDescendantOf(data.parentId, id);
        if (isDescendant) {
          throw new Error("Cannot set a descendant category as parent (circular reference)");
        }
      }
    }

    return await categoriesRepo.updateCategory(id, data);
  },

  /**
   * Delete a category
   */
  delete: async (id: string, options?: { deleteChildren?: boolean; moveChildrenTo?: string }) => {
    const category = await categoriesRepo.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has products
    const products = await productsRepo.getAllProducts();
    const categoryProducts = products.filter((p) => p.categoryId === id);

    if (categoryProducts.length > 0) {
      throw new Error(
        `Cannot delete category with ${categoryProducts.length} products. Please move or delete the products first.`
      );
    }

    // Check if category has children
    const children = await categoriesRepo.getCategoriesByParentId(id);

    if (children.length > 0) {
      if (options?.deleteChildren) {
        // Delete all children recursively
        for (const child of children) {
          await categoriesService.delete(child.id, { deleteChildren: true });
        }
      } else if (options?.moveChildrenTo) {
        // Move children to another parent
        const newParent = await categoriesRepo.getCategoryById(options.moveChildrenTo);
        if (!newParent) {
          throw new Error("Target parent category not found");
        }

        for (const child of children) {
          await categoriesRepo.updateCategory(child.id, { parentId: options.moveChildrenTo });
        }
      } else {
        throw new Error(
          `Cannot delete category with ${children.length} subcategories. Use deleteChildren or moveChildrenTo option.`
        );
      }
    }

    return await categoriesRepo.deleteCategory(id);
  },

  /**
   * Get category with product count
   */
  findByIdWithProductCount: async (id: string) => {
    const category = await categoriesRepo.getCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    const products = await productsRepo.getAllProducts();
    const productCount = products.filter((p) => p.categoryId === id).length;

    return {
      ...category,
      productCount,
    };
  },

  /**
   * Get all categories with product counts
   */
  findAllWithProductCounts: async () => {
    const categories = await categoriesRepo.getAllCategories();
    const products = await productsRepo.getAllProducts();

    return categories.map((category) => ({
      ...category,
      productCount: products.filter((p) => p.categoryId === category.id).length,
    }));
  },

  /**
   * Get categories with active product counts (for customer-facing navigation)
   */
  findAllWithActiveProductCounts: async () => {
    const categories = await categoriesRepo.getAllCategories();
    const products = await productsRepo.getAllProducts();
    const activeProducts = products.filter((p) => p.isActive);

    return categories.map((category) => ({
      ...category,
      productCount: activeProducts.filter((p) => p.categoryId === category.id).length,
    }));
  },

  /**
   * Get categories that have products (filter out empty categories)
   */
  findCategoriesWithProducts: async (activeOnly: boolean = false) => {
    const categories = await categoriesRepo.getAllCategories();
    const products = await productsRepo.getAllProducts();
    const filteredProducts = activeOnly ? products.filter((p) => p.isActive) : products;

    const categoriesWithProducts = categories.filter((category) =>
      filteredProducts.some((p) => p.categoryId === category.id)
    );

    return categoriesWithProducts.map((category) => ({
      ...category,
      productCount: filteredProducts.filter((p) => p.categoryId === category.id).length,
    }));
  },

  /**
   * Move category to a different parent
   */
  moveCategory: async (id: string, newParentId: string | null) => {
    const category = await categoriesRepo.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Cannot move to itself
    if (newParentId === id) {
      throw new Error("Category cannot be its own parent");
    }

    // If new parent provided, verify it exists and prevent circular references
    if (newParentId !== null) {
      const newParent = await categoriesRepo.getCategoryById(newParentId);
      if (!newParent) {
        throw new Error("New parent category not found");
      }

      // Prevent circular references
      const isDescendant = await categoriesService.isDescendantOf(newParentId, id);
      if (isDescendant) {
        throw new Error("Cannot move category to its own descendant (circular reference)");
      }
    }

    return await categoriesRepo.updateCategory(id, { parentId: newParentId });
  },

  /**
   * Check if a category is a descendant of another category
   */
  isDescendantOf: async (categoryId: string, ancestorId: string): Promise<boolean> => {
    const category = await categoriesRepo.getCategoryById(categoryId);

    if (!category || !category.parentId) {
      return false;
    }

    if (category.parentId === ancestorId) {
      return true;
    }

    return await categoriesService.isDescendantOf(category.parentId, ancestorId);
  },

  /**
   * Get category depth (level in hierarchy)
   */
  getCategoryDepth: async (id: string): Promise<number> => {
    const category = await categoriesRepo.getCategoryById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    if (!category.parentId) {
      return 0;
    }

    const parentDepth = await categoriesService.getCategoryDepth(category.parentId);
    return parentDepth + 1;
  },

  /**
   * Get all descendant categories (children, grandchildren, etc.)
   */
  getAllDescendants: async (id: string): Promise<any[]> => {
    const children = await categoriesRepo.getCategoriesByParentId(id);
    const descendants = [...children];

    for (const child of children) {
      const childDescendants = await categoriesService.getAllDescendants(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  },

  /**
   * Reorder categories (update positions if you add a position field later)
   */
  reorderCategories: async (categoryOrders: Array<{ id: string; position: number }>) => {
    // This is a placeholder for when you add a position/order field to your schema
    // For now, we'll just validate the categories exist
    for (const { id } of categoryOrders) {
      const category = await categoriesRepo.getCategoryById(id);
      if (!category) {
        throw new Error(`Category with ID ${id} not found`);
      }
    }

    // TODO: Update positions when you add a position field to the schema
    return { message: "Position field not yet implemented in schema" };
  },
};
