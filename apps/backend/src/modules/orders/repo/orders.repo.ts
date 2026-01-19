import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../shared/db";
import { ordersTable, orderItemsTable } from "../../../shared/db/order";
import { NewOrder, UpdateOrder, NewOrderItem } from "../orders.types";

export const ordersRepo = {
  async createOrder(
    orderData: NewOrder,
    items: Omit<NewOrderItem, "orderId" | "id" | "createdAt">[]
  ) {
    return await db.transaction(async (tx) => {
      // Create the order (organizationId is already in orderData)
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

  async getOrderById(id: string, organizationId: string) {
    const order = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return order[0];
  },

  async getOrderByOrderNumber(orderNumber: string, organizationId: string) {
    const order = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.orderNumber, orderNumber),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return order[0];
  },

  async getOrderWithItems(id: string, organizationId: string) {
    const order = await db.query.ordersTable.findFirst({
      where: and(
        eq(ordersTable.id, id),
        eq(ordersTable.organizationId, organizationId)
      ),
      with: {
        items: true,
      },
    });
    return order;
  },

  async getOrderWithRelations(id: string, organizationId: string) {
    const order = await db.query.ordersTable.findFirst({
      where: and(
        eq(ordersTable.id, id),
        eq(ordersTable.organizationId, organizationId)
      ),
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

  async getOrdersByCustomerId(customerId: string, organizationId: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.customerId, customerId),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async getOrdersByStatus(status: string, organizationId: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.status, status as any),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async getAllOrders(organizationId: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.organizationId, organizationId))
      .orderBy(desc(ordersTable.createdAt));
    return orders;
  },

  async updateOrder(id: string, data: UpdateOrder, organizationId: string) {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set(data)
      .where(
        and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .returning();
    return updatedOrder;
  },

  async updateOrderStatus(id: string, status: string, organizationId: string) {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set({ status: status as any })
      .where(
        and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, organizationId)
        )
      )
      .returning();
    return updatedOrder;
  },

  async deleteOrder(id: string, organizationId: string) {
    await db
      .delete(ordersTable)
      .where(
        and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, organizationId)
        )
      );
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
