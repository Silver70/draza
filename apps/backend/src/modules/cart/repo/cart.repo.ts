import { eq, and, lt, sql, desc } from "drizzle-orm";
import { db } from "../../../shared/db";
import { cartsTable, cartItemsTable } from "../../../shared/db/cart";
import { NewCart, NewCartItem, UpdateCart } from "../cart.types";

export const cartRepo = {
  // Cart operations
  async findBySessionId(organizationId: string, sessionId: string) {
    return await db.query.cartsTable.findFirst({
      where: and(
        eq(cartsTable.sessionId, sessionId),
        eq(cartsTable.organizationId, organizationId)
      ),
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

  async findById(organizationId: string, cartId: string) {
    return await db.query.cartsTable.findFirst({
      where: and(
        eq(cartsTable.id, cartId),
        eq(cartsTable.organizationId, organizationId)
      ),
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

  async update(organizationId: string, cartId: string, data: UpdateCart) {
    const [cart] = await db
      .update(cartsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(cartsTable.id, cartId),
        eq(cartsTable.organizationId, organizationId)
      ))
      .returning();
    return cart;
  },

  async delete(organizationId: string, cartId: string) {
    await db.delete(cartsTable).where(and(
      eq(cartsTable.id, cartId),
      eq(cartsTable.organizationId, organizationId)
    ));
  },

  // Cart item operations
  async findItem(organizationId: string, cartId: string, variantId: string) {
    return await db.query.cartItemsTable.findFirst({
      where: and(
        eq(cartItemsTable.cartId, cartId),
        eq(cartItemsTable.productVariantId, variantId),
        eq(cartItemsTable.organizationId, organizationId)
      ),
    });
  },

  async findItemById(organizationId: string, itemId: string) {
    return await db.query.cartItemsTable.findFirst({
      where: and(
        eq(cartItemsTable.id, itemId),
        eq(cartItemsTable.organizationId, organizationId)
      ),
    });
  },

  async addItem(data: NewCartItem) {
    const [item] = await db.insert(cartItemsTable).values(data).returning();
    return item;
  },

  async updateItemQuantity(organizationId: string, itemId: string, quantity: number) {
    const [item] = await db
      .update(cartItemsTable)
      .set({ quantity, updatedAt: new Date() })
      .where(and(
        eq(cartItemsTable.id, itemId),
        eq(cartItemsTable.organizationId, organizationId)
      ))
      .returning();
    return item;
  },

  async removeItem(organizationId: string, itemId: string) {
    await db.delete(cartItemsTable).where(and(
      eq(cartItemsTable.id, itemId),
      eq(cartItemsTable.organizationId, organizationId)
    ));
  },

  async clearItems(organizationId: string, cartId: string) {
    await db.delete(cartItemsTable).where(and(
      eq(cartItemsTable.cartId, cartId),
      eq(cartItemsTable.organizationId, organizationId)
    ));
  },

  async getCartItems(organizationId: string, cartId: string) {
    return await db.query.cartItemsTable.findMany({
      where: and(
        eq(cartItemsTable.cartId, cartId),
        eq(cartItemsTable.organizationId, organizationId)
      ),
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
  async findExpiredCarts(organizationId: string) {
    return await db.query.cartsTable.findMany({
      where: and(
        eq(cartsTable.status, 'active'),
        lt(cartsTable.expiresAt, new Date()),
        eq(cartsTable.organizationId, organizationId)
      ),
    });
  },

  async findAbandonedCarts(organizationId: string, hoursAgo: number, minValue?: number) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);

    const conditions = [
      eq(cartsTable.status, 'abandoned'),
      lt(cartsTable.lastActivityAt, cutoffTime),
      eq(cartsTable.organizationId, organizationId),
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

  async findActiveCarts(organizationId: string) {
    return await db.query.cartsTable.findMany({
      where: and(
        eq(cartsTable.status, 'active'),
        eq(cartsTable.organizationId, organizationId)
      ),
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

  async getCartCount(organizationId: string, status?: 'active' | 'abandoned' | 'converted' | 'merged') {
    const conditions = [eq(cartsTable.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(cartsTable.status, status));
    }

    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(cartsTable)
      .where(and(...conditions));

    return result[0]?.count || 0;
  },

  async getAverageCartValue(organizationId: string) {
    const result = await db
      .select({
        avgValue: sql<string>`COALESCE(AVG(CAST(${cartsTable.total} AS DECIMAL)), 0)`,
      })
      .from(cartsTable)
      .where(and(
        eq(cartsTable.status, 'active'),
        eq(cartsTable.organizationId, organizationId)
      ));

    return result[0]?.avgValue || '0';
  },

  async markCartsAsAbandoned(organizationId: string, cartIds: string[]) {
    if (cartIds.length === 0) return 0;

    await db
      .update(cartsTable)
      .set({ status: 'abandoned', updatedAt: new Date() })
      .where(and(
        sql`${cartsTable.id} = ANY(${cartIds})`,
        eq(cartsTable.organizationId, organizationId)
      ));

    return cartIds.length;
  },

  async getCartMetrics(organizationId: string) {
    const [activeCount, abandonedCount, avgValue] = await Promise.all([
      this.getCartCount(organizationId, 'active'),
      this.getCartCount(organizationId, 'abandoned'),
      this.getAverageCartValue(organizationId),
    ]);

    return {
      activeCount,
      abandonedCount,
      avgValue,
    };
  },
};
