import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import { customersTable } from "../../shared/db/customer";
import { addressesTable } from "../../shared/db/address";

// Customer types
export type Customer = InferSelectModel<typeof customersTable>;
export type NewCustomer = Omit<InferInsertModel<typeof customersTable>, "organizationId">;
export type UpdateCustomer = Partial<Omit<NewCustomer, "id" | "createdAt">>;

// Address types
export type Address = InferSelectModel<typeof addressesTable>;
export type NewAddress = Omit<InferInsertModel<typeof addressesTable>, "organizationId">;
export type UpdateAddress = Partial<Omit<NewAddress, "id" | "createdAt" | "updatedAt">>;

// Extended types with relations
export type CustomerWithAddresses = Customer & {
  addresses: Address[];
};

// Zod validation schemas

// Customer schemas
export const createCustomerSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(7, "Phone number must be at least 7 characters").max(20),
  is_guest: z.boolean().default(false),
});

export const updateCustomerSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone_number: z.string().min(7).max(20).optional(),
});

// Address schemas
export const createAddressSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z.string().min(7).max(20),
  streetAddress: z.string().min(1, "Street address is required"),
  apartment: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().default("USA"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().min(7).max(20).optional(),
  streetAddress: z.string().min(1).optional(),
  apartment: z.string().optional().nullable(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Query parameter schemas
export const customerQuerySchema = z.object({
  search: z.string().optional(),
  isGuest: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});
