import { eq, and, lt, sql, desc } from "drizzle-orm";
import { db } from "../../../shared/db";
import { cartsTable, cartItemsTable } from "../../../shared/db/cart";
import { NewCart, NewCartItem, UpdateCart } from "../cart.types";

export const cartRepo = {
  // Cart operations
  async findBySessionId(sessionId: string) {
    return await db.query.cartsTable.findFirst({
      where: eq(cartsTable.sessionId, sessionId),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
          },
        },
        customer: true,
        discountCode: {
          with: {
            discount: true,
          },
        },
      },
    });
  },

  async findById(cartId: string) {
    return await db.query.cartsTable.findFirst({
      where: eq(cartsTable.id, cartId),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
          },
        },
        customer: true,
        discountCode: {
          with: {
            discount: true,
          },
        },
      },
    });
  },

  async create(data: NewCart) {
    const [cart] = await db.insert(cartsTable).values(data).returning();
    return cart;
  },

  async update(cartId: string, data: UpdateCart) {
    const [cart] = await db
      .update(cartsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cartsTable.id, cartId))
      .returning();
    return cart;
  },

  async delete(cartId: string) {
    await db.delete(cartsTable).where(eq(cartsTable.id, cartId));
  },

  // Cart item operations
  async findItem(cartId: string, variantId: string) {
    return await db.query.cartItemsTable.findFirst({
      where: and(
        eq(cartItemsTable.cartId, cartId),
        eq(cartItemsTable.productVariantId, variantId)
      ),
    });
  },

  async findItemById(itemId: string) {
    return await db.query.cartItemsTable.findFirst({
      where: eq(cartItemsTable.id, itemId),
    });
  },

  async addItem(data: NewCartItem) {
    const [item] = await db.insert(cartItemsTable).values(data).returning();
    return item;
  },

  async updateItemQuantity(itemId: string, quantity: number) {
    const [item] = await db
      .update(cartItemsTable)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItemsTable.id, itemId))
      .returning();
    return item;
  },

  async removeItem(itemId: string) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  },

  async clearItems(cartId: string) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cartId));
  },

  async getCartItems(cartId: string) {
    return await db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.cartId, cartId),
      with: {
        productVariant: {
          with: {
            product: true,
          },
        },
      },
    });
  },

  // Query operations for admin
  async findExpiredCarts() {
    return await db.query.cartsTable.findMany({
      where: and(
        eq(cartsTable.status, 'active'),
        lt(cartsTable.expiresAt, new Date())
      ),
    });
  },

  async findAbandonedCarts(hoursAgo: number, minValue?: number) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);

    const conditions = [
      eq(cartsTable.status, 'abandoned'),
      lt(cartsTable.lastActivityAt, cutoffTime),
    ];

    if (minValue !== undefined) {
      conditions.push(
        sql`CAST(${cartsTable.total} AS DECIMAL) >= ${minValue}`
      );
    }

    return await db.query.cartsTable.findMany({
      where: and(...conditions),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: [desc(cartsTable.total)],
    });
  },

  async findActiveCarts() {
    return await db.query.cartsTable.findMany({
      where: eq(cartsTable.status, 'active'),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: [desc(cartsTable.lastActivityAt)],
    });
  },

  async getCartCount(status?: 'active' | 'abandoned' | 'converted' | 'merged') {
    const condition = status ? eq(cartsTable.status, status) : undefined;

    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(cartsTable)
      .where(condition);

    return result[0]?.count || 0;
  },

  async getAverageCartValue() {
    const result = await db
      .select({
        avgValue: sql<string>`COALESCE(AVG(CAST(${cartsTable.total} AS DECIMAL)), 0)`,
      })
      .from(cartsTable)
      .where(eq(cartsTable.status, 'active'));

    return result[0]?.avgValue || '0';
  },

  async markCartsAsAbandoned(cartIds: string[]) {
    if (cartIds.length === 0) return 0;

    await db
      .update(cartsTable)
      .set({ status: 'abandoned', updatedAt: new Date() })
      .where(sql`${cartsTable.id} = ANY(${cartIds})`);

    return cartIds.length;
  },

  async getCartMetrics() {
    const [activeCount, abandonedCount, avgValue] = await Promise.all([
      this.getCartCount('active'),
      this.getCartCount('abandoned'),
      this.getAverageCartValue(),
    ]);

    return {
      activeCount,
      abandonedCount,
      avgValue,
    };
  },
};
