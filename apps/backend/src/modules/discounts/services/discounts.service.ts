import {
  discountsRepo,
  discountProductsRepo,
  discountCollectionsRepo,
} from "../repo";
import { NewDiscount, UpdateDiscount } from "../discounts.types";

export const discountsService = {
  /**
   * Get all discounts with optional filtering
   */
  findAll: async (filters?: {
    scope?: string;
    isActive?: boolean;
    search?: string;
  }) => {
    const discounts = await discountsRepo.getAllDiscounts();

    if (!discounts || discounts.length === 0) {
      return [];
    }

    let filteredDiscounts = discounts;

    if (filters?.scope) {
      filteredDiscounts = filteredDiscounts.filter(
        (d) => d.scope === filters.scope
      );
    }

    if (filters?.isActive !== undefined) {
      filteredDiscounts = filteredDiscounts.filter(
        (d) => d.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDiscounts = filteredDiscounts.filter(
        (d) =>
          d.name.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredDiscounts;
  },

  /**
   * Get active discounts (within date range)
   */
  findActiveDiscounts: async () => {
    return await discountsRepo.getActiveDiscounts();
  },

  /**
   * Get a single discount by ID
   */
  findById: async (id: string) => {
    const discount = await discountsRepo.getDiscountById(id);
    if (!discount) {
      throw new Error("Discount not found");
    }
    return discount;
  },

  /**
   * Get discount with all details (codes, products, collections)
   */
  findByIdWithDetails: async (id: string) => {
    const discount = await discountsRepo.getDiscountWithDetails(id);
    if (!discount) {
      throw new Error("Discount not found");
    }
    return discount;
  },

  /**
   * Create a new discount
   */
  create: async (data: NewDiscount) => {
    // Validate discount value based on type
    if (data.discountType === "percentage" && Number(data.value) > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (data.discountType === "percentage" && Number(data.value) <= 0) {
      throw new Error("Percentage discount must be greater than 0");
    }

    if (data.discountType === "fixed_amount" && Number(data.value) <= 0) {
      throw new Error("Fixed amount discount must be greater than 0");
    }

    // Validate dates
    if (data.endsAt && data.startsAt) {
      const startDate = new Date(data.startsAt);
      const endDate = new Date(data.endsAt);
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
    }

    return await discountsRepo.createDiscount(data);
  },

  /**
   * Update a discount
   */
  update: async (id: string, data: UpdateDiscount) => {
    const existingDiscount = await discountsRepo.getDiscountById(id);
    if (!existingDiscount) {
      throw new Error("Discount not found");
    }

    // Validate discount value based on type
    if (data.discountType === "percentage" && data.value && Number(data.value) > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (data.value && Number(data.value) <= 0) {
      throw new Error("Discount value must be greater than 0");
    }

    // Validate dates
    if (data.endsAt && data.startsAt) {
      const startDate = new Date(data.startsAt);
      const endDate = new Date(data.endsAt);
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
    }

    return await discountsRepo.updateDiscount(id, data);
  },

  /**
   * Delete a discount
   */
  delete: async (id: string) => {
    const existingDiscount = await discountsRepo.getDiscountById(id);
    if (!existingDiscount) {
      throw new Error("Discount not found");
    }
    await discountsRepo.deleteDiscount(id);
  },

  /**
   * Add products to a discount
   */
  addProducts: async (discountId: string, productIds: string[]) => {
    const discount = await discountsRepo.getDiscountById(discountId);
    if (!discount) {
      throw new Error("Discount not found");
    }

    if (discount.scope !== "product") {
      throw new Error("Can only add products to product-scoped discounts");
    }

    const results = [];
    for (const productId of productIds) {
      const result = await discountProductsRepo.addProductToDiscount({
        discountId,
        productId,
      });
      results.push(result);
    }

    return results;
  },

  /**
   * Remove product from a discount
   */
  removeProduct: async (discountId: string, productId: string) => {
    await discountProductsRepo.removeProductFromDiscount(
      discountId,
      productId
    );
  },

  /**
   * Add collections to a discount
   */
  addCollections: async (discountId: string, collectionIds: string[]) => {
    const discount = await discountsRepo.getDiscountById(discountId);
    if (!discount) {
      throw new Error("Discount not found");
    }

    if (discount.scope !== "collection") {
      throw new Error(
        "Can only add collections to collection-scoped discounts"
      );
    }

    const results = [];
    for (const collectionId of collectionIds) {
      const result = await discountCollectionsRepo.addCollectionToDiscount({
        discountId,
        collectionId,
      });
      results.push(result);
    }

    return results;
  },

  /**
   * Remove collection from a discount
   */
  removeCollection: async (discountId: string, collectionId: string) => {
    await discountCollectionsRepo.removeCollectionFromDiscount(
      discountId,
      collectionId
    );
  },

  /**
   * Get applicable discounts for a product
   */
  getProductDiscounts: async (productId: string) => {
    const now = new Date();

    // Get store-wide discounts
    const storeWideDiscounts = await discountsRepo.getActiveDiscounts();
    const activeStoreWide = storeWideDiscounts.filter(
      (d) => d.scope === "store_wide"
    );

    // Get product-specific discounts
    const productDiscounts = await discountProductsRepo.getDiscountsByProductId(
      productId
    );
    const activeProductDiscounts = productDiscounts
      .filter((pd) => {
        const discount = pd.discount;
        if (!discount || !discount.isActive) return false;
        const startsAt = new Date(discount.startsAt);
        const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;
        return startsAt <= now && (!endsAt || endsAt >= now);
      })
      .map((pd) => pd.discount);

    // Combine and sort by priority (higher priority first)
    const allDiscounts = [...activeStoreWide, ...activeProductDiscounts].sort(
      (a, b) => (b?.priority || 0) - (a?.priority || 0)
    );

    return allDiscounts;
  },

  /**
   * Get applicable discounts for a collection
   */
  getCollectionDiscounts: async (collectionId: string) => {
    const now = new Date();

    // Get store-wide discounts
    const storeWideDiscounts = await discountsRepo.getActiveDiscounts();
    const activeStoreWide = storeWideDiscounts.filter(
      (d) => d.scope === "store_wide"
    );

    // Get collection-specific discounts
    const collectionDiscounts =
      await discountCollectionsRepo.getDiscountsByCollectionId(collectionId);
    const activeCollectionDiscounts = collectionDiscounts
      .filter((cd) => {
        const discount = cd.discount;
        if (!discount || !discount.isActive) return false;
        const startsAt = new Date(discount.startsAt);
        const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;
        return startsAt <= now && (!endsAt || endsAt >= now);
      })
      .map((cd) => cd.discount);

    // Combine and sort by priority
    const allDiscounts = [
      ...activeStoreWide,
      ...activeCollectionDiscounts,
    ].sort((a, b) => (b?.priority || 0) - (a?.priority || 0));

    return allDiscounts;
  },

  /**
   * Calculate discount amount for a given price
   */
  calculateDiscountAmount: (
    price: number,
    discountType: "percentage" | "fixed_amount",
    discountValue: number
  ): number => {
    if (discountType === "percentage") {
      return (price * discountValue) / 100;
    } else {
      return Math.min(discountValue, price);
    }
  },

  /**
   * Get the best applicable discount for a product
   */
  getBestDiscountForProduct: async (productId: string, price: number) => {
    const discounts = await discountsService.getProductDiscounts(productId);

    if (discounts.length === 0) {
      return null;
    }

    // Calculate discount amounts and find the best one
    let bestDiscount = null;
    let maxDiscountAmount = 0;

    for (const discount of discounts) {
      if (!discount) continue;
      const amount = discountsService.calculateDiscountAmount(
        price,
        discount.discountType,
        Number(discount.value)
      );

      if (amount > maxDiscountAmount) {
        maxDiscountAmount = amount;
        bestDiscount = {
          discount,
          discountAmount: amount,
          finalPrice: price - amount,
        };
      }
    }

    return bestDiscount;
  },
};
