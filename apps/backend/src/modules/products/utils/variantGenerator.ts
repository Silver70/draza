import { generateSKU } from "../utils/index";
import { productVariantsTable } from "../../../shared/db/catalogue";
import { db } from "../../../shared/db";
import { productVariantAttributesTable } from "../../../shared/db/catalogue";

export interface AttributeValueWithId {
  id: string;
  value: string;
}

export interface AttributeWithValues {
  attributeId: string;
  attributeName: string;
  values: AttributeValueWithId[];
}

export interface GeneratedVariant {
  sku: string;
  quantityInStock: number;
  attributeValueIds: string[];
  attributeDetails: Array<{
    attributeId: string;
    attributeName: string;
    value: string;
  }>;
}

/**
 * Generates all possible variant combinations from selected attributes
 * Uses Cartesian product to create all combinations
 */
export const generateVariantCombinations = (
  productSlug: string,
  attributes: AttributeWithValues[],
  defaultQuantity: number = 0
): GeneratedVariant[] => {
  if (attributes.length === 0) {
    return [];
  }

  // Extract values for each attribute
  const valueArrays = attributes.map((attr) => attr.values);

  // Generate Cartesian product of all attribute values
  const combinations = cartesianProduct(valueArrays);

  // Convert combinations to variant objects
  return combinations.map((combination) => {
    const attributeValueIds = combination.map((val) => val.id);
    const attributeValues = combination.map((val) => val.value);
    const attributeDetails = combination
      .map((val, index) => {
        const attr = attributes[index];
        if (!attr) return null;
        return {
          attributeId: attr.attributeId,
          attributeName: attr.attributeName,
          value: val.value,
        };
      })
      .filter(
        (detail) => detail !== null
      ) as Array<{
      attributeId: string;
      attributeName: string;
      value: string;
    }>;

    const sku = generateSKU(productSlug, attributeValues);

    return {
      sku,
      quantityInStock: defaultQuantity,
      attributeValueIds,
      attributeDetails,
    };
  });
};

/**
 * Generates Cartesian product of arrays
 * Used to create all possible combinations of attribute values
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) {
    const firstArray = arrays[0];
    return firstArray ? firstArray.map((item) => [item]) : [];
  }

  const first = arrays[0];
  const rest = arrays.slice(1);
  const restProduct = cartesianProduct(rest);

  const result: T[][] = [];
  if (first) {
    for (const item of first) {
      for (const combination of restProduct) {
        result.push([item, ...combination]);
      }
    }
  }
  return result;
}

/**
 * Example usage:
 * const attributes = [
 *   {
 *     attributeId: 'attr-1',
 *     attributeName: 'Size',
 *     values: [
 *       { id: 'val-1', value: 'Small' },
 *       { id: 'val-2', value: 'Large' }
 *     ]
 *   },
 *   {
 *     attributeId: 'attr-2',
 *     attributeName: 'Color',
 *     values: [
 *       { id: 'val-3', value: 'Red' },
 *       { id: 'val-4', value: 'Blue' }
 *     ]
 *   }
 * ];
 *
 * const variants = generateVariantCombinations('my-product', attributes, 10);
 * // This will generate 4 variants: Small-Red, Small-Blue, Large-Red, Large-Blue
 */


export interface BulkVariantCreationResult {
  success: boolean;
  createdCount: number;
  failedCount: number;
  variants: Array<{
    id: string;
    sku: string;
  }>;
  errors?: string[];
}

/**
 * Creates multiple variants in bulk and links them to attribute values
 */
export const bulkCreateVariants = async (
  productId: string,
  variants: GeneratedVariant[]
): Promise<BulkVariantCreationResult> => {
  const createdVariants: Array<{ id: string; sku: string }> = [];
  const errors: string[] = [];
  let failedCount = 0;

  for (const variant of variants) {
    try {
      // Insert the variant
      const insertedVariants = await db
        .insert(productVariantsTable)
        .values({
          productId,
          sku: variant.sku,
          quantityInStock: variant.quantityInStock,
        })
        .returning({
          id: productVariantsTable.id,
          sku: productVariantsTable.sku,
        });

      const newVariant = Array.isArray(insertedVariants)
        ? insertedVariants[0]
        : insertedVariants;

      if (!newVariant) {
        failedCount++;
        errors.push(`Failed to create variant with SKU: ${variant.sku}`);
        continue;
      }

      // Link variant to attribute values
      if (variant.attributeValueIds.length > 0) {
        await db.insert(productVariantAttributesTable).values(
          variant.attributeValueIds.map((attributeValueId) => ({
            productVariantId: newVariant.id,
            attributeValueId,
          }))
        );
      }

      createdVariants.push({
        id: newVariant.id,
        sku: newVariant.sku,
      });
    } catch (error) {
      failedCount++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(
        `Failed to create variant with SKU ${variant.sku}: ${errorMessage}`
      );
      console.error(`Variant creation error for SKU ${variant.sku}:`, error);
    }
  }

  return {
    success: failedCount === 0,
    createdCount: createdVariants.length,
    failedCount,
    variants: createdVariants,
    errors: errors.length > 0 ? errors : undefined,
  };
};

