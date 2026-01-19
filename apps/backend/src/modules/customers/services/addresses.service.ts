import { addressesRepo, customersRepo } from "../repo";
import { NewAddress, UpdateAddress } from "../customers.types";

export const addressesService = {
  /**
   * Get all addresses for a customer
   */
  findByCustomerId: async (customerId: string, organizationId: string) => {
    // Verify customer exists
    const customer = await customersRepo.getCustomerById(customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    return await addressesRepo.getAddressesByCustomerId(customerId, organizationId);
  },

  /**
   * Get a single address by ID
   */
  findById: async (id: string, organizationId: string) => {
    const address = await addressesRepo.getAddressById(id, organizationId);

    if (!address) {
      throw new Error("Address not found");
    }

    return address;
  },

  /**
   * Get customer's default address
   */
  findDefaultByCustomerId: async (customerId: string, organizationId: string) => {
    // Verify customer exists
    const customer = await customersRepo.getCustomerById(customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const address = await addressesRepo.getDefaultAddressByCustomerId(customerId, organizationId);

    if (!address) {
      throw new Error("No default address found for this customer");
    }

    return address;
  },

  /**
   * Create a new address for a customer
   */
  create: async (data: NewAddress, organizationId: string) => {
    // Verify customer exists
    const customer = await customersRepo.getCustomerById(data.customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get existing addresses for this customer
    const existingAddresses = await addressesRepo.getAddressesByCustomerId(
      data.customerId,
      organizationId
    );

    // If this is the first address, make it default
    const isFirstAddress = existingAddresses.length === 0;
    const shouldBeDefault = isFirstAddress || data.isDefault;

    // If setting as default, unset other defaults first
    if (shouldBeDefault && !isFirstAddress) {
      // This will be handled by setDefaultAddress after creation
    }

    const newAddress = await addressesRepo.createAddress({
      ...data,
      isDefault: shouldBeDefault,
    }, organizationId);

    // If this should be default and it's not the first address, use setDefaultAddress
    if (shouldBeDefault && !isFirstAddress) {
      return await addressesRepo.setDefaultAddress(data.customerId, newAddress.id, organizationId);
    }

    return newAddress;
  },

  /**
   * Update an address
   */
  update: async (id: string, data: UpdateAddress, organizationId: string) => {
    const existingAddress = await addressesRepo.getAddressById(id, organizationId);
    if (!existingAddress) {
      throw new Error("Address not found");
    }

    // If setting as default, handle default switching
    if (data.isDefault === true) {
      return await addressesRepo.setDefaultAddress(
        existingAddress.customerId,
        id,
        organizationId
      );
    }

    // Don't allow unsetting default without setting another one
    if (data.isDefault === false && existingAddress.isDefault) {
      throw new Error(
        "Cannot unset default address. Set another address as default instead."
      );
    }

    return await addressesRepo.updateAddress(id, data, organizationId);
  },

  /**
   * Set an address as the default for a customer
   */
  setAsDefault: async (customerId: string, addressId: string, organizationId: string) => {
    // Verify customer exists
    const customer = await customersRepo.getCustomerById(customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Verify address exists and belongs to customer
    const address = await addressesRepo.getAddressById(addressId, organizationId);
    if (!address) {
      throw new Error("Address not found");
    }

    if (address.customerId !== customerId) {
      throw new Error("Address does not belong to this customer");
    }

    return await addressesRepo.setDefaultAddress(customerId, addressId, organizationId);
  },

  /**
   * Delete an address
   */
  delete: async (id: string, organizationId: string) => {
    const address = await addressesRepo.getAddressById(id, organizationId);
    if (!address) {
      throw new Error("Address not found");
    }

    // Don't allow deleting the only address if it's default
    if (address.isDefault) {
      const allAddresses = await addressesRepo.getAddressesByCustomerId(
        address.customerId,
        organizationId
      );

      if (allAddresses.length === 1) {
        throw new Error(
          "Cannot delete the only address. Customer must have at least one address."
        );
      }

      // If deleting default address with multiple addresses, warn user
      throw new Error(
        "Cannot delete default address. Set another address as default first."
      );
    }

    return await addressesRepo.deleteAddress(id, organizationId);
  },

  /**
   * Verify address belongs to customer (for security checks)
   */
  verifyOwnership: async (addressId: string, customerId: string, organizationId: string): Promise<boolean> => {
    const address = await addressesRepo.getAddressById(addressId, organizationId);
    if (!address) {
      return false;
    }

    return address.customerId === customerId;
  },

  /**
   * Get address statistics for a customer
   */
  getCustomerAddressStats: async (customerId: string, organizationId: string) => {
    const addresses = await addressesRepo.getAddressesByCustomerId(customerId, organizationId);

    const defaultAddress = addresses.find((a) => a.isDefault);
    const addressesByCountry = addresses.reduce((acc, addr) => {
      acc[addr.country] = (acc[addr.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAddresses: addresses.length,
      hasDefaultAddress: !!defaultAddress,
      defaultAddressId: defaultAddress?.id,
      addressesByCountry,
    };
  },
};
