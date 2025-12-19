import { eq } from "drizzle-orm";
import { db } from "../../../shared/db";
import {
  attributesTable,
  attributeValuesTable,
  productVariantAttributesTable,
} from "../../../shared/db/catalogue";
import {
  NewAttribute,
  UpdateAttribute,
  NewAttributeValue,
  UpdateAttributeValue,
  NewProductVariantAttribute,
} from "../products.types";

export const attributesRepo = {
  async createAttribute(data: NewAttribute) {
    const [newAttribute] = await db
      .insert(attributesTable)
      .values(data)
      .returning();
    return newAttribute;
  },

  async getAttributeById(id: string) {
    const attribute = await db
      .select()
      .from(attributesTable)
      .where(eq(attributesTable.id, id))
      .limit(1);
    return attribute[0];
  },

  async getAttributeByName(name: string) {
    const attribute = await db
      .select()
      .from(attributesTable)
      .where(eq(attributesTable.name, name))
      .limit(1);
    return attribute[0];
  },

  async getAllAttributes() {
    const attributes = await db.select().from(attributesTable);
    return attributes;
  },

  async updateAttribute(id: string, data: UpdateAttribute) {
    const [updatedAttribute] = await db
      .update(attributesTable)
      .set(data)
      .where(eq(attributesTable.id, id))
      .returning();
    return updatedAttribute;
  },

  async deleteAttribute(id: string) {
    await db
      .delete(attributesTable)
      .where(eq(attributesTable.id, id));
  },
};

// Attribute Values Repository
export const attributeValuesRepo = {
  async createAttributeValue(data: NewAttributeValue) {
    const [newAttributeValue] = await db
      .insert(attributeValuesTable)
      .values(data)
      .returning();
    return newAttributeValue;
  },

  async getAttributeValueById(id: string) {
    const attributeValue = await db
      .select()
      .from(attributeValuesTable)
      .where(eq(attributeValuesTable.id, id))
      .limit(1);
    return attributeValue[0];
  },

  async getAttributeValuesByAttributeId(attributeId: string) {
    const attributeValues = await db
      .select()
      .from(attributeValuesTable)
      .where(eq(attributeValuesTable.attributeId, attributeId));
    return attributeValues;
  },

  async updateAttributeValue(id: string, data: UpdateAttributeValue) {
    const [updatedAttributeValue] = await db
      .update(attributeValuesTable)
      .set(data)
      .where(eq(attributeValuesTable.id, id))
      .returning();
    return updatedAttributeValue;
  },

  async deleteAttributeValue(id: string) {
    await db
      .delete(attributeValuesTable)
      .where(eq(attributeValuesTable.id, id));
  },
};

// Product Variant Attributes Repository
export const productVariantAttributesRepo = {
  async addAttributeToVariant(data: NewProductVariantAttribute) {
    const [newVariantAttribute] = await db
      .insert(productVariantAttributesTable)
      .values(data)
      .returning();
    return newVariantAttribute;
  },

  async getAttributesByVariantId(productVariantId: string) {
    const attributes = await db
      .select()
      .from(productVariantAttributesTable)
      .where(eq(productVariantAttributesTable.productVariantId, productVariantId));
    return attributes;
  },

  async getVariantsByAttributeValueId(attributeValueId: string) {
    const variants = await db
      .select()
      .from(productVariantAttributesTable)
      .where(eq(productVariantAttributesTable.attributeValueId, attributeValueId));
    return variants;
  },

  async removeAttributeFromVariant(productVariantId: string, attributeValueId: string) {
    await db
      .delete(productVariantAttributesTable)
      .where(
        eq(productVariantAttributesTable.productVariantId, productVariantId) &&
        eq(productVariantAttributesTable.attributeValueId, attributeValueId)
      );
  },
};
