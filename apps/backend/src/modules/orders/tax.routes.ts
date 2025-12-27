import { Hono } from "hono";
import * as taxService from "./services/tax.service";

export const taxRoutes = new Hono();

// ==================== TAX JURISDICTIONS ROUTES ====================

/**
 * GET /tax/jurisdictions
 * Get all active tax jurisdictions
 */
taxRoutes.get("/jurisdictions", async (c) => {
  try {
    const jurisdictions = await taxService.getAllActiveTaxJurisdictions();
    return c.json({ success: true, data: jurisdictions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tax jurisdictions";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /tax/jurisdictions/all
 * Get all tax jurisdictions (including inactive)
 */
taxRoutes.get("/jurisdictions/all", async (c) => {
  try {
    const jurisdictions = await taxService.getAllTaxJurisdictions();
    return c.json({ success: true, data: jurisdictions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tax jurisdictions";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /tax/jurisdictions/type/:type
 * Get tax jurisdictions by type (country, state, county, city)
 */
taxRoutes.get("/jurisdictions/type/:type", async (c) => {
  try {
    const type = c.req.param("type") as 'country' | 'state' | 'county' | 'city';

    if (!['country', 'state', 'county', 'city'].includes(type)) {
      return c.json({ success: false, error: "Invalid jurisdiction type" }, 400);
    }

    const jurisdictions = await taxService.getTaxJurisdictionsByType(type);
    return c.json({ success: true, data: jurisdictions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tax jurisdictions";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * GET /tax/jurisdictions/:id
 * Get tax jurisdiction by ID
 */
taxRoutes.get("/jurisdictions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const jurisdiction = await taxService.getTaxJurisdictionById(id);
    return c.json({ success: true, data: jurisdiction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tax jurisdiction not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /tax/jurisdictions
 * Create a new tax jurisdiction
 */
taxRoutes.post("/jurisdictions", async (c) => {
  try {
    const data = await c.req.json();

    // Validate required fields
    if (!data.name || !data.type || data.rate === undefined) {
      return c.json({
        success: false,
        error: "Missing required fields: name, type, and rate are required"
      }, 400);
    }

    // Validate type
    if (!['country', 'state', 'county', 'city'].includes(data.type)) {
      return c.json({ success: false, error: "Invalid jurisdiction type" }, 400);
    }

    // Validate rate is between 0 and 1
    if (data.rate < 0 || data.rate > 1) {
      return c.json({ success: false, error: "Rate must be between 0 and 1" }, 400);
    }

    const jurisdiction = await taxService.createTaxJurisdiction({
      name: data.name,
      type: data.type,
      country: data.country,
      stateCode: data.stateCode,
      countyName: data.countyName,
      cityName: data.cityName,
      rate: data.rate,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      isActive: data.isActive,
      description: data.description,
    });
    return c.json({ success: true, data: jurisdiction }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tax jurisdiction";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /tax/jurisdictions/:id
 * Update a tax jurisdiction
 */
taxRoutes.put("/jurisdictions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();

    // Validate type if provided
    if (data.type && !['country', 'state', 'county', 'city'].includes(data.type)) {
      return c.json({ success: false, error: "Invalid jurisdiction type" }, 400);
    }

    // Validate rate if provided
    if (data.rate !== undefined && (data.rate < 0 || data.rate > 1)) {
      return c.json({ success: false, error: "Rate must be between 0 and 1" }, 400);
    }

    const jurisdiction = await taxService.updateTaxJurisdiction(id, {
      name: data.name,
      type: data.type,
      country: data.country,
      stateCode: data.stateCode,
      countyName: data.countyName,
      cityName: data.cityName,
      rate: data.rate,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      isActive: data.isActive,
      description: data.description,
    });
    return c.json({ success: true, data: jurisdiction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tax jurisdiction";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /tax/jurisdictions/:id/deactivate
 * Deactivate a tax jurisdiction
 */
taxRoutes.put("/jurisdictions/:id/deactivate", async (c) => {
  try {
    const id = c.req.param("id");
    const jurisdiction = await taxService.deactivateTaxJurisdiction(id);
    return c.json({ success: true, data: jurisdiction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deactivate tax jurisdiction";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /tax/jurisdictions/:id/activate
 * Activate a tax jurisdiction
 */
taxRoutes.put("/jurisdictions/:id/activate", async (c) => {
  try {
    const id = c.req.param("id");
    const jurisdiction = await taxService.activateTaxJurisdiction(id);
    return c.json({ success: true, data: jurisdiction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate tax jurisdiction";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /tax/jurisdictions/:id
 * Delete a tax jurisdiction
 */
taxRoutes.delete("/jurisdictions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await taxService.deleteTaxJurisdiction(id);
    return c.json({ success: true, message: "Tax jurisdiction deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tax jurisdiction";
    return c.json({ success: false, error: message }, 400);
  }
});
