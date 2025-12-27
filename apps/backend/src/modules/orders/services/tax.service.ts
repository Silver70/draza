import { db } from '../../../shared/db';
import { taxJurisdictionsTable, productTaxSettingsTable } from '../../../shared/db/tax';
import { eq, and, isNull, or, lte, gte } from 'drizzle-orm';

export interface TaxCalculationInput {
  shippingState: string; // e.g., "CA", "NY"
  shippingCountry: string; // e.g., "USA"
  items: Array<{
    productId: string;
    subtotal: number; // Item subtotal (price * quantity)
  }>;
}

export interface TaxCalculationResult {
  taxJurisdictionId: string | null;
  taxJurisdictionName: string;
  taxRate: number; // e.g., 0.0725 for 7.25%
  taxableAmount: number; // Amount that tax applies to (after exemptions)
  taxAmount: number; // Calculated tax
  exemptAmount: number; // Amount exempt from tax
  appliedExemptions: Array<{
    productId: string;
    exemptionCategory: string | null;
    amount: number;
  }>;
}

/**
 * Calculate tax for an order based on shipping address and items
 */
export async function calculateOrderTax(
  input: TaxCalculationInput
): Promise<TaxCalculationResult> {
  const { shippingState, shippingCountry, items } = input;

  // 1. Find applicable tax jurisdiction
  const jurisdiction = await findTaxJurisdiction(shippingState, shippingCountry);

  if (!jurisdiction) {
    // No tax jurisdiction found (e.g., international order, no tax in this state)
    return {
      taxJurisdictionId: null,
      taxJurisdictionName: 'No Tax',
      taxRate: 0,
      taxableAmount: 0,
      taxAmount: 0,
      exemptAmount: 0,
      appliedExemptions: [],
    };
  }

  // 2. Get product tax settings for all items
  const productIds = items.map(item => item.productId);
  const productTaxSettings = await db
    .select()
    .from(productTaxSettingsTable)
    .where(
      and(
        eq(productTaxSettingsTable.isTaxExempt, true),
        // Only get settings for products in this order
        or(...productIds.map(id => eq(productTaxSettingsTable.productId, id)))
      )
    );

  // 3. Calculate taxable vs exempt amounts
  let taxableAmount = 0;
  let exemptAmount = 0;
  const appliedExemptions: Array<{
    productId: string;
    exemptionCategory: string | null;
    amount: number;
  }> = [];

  for (const item of items) {
    const taxSetting = productTaxSettings.find(
      setting => setting.productId === item.productId
    );

    if (taxSetting && taxSetting.isTaxExempt) {
      // Item is tax-exempt
      exemptAmount += item.subtotal;
      appliedExemptions.push({
        productId: item.productId,
        exemptionCategory: taxSetting.exemptionCategory,
        amount: item.subtotal,
      });
    } else {
      // Item is taxable
      taxableAmount += item.subtotal;
    }
  }

  // 4. Calculate tax
  const taxRate = parseFloat(jurisdiction.rate);
  const taxAmount = taxableAmount * taxRate;

  return {
    taxJurisdictionId: jurisdiction.id,
    taxJurisdictionName: jurisdiction.name,
    taxRate,
    taxableAmount,
    taxAmount,
    exemptAmount,
    appliedExemptions,
  };
}

/**
 * Find the applicable tax jurisdiction for a given address
 * Priority: State > Country
 */
async function findTaxJurisdiction(state: string, country: string) {
  const now = new Date();

  // First, try to find state-specific tax
  const stateTax = await db
    .select()
    .from(taxJurisdictionsTable)
    .where(
      and(
        eq(taxJurisdictionsTable.stateCode, state),
        eq(taxJurisdictionsTable.country, country),
        eq(taxJurisdictionsTable.isActive, true),
        // Check effective dates
        lte(taxJurisdictionsTable.effectiveFrom, now),
        or(
          isNull(taxJurisdictionsTable.effectiveTo),
          gte(taxJurisdictionsTable.effectiveTo, now)
        )
      )
    )
    .limit(1);

  if (stateTax.length > 0) {
    return stateTax[0];
  }

  // Fallback to country-level tax if no state tax found
  const countryTax = await db
    .select()
    .from(taxJurisdictionsTable)
    .where(
      and(
        eq(taxJurisdictionsTable.country, country),
        eq(taxJurisdictionsTable.type, 'country'),
        eq(taxJurisdictionsTable.isActive, true),
        lte(taxJurisdictionsTable.effectiveFrom, now),
        or(
          isNull(taxJurisdictionsTable.effectiveTo),
          gte(taxJurisdictionsTable.effectiveTo, now)
        )
      )
    )
    .limit(1);

  return countryTax.length > 0 ? countryTax[0] : null;
}

/**
 * Get all active tax jurisdictions
 */
export async function getAllActiveTaxJurisdictions() {
  const now = new Date();

  return await db
    .select()
    .from(taxJurisdictionsTable)
    .where(
      and(
        eq(taxJurisdictionsTable.isActive, true),
        lte(taxJurisdictionsTable.effectiveFrom, now),
        or(
          isNull(taxJurisdictionsTable.effectiveTo),
          gte(taxJurisdictionsTable.effectiveTo, now)
        )
      )
    )
    .orderBy(taxJurisdictionsTable.name);
}

/**
 * Get all tax jurisdictions (including inactive)
 */
export async function getAllTaxJurisdictions() {
  return await db
    .select()
    .from(taxJurisdictionsTable)
    .orderBy(taxJurisdictionsTable.name);
}

/**
 * Get tax jurisdictions by type
 */
export async function getTaxJurisdictionsByType(type: 'country' | 'state' | 'county' | 'city') {
  return await db
    .select()
    .from(taxJurisdictionsTable)
    .where(eq(taxJurisdictionsTable.type, type))
    .orderBy(taxJurisdictionsTable.name);
}

/**
 * Get tax jurisdiction by ID
 */
export async function getTaxJurisdictionById(id: string) {
  const results = await db
    .select()
    .from(taxJurisdictionsTable)
    .where(eq(taxJurisdictionsTable.id, id))
    .limit(1);

  if (results.length === 0) {
    throw new Error("Tax jurisdiction not found");
  }

  return results[0];
}

/**
 * Create a new tax jurisdiction
 */
export async function createTaxJurisdiction(data: {
  name: string;
  type: 'country' | 'state' | 'county' | 'city';
  country?: string;
  stateCode?: string;
  countyName?: string;
  cityName?: string;
  rate: number;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  isActive?: boolean;
  description?: string;
}) {
  const results = await db
    .insert(taxJurisdictionsTable)
    .values({
      name: data.name,
      type: data.type,
      country: data.country || "USA",
      stateCode: data.stateCode,
      countyName: data.countyName,
      cityName: data.cityName,
      rate: data.rate.toString(),
      effectiveFrom: data.effectiveFrom || new Date(),
      effectiveTo: data.effectiveTo || null,
      isActive: data.isActive ?? true,
      description: data.description,
    })
    .returning();

  return results[0];
}

/**
 * Update a tax jurisdiction
 */
export async function updateTaxJurisdiction(
  id: string,
  data: {
    name?: string;
    type?: 'country' | 'state' | 'county' | 'city';
    country?: string;
    stateCode?: string;
    countyName?: string;
    cityName?: string;
    rate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    isActive?: boolean;
    description?: string;
  }
) {
  const updateData: Record<string, any> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.stateCode !== undefined) updateData.stateCode = data.stateCode;
  if (data.countyName !== undefined) updateData.countyName = data.countyName;
  if (data.cityName !== undefined) updateData.cityName = data.cityName;
  if (data.rate !== undefined) updateData.rate = data.rate.toString();
  if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom;
  if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.description !== undefined) updateData.description = data.description;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  const results = await db
    .update(taxJurisdictionsTable)
    .set(updateData)
    .where(eq(taxJurisdictionsTable.id, id))
    .returning();

  if (results.length === 0) {
    throw new Error("Tax jurisdiction not found");
  }

  return results[0];
}

/**
 * Deactivate a tax jurisdiction
 */
export async function deactivateTaxJurisdiction(id: string) {
  const results = await db
    .update(taxJurisdictionsTable)
    .set({ isActive: false })
    .where(eq(taxJurisdictionsTable.id, id))
    .returning();

  if (results.length === 0) {
    throw new Error("Tax jurisdiction not found");
  }

  return results[0];
}

/**
 * Activate a tax jurisdiction
 */
export async function activateTaxJurisdiction(id: string) {
  const results = await db
    .update(taxJurisdictionsTable)
    .set({ isActive: true })
    .where(eq(taxJurisdictionsTable.id, id))
    .returning();

  if (results.length === 0) {
    throw new Error("Tax jurisdiction not found");
  }

  return results[0];
}

/**
 * Delete a tax jurisdiction
 */
export async function deleteTaxJurisdiction(id: string) {
  const results = await db
    .delete(taxJurisdictionsTable)
    .where(eq(taxJurisdictionsTable.id, id))
    .returning();

  if (results.length === 0) {
    throw new Error("Tax jurisdiction not found");
  }

  return results[0];
}
