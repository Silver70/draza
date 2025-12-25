import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import { ordersTable, orderItemsTable } from "../../shared/db/order";

// Order types
export type Order = InferSelectModel<typeof ordersTable>;
export type NewOrder = InferInsertModel<typeof ordersTable>;
export type UpdateOrder = Partial<Omit<NewOrder, "id" | "createdAt" | "updatedAt">>;

// Order Item types
export type OrderItem = InferSelectModel<typeof orderItemsTable>;
export type NewOrderItem = InferInsertModel<typeof orderItemsTable>;

// Extended types with relations
export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderWithRelations = Order & {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  shippingAddress: {
    id: string;
    streetAddress: string;
    apartment?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    id: string;
    streetAddress: string;
    apartment?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
};

// Zod validation schemas

// Order Item schemas
export const createOrderItemSchema = z.object({
  productVariantId: z.string().uuid("Invalid product variant ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
});

// Order schemas
export const createOrderSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  billingAddressId: z.string().uuid("Invalid billing address ID"),
  items: z.array(createOrderItemSchema).min(1, "Order must have at least one item"),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid subtotal format"),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid tax format").default("0"),
  shippingCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid shipping cost format").default("0"),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid total format"),
  notes: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

export const updateOrderSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  notes: z.string().optional().nullable(),
});

// Query parameter schemas
export const orderQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});
