import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { customersService, addressesService } from "./services";
import {
  createCustomerSchema,
  updateCustomerSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./customers.types";

export const customersRoutes = new Hono();

// ==================== CUSTOMERS ROUTES ====================

/**
 * GET /customers
 * Get all customers with optional filters
 */
customersRoutes.get("/", async (c) => {
  try {
    const { search, isGuest } = c.req.query();

    const filters = {
      search: search || undefined,
      isGuest: isGuest === "true" ? true : isGuest === "false" ? false : undefined,
    };

    const customers = await customersService.findAll(filters);
    return c.json({ success: true, data: customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customers";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /customers/registered
 * Get registered customers only (non-guest)
 */
customersRoutes.get("/registered", async (c) => {
  try {
    const customers = await customersService.findRegisteredCustomers();
    return c.json({ success: true, data: customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch registered customers";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /customers/guests
 * Get guest customers only
 */
customersRoutes.get("/guests", async (c) => {
  try {
    const customers = await customersService.findGuestCustomers();
    return c.json({ success: true, data: customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch guest customers";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /customers/search
 * Search customers by name, email, or phone
 */
customersRoutes.get("/search", async (c) => {
  try {
    const searchTerm = c.req.query("q");

    if (!searchTerm) {
      return c.json({ success: false, error: "Search term is required" }, 400);
    }

    const customers = await customersService.search(searchTerm);
    return c.json({ success: true, data: customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search customers";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /customers/email/:email
 * Get customer by email
 */
customersRoutes.get("/email/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const customer = await customersService.findByEmail(email);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/phone/:phone
 * Get customer by phone number
 */
customersRoutes.get("/phone/:phone", async (c) => {
  try {
    const phone = c.req.param("phone");
    const customer = await customersService.findByPhone(phone);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/:id
 * Get customer by ID
 */
customersRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const customer = await customersService.findById(id);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/:id/addresses
 * Get customer with their addresses
 */
customersRoutes.get("/:id/addresses", async (c) => {
  try {
    const id = c.req.param("id");
    const customer = await customersService.findByIdWithAddresses(id);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/:id/stats
 * Get customer statistics
 */
customersRoutes.get("/:id/stats", async (c) => {
  try {
    const id = c.req.param("id");
    const stats = await customersService.getStats(id);
    return c.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /customers
 * Create a new customer
 */
customersRoutes.post("/", zValidator("json", createCustomerSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const customer = await customersService.create(data);
    return c.json({ success: true, data: customer }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create customer";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /customers/guest
 * Create a guest customer (for checkout without account)
 */
customersRoutes.post("/guest", async (c) => {
  try {
    const data = await c.req.json();
    const customer = await customersService.createGuest(data);
    return c.json({ success: true, data: customer }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create guest customer";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * POST /customers/get-or-create
 * Get existing customer by email or create new one
 */
customersRoutes.post("/get-or-create", async (c) => {
  try {
    const data = await c.req.json();
    const result = await customersService.getOrCreateByEmail(data);
    return c.json({ success: true, data: result }, result.created ? 201 : 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get or create customer";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /customers/:id
 * Update customer information
 */
customersRoutes.put("/:id", zValidator("json", updateCustomerSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const customer = await customersService.update(id, data);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update customer";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /customers/:id/convert-to-registered
 * Convert guest customer to registered customer
 */
customersRoutes.put("/:id/convert-to-registered", async (c) => {
  try {
    const id = c.req.param("id");
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ success: false, error: "userId is required" }, 400);
    }

    const customer = await customersService.convertGuestToRegistered(id, userId);
    return c.json({ success: true, data: customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert customer";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /customers/:id
 * Delete a customer
 */
customersRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await customersService.delete(id);
    return c.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete customer";
    return c.json({ success: false, error: message }, 400);
  }
});

// ==================== ADDRESSES ROUTES ====================

/**
 * GET /customers/:customerId/addresses/all
 * Get all addresses for a customer
 */
customersRoutes.get("/:customerId/addresses/all", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const addresses = await addressesService.findByCustomerId(customerId);
    return c.json({ success: true, data: addresses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch addresses";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/:customerId/addresses/default
 * Get customer's default address
 */
customersRoutes.get("/:customerId/addresses/default", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const address = await addressesService.findDefaultByCustomerId(customerId);
    return c.json({ success: true, data: address });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No default address found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/:customerId/addresses/stats
 * Get address statistics for a customer
 */
customersRoutes.get("/:customerId/addresses/stats", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const stats = await addressesService.getCustomerAddressStats(customerId);
    return c.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch address stats";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * GET /customers/addresses/:addressId
 * Get address by ID
 */
customersRoutes.get("/addresses/:addressId", async (c) => {
  try {
    const addressId = c.req.param("addressId");
    const address = await addressesService.findById(addressId);
    return c.json({ success: true, data: address });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Address not found";
    return c.json({ success: false, error: message }, 404);
  }
});

/**
 * POST /customers/:customerId/addresses
 * Create a new address for a customer
 */
customersRoutes.post("/:customerId/addresses", zValidator("json", createAddressSchema.omit({ customerId: true })), async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const data = c.req.valid("json");
    const address = await addressesService.create({ ...data, customerId });
    return c.json({ success: true, data: address }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create address";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /customers/addresses/:addressId
 * Update an address
 */
customersRoutes.put("/addresses/:addressId", zValidator("json", updateAddressSchema), async (c) => {
  try {
    const addressId = c.req.param("addressId");
    const data = c.req.valid("json");
    const address = await addressesService.update(addressId, data);
    return c.json({ success: true, data: address });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update address";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * PUT /customers/:customerId/addresses/:addressId/set-default
 * Set an address as default for a customer
 */
customersRoutes.put("/:customerId/addresses/:addressId/set-default", async (c) => {
  try {
    const customerId = c.req.param("customerId");
    const addressId = c.req.param("addressId");
    const address = await addressesService.setAsDefault(customerId, addressId);
    return c.json({ success: true, data: address });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set default address";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * DELETE /customers/addresses/:addressId
 * Delete an address
 */
customersRoutes.delete("/addresses/:addressId", async (c) => {
  try {
    const addressId = c.req.param("addressId");
    await addressesService.delete(addressId);
    return c.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete address";
    return c.json({ success: false, error: message }, 400);
  }
});
