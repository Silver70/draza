import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import {
  discountsTable,
  discountCodesTable,
  discountProductsTable,
  discountCollectionsTable,
  discountVariantsTable,
  orderDiscountsTable,
} from "../../shared/db/discount";

// Discount types
export type Discount = InferSelectModel<typeof discountsTable>;
export type NewDiscount = InferInsertModel<typeof discountsTable>;
export type UpdateDiscount = Partial<
  Omit<NewDiscount, "id" | "createdAt" | "updatedAt">
>;

// Discount Code types
export type DiscountCode = InferSelectModel<typeof discountCodesTable>;
export type NewDiscountCode = InferInsertModel<typeof discountCodesTable>;
export type UpdateDiscountCode = Partial<
  Omit<NewDiscountCode, "id" | "createdAt" | "updatedAt">
>;

// Discount Products (junction table)
export type DiscountProduct = InferSelectModel<typeof discountProductsTable>;
export type NewDiscountProduct = InferInsertModel<typeof discountProductsTable>;

// Discount Collections (junction table)
export type DiscountCollection = InferSelectModel<
  typeof discountCollectionsTable
>;
export type NewDiscountCollection = InferInsertModel<
  typeof discountCollectionsTable
>;

// Discount Variants (junction table)
export type DiscountVariant = InferSelectModel<typeof discountVariantsTable>;
export type NewDiscountVariant = InferInsertModel<typeof discountVariantsTable>;

// Order Discounts
export type OrderDiscount = InferSelectModel<typeof orderDiscountsTable>;
export type NewOrderDiscount = InferInsertModel<typeof orderDiscountsTable>;

// Extended types with relations
export type DiscountWithCodes = Discount & {
  codes: DiscountCode[];
};

export type DiscountWithProducts = Discount & {
  discountProducts: (DiscountProduct & {
    product: {
      id: string;
      name: string;
      slug: string;
    };
  })[];
};

export type DiscountWithCollections = Discount & {
  discountCollections: (DiscountCollection & {
    collection: {
      id: string;
      name: string;
      slug: string;
    };
  })[];
};

export type DiscountWithVariants = Discount & {
  discountVariants: (DiscountVariant & {
    variant: {
      id: string;
      sku: string;
      price: string;
      productId: string;
    };
  })[];
};

export type DiscountWithDetails = Discount & {
  codes: DiscountCode[];
  discountProducts: (DiscountProduct & {
    product: {
      id: string;
      name: string;
      slug: string;
    };
  })[];
  discountCollections: (DiscountCollection & {
    collection: {
      id: string;
      name: string;
      slug: string;
    };
  })[];
  discountVariants: (DiscountVariant & {
    variant: {
      id: string;
      sku: string;
      price: string;
      productId: string;
    };
  })[];
};

// Zod validation schemas

// Discount schemas
export const createDiscountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  value: z.number().positive("Value must be positive"),
  scope: z.enum(["store_wide", "collection", "product", "variant", "code"]),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(10),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "fixed_amount"]).optional(),
  value: z.number().positive().optional(),
  scope: z.enum(["store_wide", "collection", "product", "variant", "code"]).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
});

// Discount Code schemas
export const createDiscountCodeSchema = z.object({
  discountId: z.string().uuid("Invalid discount ID"),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with _ or -"),
  usageLimit: z.number().int().positive().optional().nullable(),
  minimumOrderValue: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateDiscountCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/)
    .optional(),
  usageLimit: z.number().int().positive().optional().nullable(),
  minimumOrderValue: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Discount Product schemas
export const createDiscountProductSchema = z.object({
  discountId: z.string().uuid("Invalid discount ID"),
  productId: z.string().uuid("Invalid product ID"),
});

// Discount Collection schemas
export const createDiscountCollectionSchema = z.object({
  discountId: z.string().uuid("Invalid discount ID"),
  collectionId: z.string().uuid("Invalid collection ID"),
});

// Discount Variant schemas
export const createDiscountVariantSchema = z.object({
  discountId: z.string().uuid("Invalid discount ID"),
  variantId: z.string().uuid("Invalid variant ID"),
});

// Validate discount code schema (for customers)
export const validateDiscountCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  orderTotal: z.number().positive("Order total must be positive"),
});

// Query parameter schemas
export const discountQuerySchema = z.object({
  scope: z.enum(["store_wide", "collection", "product", "variant", "code"]).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const discountCodeQuerySchema = z.object({
  discountId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});
