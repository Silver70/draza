import { eq, and } from "drizzle-orm";
import { db } from "../../../shared/db";
import { addressesTable } from "../../../shared/db/address";
import { NewAddress, UpdateAddress } from "../customers.types";

export const addressesRepo = {
  async createAddress(data: NewAddress) {
    const [newAddress] = await db
      .insert(addressesTable)
      .values(data)
      .returning();
    return newAddress;
  },

  async getAddressById(id: string) {
    const address = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.id, id))
      .limit(1);
    return address[0];
  },

  async getAddressesByCustomerId(customerId: string) {
    const addresses = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.customerId, customerId));
    return addresses;
  },

  async getDefaultAddressByCustomerId(customerId: string) {
    const address = await db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.customerId, customerId),
          eq(addressesTable.isDefault, true)
        )
      )
      .limit(1);
    return address[0];
  },

  async updateAddress(id: string, data: UpdateAddress) {
    const [updatedAddress] = await db
      .update(addressesTable)
      .set(data)
      .where(eq(addressesTable.id, id))
      .returning();
    return updatedAddress;
  },

  async setDefaultAddress(customerId: string, addressId: string) {
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

  async deleteAddress(id: string) {
    await db
      .delete(addressesTable)
      .where(eq(addressesTable.id, id));
  },
};
