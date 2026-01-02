import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import {
  productsTable,
  productVariantsTable,
  attributesTable,
  attributeValuesTable,
  productVariantAttributesTable,
  categoriesTable,
  collectionsTable,
  collectionProductsTable,
  productImagesTable,
  productVariantImagesTable,
} from "../../shared/db/catalogue";

// Product types
export type Product = InferSelectModel<typeof productsTable>;
export type NewProduct = InferInsertModel<typeof productsTable>;
export type UpdateProduct = Partial<Omit<NewProduct, "id" | "createdAt" | "updatedAt">>;

// Product Variant types
export type ProductVariant = InferSelectModel<typeof productVariantsTable>;
export type NewProductVariant = InferInsertModel<typeof productVariantsTable>;
export type UpdateProductVariant = Partial<Omit<NewProductVariant, "id" | "createdAt" | "updatedAt">>;

// Attribute types
export type Attribute = InferSelectModel<typeof attributesTable>;
export type NewAttribute = InferInsertModel<typeof attributesTable>;
export type UpdateAttribute = Partial<Omit<NewAttribute, "id">>;

// Attribute Value types
export type AttributeValue = InferSelectModel<typeof attributeValuesTable>;
export type NewAttributeValue = InferInsertModel<typeof attributeValuesTable>;
export type UpdateAttributeValue = Partial<Omit<NewAttributeValue, "id">>;

// Product Variant Attributes (junction table)
export type ProductVariantAttribute = InferSelectModel<typeof productVariantAttributesTable>;
export type NewProductVariantAttribute = InferInsertModel<typeof productVariantAttributesTable>;

// Category types
export type Category = InferSelectModel<typeof categoriesTable>;
export type NewCategory = InferInsertModel<typeof categoriesTable>;
export type UpdateCategory = Partial<Omit<NewCategory, "id" | "createdAt" | "updatedAt">>;

// Collection types
export type Collection = InferSelectModel<typeof collectionsTable>;
export type NewCollection = InferInsertModel<typeof collectionsTable>;
export type UpdateCollection = Partial<Omit<NewCollection, "id" | "createdAt" | "updatedAt">>;

// Collection Products (junction table)
export type CollectionProduct = InferSelectModel<typeof collectionProductsTable>;
export type NewCollectionProduct = InferInsertModel<typeof collectionProductsTable>;

// Product Image types
export type ProductImage = InferSelectModel<typeof productImagesTable>;
export type NewProductImage = InferInsertModel<typeof productImagesTable>;
export type UpdateProductImage = Partial<Omit<NewProductImage, "id" | "createdAt" | "updatedAt">>;

// Product Variant Image types
export type ProductVariantImage = InferSelectModel<typeof productVariantImagesTable>;
export type NewProductVariantImage = InferInsertModel<typeof productVariantImagesTable>;
export type UpdateProductVariantImage = Partial<Omit<NewProductVariantImage, "id" | "createdAt" | "updatedAt">>;

// Extended types with relations
export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  images?: ProductImage[];
};

export type ProductWithCategory = Product & {
  category: Category;
  images?: ProductImage[];
};

export type ProductWithDetails = Product & {
  category: Category;
  variants: (ProductVariant & {
    attributes: (ProductVariantAttribute & {
      attributeValue: AttributeValue & {
        attribute: Attribute;
      };
    })[];
    images?: ProductVariantImage[];
  })[];
  images?: ProductImage[];
};

export type ProductVariantWithAttributes = ProductVariant & {
  attributes: (ProductVariantAttribute & {
    attributeValue: AttributeValue & {
      attribute: Attribute;
    };
  })[];
  images?: ProductVariantImage[];
};

export type CategoryWithProducts = Category & {
  products: Product[];
};

export type CategoryWithChildren = Category & {
  children: Category[];
};

export type CollectionWithProducts = Collection & {
  collectionProducts: (CollectionProduct & {
    product: Product;
  })[];
};

// Zod validation schemas

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid("Invalid category ID"),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

// Product Variant schemas
export const createProductVariantSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be at least 0"),
  quantityInStock: z.number().int().min(0).default(0),
});

export const updateProductVariantSchema = z.object({
  sku: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  quantityInStock: z.number().int().min(0).optional(),
});

// Attribute schemas
export const createAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
});

export const updateAttributeSchema = z.object({
  name: z.string().min(1).optional(),
});

// Attribute Value schemas
export const createAttributeValueSchema = z.object({
  attributeId: z.string().uuid("Invalid attribute ID"),
  value: z.string().min(1, "Value is required"),
});

export const updateAttributeValueSchema = z.object({
  value: z.string().min(1).optional(),
});

// Product Variant Attribute schemas
export const createProductVariantAttributeSchema = z.object({
  productVariantId: z.string().uuid("Invalid product variant ID"),
  attributeValueId: z.string().uuid("Invalid attribute value ID"),
});

// Collection schemas
export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Collection Product schemas
export const createCollectionProductSchema = z.object({
  collectionId: z.string().uuid("Invalid collection ID"),
  productId: z.string().uuid("Invalid product ID"),
  position: z.number().int().optional().nullable(),
});

// Complex schemas for creating products with variants
export const createProductWithVariantsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid("Invalid category ID"),
  isActive: z.boolean().default(true),
  variants: z.array(
    z.object({
      sku: z.string().min(1, "SKU is required"),
      price: z.number().min(0, "Price must be at least 0"),
      quantityInStock: z.number().int().min(0).default(0),
      attributes: z.array(z.string().uuid()).optional(),
    })
  ).optional(),
});

// Query parameter schemas
export const productQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const categoryQuerySchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const collectionQuerySchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Product Image schemas
export const createProductImageSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  url: z.string().url("Invalid URL").or(z.string().min(1, "URL is required")),
  altText: z.string().optional().nullable(),
  type: z.enum(["thumbnail", "gallery", "hero", "zoom"]).default("gallery"),
  position: z.number().int().min(0).default(0),
});

export const updateProductImageSchema = z.object({
  url: z.string().url("Invalid URL").or(z.string().min(1)).optional(),
  altText: z.string().optional().nullable(),
  type: z.enum(["thumbnail", "gallery", "hero", "zoom"]).optional(),
  position: z.number().int().min(0).optional(),
});

// Product Variant Image schemas
export const createProductVariantImageSchema = z.object({
  productVariantId: z.string().uuid("Invalid product variant ID"),
  url: z.string().url("Invalid URL").or(z.string().min(1, "URL is required")),
  altText: z.string().optional().nullable(),
  type: z.enum(["thumbnail", "gallery", "hero", "zoom"]).default("gallery"),
  position: z.number().int().min(0).default(0),
});

export const updateProductVariantImageSchema = z.object({
  url: z.string().url("Invalid URL").or(z.string().min(1)).optional(),
  altText: z.string().optional().nullable(),
  type: z.enum(["thumbnail", "gallery", "hero", "zoom"]).optional(),
  position: z.number().int().min(0).optional(),
});
