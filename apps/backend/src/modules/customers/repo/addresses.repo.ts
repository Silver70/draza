import { eq, and } from "drizzle-orm";
import { db } from "../../../shared/db";
import { addressesTable } from "../../../shared/db/address";
import { customersTable } from "../../../shared/db/customer";
import { NewAddress, UpdateAddress } from "../customers.types";

export const addressesRepo = {
  async createAddress(data: NewAddress, organizationId: string) {
    const [newAddress] = await db
      .insert(addressesTable)
      .values({
        ...data,
        organizationId,
      })
      .returning();
    return newAddress;
  },

  async getAddressById(id: string, organizationId: string) {
    const [result] = await db
      .select({
        address: addressesTable
      })
      .from(addressesTable)
      .innerJoin(customersTable, eq(addressesTable.customerId, customersTable.id))
      .where(
        and(
          eq(addressesTable.id, id),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return result?.address;
  },

  async getAddressesByCustomerId(customerId: string, organizationId: string) {
    const results = await db
      .select({
        address: addressesTable
      })
      .from(addressesTable)
      .innerJoin(customersTable, eq(addressesTable.customerId, customersTable.id))
      .where(
        and(
          eq(addressesTable.customerId, customerId),
          eq(customersTable.organizationId, organizationId)
        )
      );
    return results.map(row => row.address);
  },

  async getDefaultAddressByCustomerId(customerId: string, organizationId: string) {
    const [result] = await db
      .select({
        address: addressesTable
      })
      .from(addressesTable)
      .innerJoin(customersTable, eq(addressesTable.customerId, customersTable.id))
      .where(
        and(
          eq(addressesTable.customerId, customerId),
          eq(customersTable.organizationId, organizationId),
          eq(addressesTable.isDefault, true)
        )
      )
      .limit(1);
    return result?.address;
  },

  async updateAddress(id: string, data: UpdateAddress, organizationId: string) {
    // Verify address belongs to organization via customer
    const existingAddress = await this.getAddressById(id, organizationId);
    if (!existingAddress) {
      throw new Error("Address not found or does not belong to organization");
    }

    const [updatedAddress] = await db
      .update(addressesTable)
      .set(data)
      .where(eq(addressesTable.id, id))
      .returning();
    return updatedAddress;
  },

  async setDefaultAddress(customerId: string, addressId: string, organizationId: string) {
    // Verify customer belongs to organization
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, customerId),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!customer) {
      throw new Error("Customer not found or does not belong to organization");
    }

    // First, unset all other default addresses for this customer
    await db
      .update(addressesTable)
      .set({ isDefault: false })
      .where(eq(addressesTable.customerId, customerId));

    // Then set the specified address as default
    const [updatedAddress] = await db
      .update(addressesTable)
      .set({ isDefault: true })
      .where(
        and(
          eq(addressesTable.id, addressId),
          eq(addressesTable.customerId, customerId)
        )
      )
      .returning();
    return updatedAddress;
  },

  async deleteAddress(id: string, organizationId: string) {
    // Verify address belongs to organization via customer
    const existingAddress = await this.getAddressById(id, organizationId);
    if (!existingAddress) {
      throw new Error("Address not found or does not belong to organization");
    }

    await db
      .delete(addressesTable)
      .where(eq(addressesTable.id, id));
  },
};
