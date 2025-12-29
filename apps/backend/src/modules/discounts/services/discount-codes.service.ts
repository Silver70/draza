import {
  discountCodesRepo,
  discountsRepo,
} from "../repo";
import { NewDiscountCode, UpdateDiscountCode } from "../discounts.types";

export const discountCodesService = {
  /**
   * Create a new discount code
   */
  create: async (data: NewDiscountCode) => {
    // Check if discount exists
    const discount = await discountsRepo.getDiscountById(data.discountId);
    if (!discount) {
      throw new Error("Discount not found");
    }

    // Check if discount is code-scoped
    if (discount.scope !== "code") {
      throw new Error("Can only create codes for code-scoped discounts");
    }

    // Check if code already exists
    const existingCode = await discountCodesRepo.getDiscountCodeByCode(
      data.code
    );
    if (existingCode) {
      throw new Error("Discount code already exists");
    }

    return await discountCodesRepo.createDiscountCode(data);
  },

  /**
   * Get discount code by ID
   */
  findById: async (id: string) => {
    const code = await discountCodesRepo.getDiscountCodeById(id);
    if (!code) {
      throw new Error("Discount code not found");
    }
    return code;
  },

  /**
   * Get all codes for a discount
   */
  findByDiscountId: async (discountId: string) => {
    return await discountCodesRepo.getDiscountCodesByDiscountId(discountId);
  },

  /**
   * Update a discount code
   */
  update: async (id: string, data: UpdateDiscountCode) => {
    const existingCode = await discountCodesRepo.getDiscountCodeById(id);
    if (!existingCode) {
      throw new Error("Discount code not found");
    }

    // Check if new code already exists
    if (data.code && data.code !== existingCode.code) {
      const codeExists = await discountCodesRepo.getDiscountCodeByCode(
        data.code
      );
      if (codeExists) {
        throw new Error("Discount code already exists");
      }
    }

    return await discountCodesRepo.updateDiscountCode(id, data);
  },

  /**
   * Delete a discount code
   */
  delete: async (id: string) => {
    const existingCode = await discountCodesRepo.getDiscountCodeById(id);
    if (!existingCode) {
      throw new Error("Discount code not found");
    }
    await discountCodesRepo.deleteDiscountCode(id);
  },

  /**
   * Validate a discount code for use
   */
  validateCode: async (code: string, orderTotal: number) => {
    const discountCode = await discountCodesRepo.getDiscountCodeByCode(code);

    if (!discountCode) {
      throw new Error("Invalid discount code");
    }

    if (!discountCode.isActive) {
      throw new Error("Discount code is not active");
    }

    // Check usage limit
    if (
      discountCode.usageLimit &&
      discountCode.usageCount >= discountCode.usageLimit
    ) {
      throw new Error("Discount code usage limit reached");
    }

    // Check minimum order value
    if (
      discountCode.minimumOrderValue &&
      orderTotal < Number(discountCode.minimumOrderValue)
    ) {
      throw new Error(
        `Order total must be at least $${discountCode.minimumOrderValue}`
      );
    }

    // Get the associated discount
    const discount = await discountsRepo.getDiscountById(
      discountCode.discountId
    );

    if (!discount) {
      throw new Error("Associated discount not found");
    }

    if (!discount.isActive) {
      throw new Error("Discount is not active");
    }

    // Check discount date range
    const now = new Date();
    const startsAt = new Date(discount.startsAt);
    const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;

    if (now < startsAt) {
      throw new Error("Discount has not started yet");
    }

    if (endsAt && now > endsAt) {
      throw new Error("Discount has expired");
    }

    return {
      discountCode,
      discount,
    };
  },

  /**
   * Calculate discount amount from a code
   */
  calculateCodeDiscount: async (
    code: string,
    orderTotal: number
  ): Promise<{
    discountCode: any;
    discount: any;
    discountAmount: number;
    finalTotal: number;
  }> => {
    const { discountCode, discount } =
      await discountCodesService.validateCode(code, orderTotal);

    let discountAmount = 0;

    if (discount.discountType === "percentage") {
      discountAmount = (orderTotal * Number(discount.value)) / 100;
    } else {
      discountAmount = Math.min(Number(discount.value), orderTotal);
    }

    return {
      discountCode,
      discount,
      discountAmount,
      finalTotal: orderTotal - discountAmount,
    };
  },

  /**
   * Increment usage count for a code
   */
  incrementUsage: async (id: string) => {
    return await discountCodesRepo.incrementUsageCount(id);
  },
};
