import { eq, or, ilike } from "drizzle-orm";
import { db } from "../../../shared/db";
import { customersTable } from "../../../shared/db/customer";
import { NewCustomer, UpdateCustomer } from "../customers.types";

export const customersRepo = {
  async createCustomer(data: NewCustomer) {
    const [newCustomer] = await db
      .insert(customersTable)
      .values(data)
      .returning();
    return newCustomer;
  },

  async getCustomerById(id: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .limit(1);
    return customer[0];
  },

  async getCustomerByEmail(email: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, email))
      .limit(1);
    return customer[0];
  },

  async getCustomerByPhone(phoneNumber: string) {
    const customer = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone_number, phoneNumber))
      .limit(1);
    return customer[0];
  },

  async getAllCustomers() {
    const customers = await db
      .select()
      .from(customersTable);
    return customers;
  },

  async searchCustomers(searchTerm: string) {
    const customers = await db
      .select()
      .from(customersTable)
      .where(
        or(
          ilike(customersTable.first_name, `%${searchTerm}%`),
          ilike(customersTable.last_name, `%${searchTerm}%`),
          ilike(customersTable.email, `%${searchTerm}%`),
          ilike(customersTable.phone_number, `%${searchTerm}%`)
        )
      );
    return customers;
  },

  async getGuestCustomers() {
    const customers = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.is_guest, true));
    return customers;
  },

  async getRegisteredCustomers() {
    const customers = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.is_guest, false));
    return customers;
  },

  async updateCustomer(id: string, data: UpdateCustomer) {
    const [updatedCustomer] = await db
      .update(customersTable)
      .set(data)
      .where(eq(customersTable.id, id))
      .returning();
    return updatedCustomer;
  },

  async deleteCustomer(id: string) {
    await db
      .delete(customersTable)
      .where(eq(customersTable.id, id));
  },
};
