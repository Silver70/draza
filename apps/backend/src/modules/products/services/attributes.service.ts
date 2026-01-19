import {
  attributesRepo,
  attributeValuesRepo,
  productVariantAttributesRepo,
} from "../repo/attributes.repo";
import { productVariantsRepo } from "../repo";
import {
  NewAttribute,
  UpdateAttribute,
  NewAttributeValue,
  UpdateAttributeValue,
  NewProductVariantAttribute,
} from "../products.types";

export const attributesService = {
  // ==================== ATTRIBUTES ====================

  /**
   * Get all attributes
   */
  findAllAttributes: async (organizationId: string) => {
    const attributes = await attributesRepo.getAllAttributes(organizationId);
    return attributes;
  },

  /**
   * Get attribute by ID
   */
  findAttributeById: async (id: string, organizationId: string) => {
    const attribute = await attributesRepo.getAttributeById(id, organizationId);

    if (!attribute) {
      throw new Error("Attribute not found");
    }

    return attribute;
  },

  /**
   * Get attribute by name
   */
  findAttributeByName: async (name: string, organizationId: string) => {
    const attribute = await attributesRepo.getAttributeByName(name, organizationId);

    if (!attribute) {
      throw new Error("Attribute not found");
    }

    return attribute;
  },

  /**
   * Get attribute with all its values
   */
  findAttributeWithValues: async (id: string, organizationId: string) => {
    const attribute = await attributesRepo.getAttributeById(id, organizationId);

    if (!attribute) {
      throw new Error("Attribute not found");
    }

    const values = await attributeValuesRepo.getAttributeValuesByAttributeId(id);

    return {
      ...attribute,
      values,
      valueCount: values.length,
    };
  },

  /**
   * Get all attributes with their values
   */
  findAllAttributesWithValues: async (organizationId: string) => {
    const attributes = await attributesRepo.getAllAttributes(organizationId);

    const attributesWithValues = await Promise.all(
      attributes.map(async (attribute) => {
        const values = await attributeValuesRepo.getAttributeValuesByAttributeId(attribute.id);
        return {
          ...attribute,
          values,
          valueCount: values.length,
        };
      })
    );

    return attributesWithValues;
  },

  /**
   * Create a new attribute
   */
  createAttribute: async (data: Omit<NewAttribute, "organizationId">, organizationId: string) => {
    // Check if attribute name already exists
    const existingAttribute = await attributesRepo.getAttributeByName(data.name, organizationId);
    if (existingAttribute) {
      throw new Error("Attribute with this name already exists");
    }

    return await attributesRepo.createAttribute(data, organizationId);
  },

  /**
   * Create attribute with values in one operation
   */
  createAttributeWithValues: async (data: {
    attribute: Omit<NewAttribute, "organizationId">;
    values: string[];
  }, organizationId: string) => {
    // Check if attribute name already exists
    const existingAttribute = await attributesRepo.getAttributeByName(data.attribute.name, organizationId);
    if (existingAttribute) {
      throw new Error("Attribute with this name already exists");
    }

    // Create attribute
    const attribute = await attributesRepo.createAttribute(data.attribute, organizationId);

    // Create values
    const createdValues = [];
    for (const valueName of data.values) {
      const value = await attributeValuesRepo.createAttributeValue({
        attributeId: attribute.id,
        value: valueName,
      });
      createdValues.push(value);
    }

    return {
      ...attribute,
      values: createdValues,
    };
  },

  /**
   * Update an attribute
   */
  updateAttribute: async (id: string, data: UpdateAttribute, organizationId: string) => {
    // Check if attribute exists
    const existingAttribute = await attributesRepo.getAttributeById(id, organizationId);
    if (!existingAttribute) {
      throw new Error("Attribute not found");
    }

    // If updating name, check it's not already taken
    if (data.name && data.name !== existingAttribute.name) {
      const nameExists = await attributesRepo.getAttributeByName(data.name, organizationId);
      if (nameExists && nameExists.id !== id) {
        throw new Error("Attribute with this name already exists");
      }
    }

    return await attributesRepo.updateAttribute(id, data, organizationId);
  },

  /**
   * Delete an attribute
   */
  deleteAttribute: async (id: string, organizationId: string) => {
    const attribute = await attributesRepo.getAttributeById(id, organizationId);
    if (!attribute) {
      throw new Error("Attribute not found");
    }

    // Check if attribute is used in any variants
    const values = await attributeValuesRepo.getAttributeValuesByAttributeId(id);

    for (const value of values) {
      const usedInVariants = await productVariantAttributesRepo.getVariantsByAttributeValueId(value.id);
      if (usedInVariants.length > 0) {
        throw new Error(
          `Cannot delete attribute "${attribute.name}". It is used in ${usedInVariants.length} product variant(s). Please remove the attribute from all variants first.`
        );
      }
    }

    // Delete all attribute values first
    for (const value of values) {
      await attributeValuesRepo.deleteAttributeValue(value.id);
    }

    return await attributesRepo.deleteAttribute(id, organizationId);
  },

  // ==================== ATTRIBUTE VALUES ====================

  /**
   * Get all values for an attribute
   */
  findValuesByAttributeId: async (attributeId: string, organizationId: string) => {
    // Verify attribute exists
    const attribute = await attributesRepo.getAttributeById(attributeId, organizationId);
    if (!attribute) {
      throw new Error("Attribute not found");
    }

    return await attributeValuesRepo.getAttributeValuesByAttributeId(attributeId);
  },

  /**
   * Get attribute value by ID
   */
  findAttributeValueById: async (id: string) => {
    const value = await attributeValuesRepo.getAttributeValueById(id);

    if (!value) {
      throw new Error("Attribute value not found");
    }

    return value;
  },

  /**
   * Create a new attribute value
   */
  createAttributeValue: async (data: NewAttributeValue, organizationId: string) => {
    // Verify attribute exists
    const attribute = await attributesRepo.getAttributeById(data.attributeId, organizationId);
    if (!attribute) {
      throw new Error("Attribute not found");
    }

    // Check if value already exists for this attribute
    const existingValues = await attributeValuesRepo.getAttributeValuesByAttributeId(data.attributeId);
    const valueExists = existingValues.some(
      (v) => v.value.toLowerCase() === data.value.toLowerCase()
    );

    if (valueExists) {
      throw new Error(`Value "${data.value}" already exists for this attribute`);
    }

    return await attributeValuesRepo.createAttributeValue(data);
  },

  /**
   * Create multiple attribute values at once
   */
  createMultipleAttributeValues: async (attributeId: string, values: string[], organizationId: string) => {
    // Verify attribute exists
    const attribute = await attributesRepo.getAttributeById(attributeId, organizationId);
    if (!attribute) {
      throw new Error("Attribute not found");
    }

    // Get existing values to check for duplicates
    const existingValues = await attributeValuesRepo.getAttributeValuesByAttributeId(attributeId);
    const existingValueNames = new Set(existingValues.map((v) => v.value.toLowerCase()));

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      values: [] as any[],
    };

    for (const valueName of values) {
      try {
        // Skip if already exists
        if (existingValueNames.has(valueName.toLowerCase())) {
          results.skipped++;
          continue;
        }

        const value = await attributeValuesRepo.createAttributeValue({
          attributeId,
          value: valueName,
        });

        results.values.push(value);
        results.created++;
        existingValueNames.add(valueName.toLowerCase());
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Failed to create value "${valueName}": ${errorMessage}`);
      }
    }

    return results;
  },

  /**
   * Update an attribute value
   */
  updateAttributeValue: async (id: string, data: UpdateAttributeValue) => {
    // Check if value exists
    const existingValue = await attributeValuesRepo.getAttributeValueById(id);
    if (!existingValue) {
      throw new Error("Attribute value not found");
    }

    // If updating value text, check for duplicates within the same attribute
    if (data.value && data.value !== existingValue.value) {
      const allValues = await attributeValuesRepo.getAttributeValuesByAttributeId(
        existingValue.attributeId
      );
      const duplicateExists = allValues.some(
        (v) => v.id !== id && v.value.toLowerCase() === data.value!.toLowerCase()
      );

      if (duplicateExists) {
        throw new Error(`Value "${data.value}" already exists for this attribute`);
      }
    }

    return await attributeValuesRepo.updateAttributeValue(id, data);
  },

  /**
   * Delete an attribute value
   */
  deleteAttributeValue: async (id: string) => {
    const value = await attributeValuesRepo.getAttributeValueById(id);
    if (!value) {
      throw new Error("Attribute value not found");
    }

    // Check if value is used in any variants
    const usedInVariants = await productVariantAttributesRepo.getVariantsByAttributeValueId(id);
    if (usedInVariants.length > 0) {
      throw new Error(
        `Cannot delete this attribute value. It is used in ${usedInVariants.length} product variant(s). Please remove it from all variants first.`
      );
    }

    return await attributeValuesRepo.deleteAttributeValue(id);
  },

  // ==================== VARIANT ATTRIBUTES ====================

  /**
   * Link attribute value to product variant
   */
  linkAttributeToVariant: async (data: NewProductVariantAttribute, organizationId: string) => {
    // Verify variant exists
    const variant = await productVariantsRepo.getProductVariantById(data.productVariantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Verify attribute value exists
    const attributeValue = await attributeValuesRepo.getAttributeValueById(data.attributeValueId);
    if (!attributeValue) {
      throw new Error("Attribute value not found");
    }

    // Check if this attribute is already linked to the variant
    const variantAttributes = await productVariantAttributesRepo.getAttributesByVariantId(
      data.productVariantId
    );

    // Get the attribute for this value
    const attribute = await attributesRepo.getAttributeById(attributeValue.attributeId, organizationId);

    // Check if variant already has a value for this attribute
    for (const va of variantAttributes) {
      const existingValue = await attributeValuesRepo.getAttributeValueById(va.attributeValueId);
      if (existingValue && existingValue.attributeId === attributeValue.attributeId) {
        throw new Error(
          `Variant already has a value for attribute "${attribute?.name}". Remove the existing value first or update it.`
        );
      }
    }

    return await productVariantAttributesRepo.addAttributeToVariant(data);
  },

  /**
   * Get all attributes for a product variant
   */
  getVariantAttributes: async (productVariantId: string, organizationId: string) => {
    // Verify variant exists
    const variant = await productVariantsRepo.getProductVariantById(productVariantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    const variantAttributes = await productVariantAttributesRepo.getAttributesByVariantId(
      productVariantId
    );

    // Enrich with attribute and value details
    const enrichedAttributes = await Promise.all(
      variantAttributes.map(async (va) => {
        const attributeValue = await attributeValuesRepo.getAttributeValueById(va.attributeValueId);
        const attribute = attributeValue
          ? await attributesRepo.getAttributeById(attributeValue.attributeId, organizationId)
          : null;

        return {
          ...va,
          attributeValue: attributeValue?.value,
          attributeName: attribute?.name,
          attributeId: attribute?.id,
        };
      })
    );

    return enrichedAttributes;
  },

  /**
   * Remove attribute from variant
   */
  removeAttributeFromVariant: async (productVariantId: string, attributeValueId: string) => {
    // Verify variant exists
    const variant = await productVariantsRepo.getProductVariantById(productVariantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Verify attribute value exists
    const attributeValue = await attributeValuesRepo.getAttributeValueById(attributeValueId);
    if (!attributeValue) {
      throw new Error("Attribute value not found");
    }

    return await productVariantAttributesRepo.removeAttributeFromVariant(
      productVariantId,
      attributeValueId
    );
  },

  /**
   * Update variant attributes (replace all attributes)
   */
  updateVariantAttributes: async (productVariantId: string, attributeValueIds: string[]) => {
    // Verify variant exists
    const variant = await productVariantsRepo.getProductVariantById(productVariantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Remove all existing attributes
    const existingAttributes = await productVariantAttributesRepo.getAttributesByVariantId(
      productVariantId
    );

    for (const va of existingAttributes) {
      await productVariantAttributesRepo.removeAttributeFromVariant(
        productVariantId,
        va.attributeValueId
      );
    }

    // Add new attributes
    const addedAttributes = [];
    for (const attributeValueId of attributeValueIds) {
      const result = await productVariantAttributesRepo.addAttributeToVariant({
        productVariantId,
        attributeValueId,
      });
      addedAttributes.push(result);
    }

    return addedAttributes;
  },

  /**
   * Get all variants that have a specific attribute value
   */
  findVariantsByAttributeValue: async (attributeValueId: string) => {
    // Verify attribute value exists
    const attributeValue = await attributeValuesRepo.getAttributeValueById(attributeValueId);
    if (!attributeValue) {
      throw new Error("Attribute value not found");
    }

    const variantAttributes = await productVariantAttributesRepo.getVariantsByAttributeValueId(
      attributeValueId
    );

    // Get variant details
    const variants = await Promise.all(
      variantAttributes.map(async (va) => {
        const variant = await productVariantsRepo.getProductVariantById(va.productVariantId);
        return variant;
      })
    );

    return variants.filter((v) => v !== undefined);
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Get attributes formatted for variant generation
   * Returns attributes with their values in the format needed by variant generator
   */
  getAttributesForVariantGeneration: async (attributeIds: string[], organizationId: string) => {
    const attributes = [];

    for (const attributeId of attributeIds) {
      const attribute = await attributesRepo.getAttributeById(attributeId, organizationId);
      if (!attribute) {
        throw new Error(`Attribute with ID ${attributeId} not found`);
      }

      const values = await attributeValuesRepo.getAttributeValuesByAttributeId(attributeId);

      if (values.length === 0) {
        throw new Error(`Attribute "${attribute.name}" has no values. Add values before generating variants.`);
      }

      attributes.push({
        attributeId: attribute.id,
        attributeName: attribute.name,
        values: values.map((v) => ({
          id: v.id,
          value: v.value,
        })),
      });
    }

    return attributes;
  },

  /**
   * Validate attribute combination for variant creation
   * Ensures no duplicate attributes are used
   */
  validateAttributeCombination: async (attributeValueIds: string[], organizationId: string) => {
    const attributeIds = new Set<string>();

    for (const valueId of attributeValueIds) {
      const value = await attributeValuesRepo.getAttributeValueById(valueId);
      if (!value) {
        throw new Error(`Attribute value ${valueId} not found`);
      }

      if (attributeIds.has(value.attributeId)) {
        const attribute = await attributesRepo.getAttributeById(value.attributeId, organizationId);
        throw new Error(
          `Duplicate attribute detected: "${attribute?.name}". Each attribute can only have one value per variant.`
        );
      }

      attributeIds.add(value.attributeId);
    }

    return true;
  },
};
