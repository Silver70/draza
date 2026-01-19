import { db } from '../../../shared/db';
import { shippingMethodsTable, shippingRateTiersTable } from '../../../shared/db/shipping';
import { eq, and, gte, or, lte, isNull } from 'drizzle-orm';

export interface ShippingCalculationInput {
  subtotal: number; // Order subtotal (before tax and shipping)
  totalWeight?: number; // Total weight in lbs (optional, for weight-based shipping)
}

export interface ShippingOption {
  methodId: string;
  name: string;
  displayName: string;
  description: string | null;
  carrier: string;
  cost: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isFree: boolean; // Whether shipping is free due to threshold
}

/**
 * Calculate available shipping options and their costs for an order
 */
export async function calculateShippingOptions(
  input: ShippingCalculationInput,
  organizationId: string
): Promise<ShippingOption[]> {
  const { subtotal, totalWeight = 0 } = input;

  // Get all active shipping methods for this organization
  const shippingMethods = await db
    .select()
    .from(shippingMethodsTable)
    .where(
      and(
        eq(shippingMethodsTable.isActive, true),
        eq(shippingMethodsTable.organizationId, organizationId)
      )
    )
    .orderBy(shippingMethodsTable.displayOrder);

  const options: ShippingOption[] = [];

  for (const method of shippingMethods) {
    const cost = await calculateShippingCost(method, subtotal, totalWeight);

    // Check if free shipping threshold is met
    const isFree =
      method.freeShippingThreshold &&
      subtotal >= parseFloat(method.freeShippingThreshold);

    options.push({
      methodId: method.id,
      name: method.name,
      displayName: method.displayName,
      description: method.description,
      carrier: method.carrier,
      cost: isFree ? 0 : cost,
      estimatedDaysMin: method.estimatedDaysMin,
      estimatedDaysMax: method.estimatedDaysMax,
      isFree: !!isFree,
    });
  }

  return options;
}

/**
 * Calculate shipping cost for a specific method
 */
async function calculateShippingCost(
  method: typeof shippingMethodsTable.$inferSelect,
  subtotal: number,
  totalWeight: number
): Promise<number> {
  const calculationType = method.calculationType;

  switch (calculationType) {
    case 'flat_rate':
      return parseFloat(method.baseRate);

    case 'free_threshold':
      // Check if threshold is met
      if (
        method.freeShippingThreshold &&
        subtotal >= parseFloat(method.freeShippingThreshold)
      ) {
        return 0;
      }
      return parseFloat(method.baseRate);

    case 'weight_based':
      return await calculateWeightBasedShipping(method.id, totalWeight);

    case 'price_tier':
      return await calculatePriceTierShipping(method.id, subtotal);

    default:
      // Default to flat rate
      return parseFloat(method.baseRate);
  }
}

/**
 * Calculate shipping cost based on weight tiers
 */
async function calculateWeightBasedShipping(
  methodId: string,
  totalWeight: number
): Promise<number> {
  const tiers = await db
    .select()
    .from(shippingRateTiersTable)
    .where(eq(shippingRateTiersTable.shippingMethodId, methodId))
    .orderBy(shippingRateTiersTable.minValue);

  // Find the applicable tier
  for (const tier of tiers) {
    const minWeight = parseFloat(tier.minValue);
    const maxWeight = tier.maxValue ? parseFloat(tier.maxValue) : Infinity;

    if (totalWeight >= minWeight && totalWeight < maxWeight) {
      return parseFloat(tier.rate);
    }
  }

  // If no tier matches, return the base rate from the method
  const method = await db
    .select()
    .from(shippingMethodsTable)
    .where(eq(shippingMethodsTable.id, methodId))
    .limit(1);

  return method.length > 0 ? parseFloat(method[0].baseRate) : 0;
}

/**
 * Calculate shipping cost based on price tiers
 */
async function calculatePriceTierShipping(
  methodId: string,
  subtotal: number
): Promise<number> {
  const tiers = await db
    .select()
    .from(shippingRateTiersTable)
    .where(eq(shippingRateTiersTable.shippingMethodId, methodId))
    .orderBy(shippingRateTiersTable.minValue);

  // Find the applicable tier
  for (const tier of tiers) {
    const minPrice = parseFloat(tier.minValue);
    const maxPrice = tier.maxValue ? parseFloat(tier.maxValue) : Infinity;

    if (subtotal >= minPrice && subtotal < maxPrice) {
      return parseFloat(tier.rate);
    }
  }

  // If no tier matches, return the base rate from the method
  const method = await db
    .select()
    .from(shippingMethodsTable)
    .where(eq(shippingMethodsTable.id, methodId))
    .limit(1);

  return method.length > 0 ? parseFloat(method[0].baseRate) : 0;
}

/**
 * Get details for a specific shipping method
 */
export async function getShippingMethod(methodId: string, organizationId: string) {
  const method = await db
    .select()
    .from(shippingMethodsTable)
    .where(
      and(
        eq(shippingMethodsTable.id, methodId),
        eq(shippingMethodsTable.organizationId, organizationId)
      )
    )
    .limit(1);

  return method.length > 0 ? method[0] : null;
}

/**
 * Get all active shipping methods
 */
export async function getAllActiveShippingMethods(organizationId: string) {
  return await db
    .select()
    .from(shippingMethodsTable)
    .where(
      and(
        eq(shippingMethodsTable.isActive, true),
        eq(shippingMethodsTable.organizationId, organizationId)
      )
    )
    .orderBy(shippingMethodsTable.displayOrder);
}

/**
 * Calculate estimated delivery date based on shipping method
 */
export function calculateEstimatedDeliveryDate(
  estimatedDaysMin: number | null,
  estimatedDaysMax: number | null
): Date | null {
  if (!estimatedDaysMax) {
    return null;
  }

  const now = new Date();
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + estimatedDaysMax);

  return deliveryDate;
}
