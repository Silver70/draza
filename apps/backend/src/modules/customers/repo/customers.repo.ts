import { eq, or, ilike, and } from "drizzle-orm";
import { db } from "../../../shared/db";
import { customersTable } from "../../../shared/db/customer";
import { NewCustomer, UpdateCustomer } from "../customers.types";

export const customersRepo = {
  async createCustomer(data: NewCustomer, organizationId: string) {
    const [newCustomer] = await db
      .insert(customersTable)
      .values({
        ...data,
        organizationId,
      })
      .returning();
    return newCustomer;
  },

  async getCustomerById(id: string, organizationId: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, id),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return customer[0];
  },

  async getCustomerByEmail(email: string, organizationId: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.email, email),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return customer[0];
  },

  async getCustomerByPhone(phoneNumber: string, organizationId: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.phone_number, phoneNumber),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return customer[0];
  },

  async getAllCustomers(organizationId: string) {
    const customers = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.organizationId, organizationId));
    return customers;
  },

  async searchCustomers(searchTerm: string, organizationId: string) {
    const customers = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.organizationId, organizationId),
          or(
            ilike(customersTable.first_name, `%${searchTerm}%`),
            ilike(customersTable.last_name, `%${searchTerm}%`),
            ilike(customersTable.email, `%${searchTerm}%`),
            ilike(customersTable.phone_number, `%${searchTerm}%`)
          )
        )
      );
    return customers;
  },

  async getGuestCustomers(organizationId: string) {
    const customers = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.organizationId, organizationId),
          eq(customersTable.is_guest, true)
        )
      );
    return customers;
  },

  async getRegisteredCustomers(organizationId: string) {
    const customers = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.organizationId, organizationId),
          eq(customersTable.is_guest, false)
        )
      );
    return customers;
  },

  async updateCustomer(id: string, data: UpdateCustomer, organizationId: string) {
    const [updatedCustomer] = await db
      .update(customersTable)
      .set(data)
      .where(
        and(
          eq(customersTable.id, id),
          eq(customersTable.organizationId, organizationId)
        )
      )
      .returning();
    return updatedCustomer;
  },

  async deleteCustomer(id: string, organizationId: string) {
    await db
      .delete(customersTable)
      .where(
        and(
          eq(customersTable.id, id),
          eq(customersTable.organizationId, organizationId)
        )
      );
  },
};
