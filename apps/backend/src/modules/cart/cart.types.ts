import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import { cartsTable, cartItemsTable } from "../../shared/db/cart";

// Cart types
export type Cart = InferSelectModel<typeof cartsTable>;
export type NewCart = InferInsertModel<typeof cartsTable>;
export type UpdateCart = Partial<Omit<NewCart, "id" | "createdAt" | "updatedAt">>;

// Cart Item types
export type CartItem = InferSelectModel<typeof cartItemsTable>;
export type NewCartItem = InferInsertModel<typeof cartItemsTable>;

// Extended types with relations
export type CartWithItems = Cart & {
  items: (CartItem & {
    productVariant: {
      id: string;
      sku: string;
      price: string;
      quantityInStock: number;
      product: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
      };
    };
  })[];
};

export type CartWithRelations = CartWithItems & {
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  discountCode?: {
    id: string;
    code: string;
    discountId: string;
    discount: {
      type: string;
      value: string;
    };
  } | null;
};

// Cart totals breakdown
export type CartTotals = {
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  total: string;
};

export type CartTotalsBreakdown = CartTotals & {
  breakdown: {
    items: {
      name: string;
      quantity: number;
      lineTotal: string;
    }[];
    discount?: {
      code: string;
      amount: string;
    } | null;
    tax?: {
      jurisdiction: string;
      rate: string;
      amount: string;
    } | null;
    shipping?: {
      method: string;
      cost: string;
    } | null;
  };
};

// Zod validation schemas

// Cart Item schemas
export const addItemToCartSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  variantId: z.string().uuid("Invalid product variant ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const updateCartItemSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"), // 0 to remove
});

export const removeCartItemSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// Cart schemas
export const getCartSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
});

export const applyDiscountCodeSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  code: z.string().min(1, "Discount code is required"),
});

export const removeDiscountCodeSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export const calculateTotalsSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  shippingAddressId: z.string().uuid("Invalid shipping address ID").optional(),
  shippingMethodId: z.string().uuid("Invalid shipping method ID").optional(),
});

export const clearCartSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export const checkoutSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  billingAddressId: z.string().uuid("Invalid billing address ID"),
  shippingMethodId: z.string().uuid("Invalid shipping method ID"),
  notes: z.string().optional().nullable(),
  campaignId: z.string().uuid("Invalid campaign ID").optional(),
  visitId: z.string().uuid("Invalid visit ID").optional(),
}).refine(
  (data) => data.customerId || data.customerEmail,
  {
    message: "Either customerId or customerEmail must be provided",
    path: ["customerId"],
  }
);

export const mergeCartsSchema = z.object({
  fromSessionId: z.string().min(1, "Source session ID is required"),
  toSessionId: z.string().min(1, "Destination session ID is required"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
});

// Admin query schemas
export const abandonedCartsQuerySchema = z.object({
  hoursAgo: z.coerce.number().int().positive().default(24),
  minValue: z.coerce.number().positive().optional(),
});

// Input types for service methods
export type AddItemInput = z.infer<typeof addItemToCartSchema>;
export type UpdateItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountCodeSchema>;
export type CalculateTotalsInput = z.infer<typeof calculateTotalsSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type MergeCartsInput = z.infer<typeof mergeCartsSchema>;
