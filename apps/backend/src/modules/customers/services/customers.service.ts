import { customersRepo, addressesRepo } from "../repo";
import { NewCustomer, UpdateCustomer } from "../customers.types";

export const customersService = {
  /**
   * Get all customers with optional filtering
   */
  findAll: async (
    filters: {
      isGuest?: boolean;
      search?: string;
    },
    organizationId: string
  ) => {
    let customers = await customersRepo.getAllCustomers(organizationId);

    if (!customers || customers.length === 0) {
      return [];
    }

    // Apply filters
    if (filters?.isGuest !== undefined) {
      customers = customers.filter((c) => c.is_guest === filters.isGuest);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.first_name.toLowerCase().includes(searchLower) ||
          c.last_name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.phone_number.toLowerCase().includes(searchLower)
      );
    }

    return customers;
  },

  /**
   * Get registered customers only (non-guest)
   */
  findRegisteredCustomers: async (organizationId: string) => {
    return await customersRepo.getRegisteredCustomers(organizationId);
  },

  /**
   * Get guest customers only
   */
  findGuestCustomers: async (organizationId: string) => {
    return await customersRepo.getGuestCustomers(organizationId);
  },

  /**
   * Get a single customer by ID
   */
  findById: async (id: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerById(id, organizationId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  },

  /**
   * Get customer with their addresses
   */
  findByIdWithAddresses: async (id: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerById(id, organizationId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const addresses = await addressesRepo.getAddressesByCustomerId(id, organizationId);

    return {
      ...customer,
      addresses,
    };
  },

  /**
   * Get customer by email
   */
  findByEmail: async (email: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerByEmail(email, organizationId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  },

  /**
   * Get customer by phone number
   */
  findByPhone: async (phoneNumber: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerByPhone(phoneNumber, organizationId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  },

  /**
   * Search customers by name, email, or phone
   */
  search: async (searchTerm: string, organizationId: string) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return await customersRepo.searchCustomers(searchTerm.trim(), organizationId);
  },

  /**
   * Create a new customer
   */
  create: async (data: NewCustomer, organizationId: string) => {
    // Check if email already exists
    const existingByEmail = await customersRepo.getCustomerByEmail(data.email, organizationId);
    if (existingByEmail) {
      throw new Error("Customer with this email already exists");
    }

    // Check if phone number already exists
    const existingByPhone = await customersRepo.getCustomerByPhone(
      data.phone_number,
      organizationId
    );
    if (existingByPhone) {
      throw new Error("Customer with this phone number already exists");
    }

    return await customersRepo.createCustomer(data, organizationId);
  },

  /**
   * Create a guest customer (for checkout without account)
   */
  createGuest: async (
    data: Omit<NewCustomer, "is_guest" | "user_id">,
    organizationId: string
  ) => {
    // Check if email already exists
    const existingByEmail = await customersRepo.getCustomerByEmail(data.email, organizationId);
    if (existingByEmail) {
      // If customer exists, return the existing customer
      // (Guest might have ordered before)
      return existingByEmail;
    }

    // Create guest customer
    return await customersRepo.createCustomer({
      ...data,
      is_guest: true,
      user_id: null,
    }, organizationId);
  },

  /**
   * Convert guest customer to registered customer
   */
  convertGuestToRegistered: async (customerId: string, userId: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerById(customerId, organizationId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (!customer.is_guest) {
      throw new Error("Customer is already registered");
    }

    return await customersRepo.updateCustomer(customerId, {
      is_guest: false,
      user_id: userId,
    }, organizationId);
  },

  /**
   * Update customer information
   */
  update: async (id: string, data: UpdateCustomer, organizationId: string) => {
    const existingCustomer = await customersRepo.getCustomerById(id, organizationId);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // If updating email, check it's not already taken
    if (data.email && data.email !== existingCustomer.email) {
      const emailExists = await customersRepo.getCustomerByEmail(data.email, organizationId);
      if (emailExists) {
        throw new Error("Email already in use by another customer");
      }
    }

    // If updating phone, check it's not already taken
    if (data.phone_number && data.phone_number !== existingCustomer.phone_number) {
      const phoneExists = await customersRepo.getCustomerByPhone(data.phone_number, organizationId);
      if (phoneExists) {
        throw new Error("Phone number already in use by another customer");
      }
    }

    return await customersRepo.updateCustomer(id, data, organizationId);
  },

  /**
   * Delete a customer
   */
  delete: async (id: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerById(id, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Note: Addresses will be cascade deleted due to foreign key constraint
    return await customersRepo.deleteCustomer(id, organizationId);
  },

  /**
   * Get customer statistics
   */
  getStats: async (customerId: string, organizationId: string) => {
    const customer = await customersRepo.getCustomerById(customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const addresses = await addressesRepo.getAddressesByCustomerId(customerId, organizationId);

    return {
      customer,
      addressCount: addresses.length,
      hasDefaultAddress: addresses.some((a) => a.isDefault),
    };
  },

  /**
   * Check if customer exists by email
   */
  existsByEmail: async (email: string, organizationId: string): Promise<boolean> => {
    try {
      const customer = await customersRepo.getCustomerByEmail(email, organizationId);
      return !!customer;
    } catch {
      return false;
    }
  },

  /**
   * Check if customer exists by phone
   */
  existsByPhone: async (phoneNumber: string, organizationId: string): Promise<boolean> => {
    try {
      const customer = await customersRepo.getCustomerByPhone(phoneNumber, organizationId);
      return !!customer;
    } catch {
      return false;
    }
  },

  /**
   * Get or create customer by email (useful for guest checkout)
   */
  getOrCreateByEmail: async (
    data: Omit<NewCustomer, "user_id">,
    organizationId: string
  ) => {
    // Try to find existing customer by email
    try {
      const existing = await customersRepo.getCustomerByEmail(data.email, organizationId);
      if (existing) {
        return { customer: existing, created: false };
      }
    } catch {
      // Customer doesn't exist, continue to create
    }

    // Create new customer
    const customer = await customersRepo.createCustomer({
      ...data,
      user_id: null,
    }, organizationId);

    return { customer, created: true };
  },
};
