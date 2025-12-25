import { eq, desc } from "drizzle-orm";
import { db } from "../../../shared/db";
import { ordersTable, orderItemsTable } from "../../../shared/db/order";
import { NewOrder, UpdateOrder, NewOrderItem } from "../orders.types";

export const ordersRepo = {
  async createOrder(
    orderData: NewOrder,
    items: Omit<NewOrderItem, "orderId" | "id" | "createdAt">[]
  ) {
    return await db.transaction(async (tx) => {
      // Create the order
      const [newOrder] = await tx
        .insert(ordersTable)
        .values(orderData)
        .returning();

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        orderId: newOrder.id,
      }));

      const createdItems = await tx
        .insert(orderItemsTable)
        .values(orderItems)
        .returning();

      return {
        ...newOrder,
        items: createdItems,
      };
    });
  },

  async getOrderById(id: string) {
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);
    return order[0];
  },

  async getOrderByOrderNumber(orderNumber: string) {
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);
    return order[0];
  },

  async getOrderWithItems(id: string) {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, id),
      with: {
        items: true,
      },
    });
    return order;
  },

  async getOrderWithRelations(id: string) {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, id),
      with: {
        customer: true,
        shippingAddress: true,
        billingAddress: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });
    return order;
  },

  async getOrdersByCustomerId(customerId: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, customerId))
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async getOrdersByStatus(status: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.status, status as any))
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async getAllOrders() {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async updateOrder(id: string, data: UpdateOrder) {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set(data)
      .where(eq(ordersTable.id, id))
      .returning();
    return updatedOrder;
  },

  async updateOrderStatus(id: string, status: string) {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set({ status: status as any })
      .where(eq(ordersTable.id, id))
      .returning();
    return updatedOrder;
  },

  async deleteOrder(id: string) {
    await db
      .delete(ordersTable)
      .where(eq(ordersTable.id, id));
  },
};

export const orderItemsRepo = {
  async getOrderItemsByOrderId(orderId: string) {
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
    return items;
  },

  async getOrderItemById(id: string) {
    const item = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, id))
      .limit(1);
    return item[0];
  },
};
