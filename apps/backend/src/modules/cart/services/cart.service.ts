import { cartRepo } from "../repo/cart.repo";
import { productVariantsRepo } from "../../products/repo/products.repo";
import { discountCodesService } from "../../discounts/services/discount-codes.service";
import { calculateOrderTax } from "../../orders/services/tax.service";
import { ordersService } from "../../orders/services/orders.service";
import { customersService } from "../../customers/services/customers.service";
import { addressesRepo } from "../../customers/repo/addresses.repo";
import { db } from "../../../shared/db";
import { shippingMethodsTable } from "../../../shared/db/shipping";
import { eq } from "drizzle-orm";
import type {
  CartTotals,
  CartTotalsBreakdown,
  AddItemInput,
  UpdateItemInput,
  ApplyDiscountInput,
  CalculateTotalsInput,
  CheckoutInput,
  MergeCartsInput,
} from "../cart.types";

export const cartService = {
  /**
   * Get or create cart by sessionId
   */
  async getOrCreateCart(sessionId: string, customerId?: string) {
    let cart = await cartRepo.findBySessionId(sessionId);

    if (!cart) {
      // Create new cart
      const newCart = await cartRepo.create({
        sessionId,
        customerId: customerId || null,
        status: "active",
      });

      // Fetch cart with relations
      cart = await cartRepo.findById(newCart.id);
    } else if (customerId && cart.customerId !== customerId) {
      // Update customer ID if provided and different
      await cartRepo.update(cart.id, { customerId });
      cart = await cartRepo.findById(cart.id);
    }

    return cart;
  },

  /**
   * Add item to cart
   */
  async addItem(input: AddItemInput) {
    const { sessionId, customerId, variantId, quantity } = input;

    // Get or create cart
    const cart = await this.getOrCreateCart(sessionId, customerId);
    if (!cart) {
      throw new Error("Failed to create cart");
    }

    // Validate product variant exists and has stock
    const variant = await productVariantsRepo.getProductVariantById(variantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    if (variant.quantityInStock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${variant.quantityInStock}`
      );
    }

    // Check if item already exists in cart
    const existingItem = await cartRepo.findItem(cart.id, variantId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      // Validate new quantity doesn't exceed stock
      if (variant.quantityInStock < newQuantity) {
        throw new Error(
          `Insufficient stock. Available: ${variant.quantityInStock}`
        );
      }

      await cartRepo.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      // Add new item
      await cartRepo.addItem({
        cartId: cart.id,
        productVariantId: variantId,
        quantity,
        unitPrice: variant.price,
      });
    }

    // Recalculate totals
    await this.calculateTotals({ sessionId });

    // Return updated cart
    return await cartRepo.findById(cart.id);
  },

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    sessionId: string,
    itemId: string,
    input: UpdateItemInput
  ) {
    const { quantity } = input;

    // Get cart
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Get item
    const item = await cartRepo.findItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new Error("Cart item not found");
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cartRepo.removeItem(itemId);
    } else {
      // Validate stock
      const variant = await productVariantsRepo.getProductVariantById(
        item.productVariantId
      );
      if (!variant) {
        throw new Error("Product variant not found");
      }

      if (variant.quantityInStock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${variant.quantityInStock}`
        );
      }

      await cartRepo.updateItemQuantity(itemId, quantity);
    }

    // Recalculate totals
    await this.calculateTotals({ sessionId });

    // Return updated cart
    return await cartRepo.findById(cart.id);
  },

  /**
   * Remove item from cart
   */
  async removeItem(sessionId: string, itemId: string) {
    // Get cart
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Get item
    const item = await cartRepo.findItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new Error("Cart item not found");
    }

    // Remove item
    await cartRepo.removeItem(itemId);

    // Recalculate totals
    await this.calculateTotals({ sessionId });

    // Return updated cart
    return await cartRepo.findById(cart.id);
  },

  /**
   * Clear all items from cart
   */
  async clearCart(sessionId: string) {
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Clear all items
    await cartRepo.clearItems(cart.id);

    // Reset totals and discount
    await cartRepo.update(cart.id, {
      subtotal: "0",
      discountTotal: "0",
      taxTotal: "0",
      shippingTotal: "0",
      total: "0",
      discountCodeId: null,
      lastActivityAt: new Date(),
    });

    return await cartRepo.findById(cart.id);
  },

  /**
   * Apply discount code to cart
   */
  async applyDiscountCode(input: ApplyDiscountInput) {
    const { sessionId, code } = input;

    // Get cart
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Calculate current subtotal
    const subtotal = Number(cart.subtotal);

    // Validate and calculate discount
    const discountResult = await discountCodesService.calculateCodeDiscount(
      code,
      subtotal
    );

    // Update cart with discount code
    await cartRepo.update(cart.id, {
      discountCodeId: discountResult.discountCode.id,
      discountTotal: discountResult.discountAmount.toString(),
      lastActivityAt: new Date(),
    });

    // Recalculate totals
    await this.calculateTotals({ sessionId });

    return {
      cart: await cartRepo.findById(cart.id),
      discount: discountResult.discount,
    };
  },

  /**
   * Remove discount code from cart
   */
  async removeDiscountCode(sessionId: string) {
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Remove discount
    await cartRepo.update(cart.id, {
      discountCodeId: null,
      discountTotal: "0",
      lastActivityAt: new Date(),
    });

    // Recalculate totals
    await this.calculateTotals({ sessionId });

    return await cartRepo.findById(cart.id);
  },

  /**
   * Calculate cart totals (with optional tax and shipping preview)
   */
  async calculateTotals(
    input: CalculateTotalsInput
  ): Promise<CartTotals | CartTotalsBreakdown> {
    const { sessionId, shippingAddressId, shippingMethodId } = input;

    // Get cart with items
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    // Calculate discount
    let discountTotal = 0;
    let discountBreakdown = null;

    if (cart.discountCodeId && cart.discountCode && 'code' in cart.discountCode) {
      const discountResult = await discountCodesService.calculateCodeDiscount(
        cart.discountCode.code as string,
        subtotal
      );
      discountTotal = discountResult.discountAmount;

      discountBreakdown = {
        code: cart.discountCode.code as string,
        amount: discountTotal.toFixed(2),
      };
    }

    // Calculate tax (if shipping address provided)
    let taxTotal = 0;
    let taxBreakdown = null;

    if (shippingAddressId) {
      const address = await addressesRepo.getAddressById(shippingAddressId);
      if (address) {
        const taxResult = await calculateOrderTax({
          shippingState: address.state,
          shippingCountry: address.country,
          items: cart.items.map((item) => ({
            productId: item.productVariant.product.id,
            subtotal: Number(item.unitPrice) * item.quantity,
          })),
        });

        taxTotal = taxResult.taxAmount;
        taxBreakdown = {
          jurisdiction: taxResult.taxJurisdictionName,
          rate: taxResult.taxRate.toString(),
          amount: taxTotal.toFixed(2),
        };
      }
    }

    // Calculate shipping (if method provided)
    let shippingTotal = 0;
    let shippingBreakdown = null;

    if (shippingMethodId) {
      const shippingMethod = await db.query.shippingMethodsTable.findFirst({
        where: eq(shippingMethodsTable.id, shippingMethodId),
      });

      if (shippingMethod) {
        shippingTotal = Number(shippingMethod.baseRate);
        shippingBreakdown = {
          method: shippingMethod.name,
          cost: shippingTotal.toFixed(2),
        };
      }
    }

    // Calculate total
    const total = subtotal - discountTotal + taxTotal + shippingTotal;

    // Update cart in database
    await cartRepo.update(cart.id, {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      shippingTotal: shippingTotal.toFixed(2),
      total: total.toFixed(2),
      lastActivityAt: new Date(),
    });

    // Build response
    const totals: CartTotals = {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      shippingTotal: shippingTotal.toFixed(2),
      total: total.toFixed(2),
    };

    // If preview requested, include breakdown
    if (shippingAddressId || shippingMethodId) {
      const breakdown: CartTotalsBreakdown = {
        ...totals,
        breakdown: {
          items: cart.items.map((item) => ({
            name: item.productVariant.product.name,
            quantity: item.quantity,
            lineTotal: (Number(item.unitPrice) * item.quantity).toFixed(2),
          })),
          discount: discountBreakdown,
          tax: taxBreakdown,
          shipping: shippingBreakdown,
        },
      };

      return breakdown;
    }

    return totals;
  },

  /**
   * Checkout - convert cart to order
   */
  async checkout(input: CheckoutInput) {
    const {
      sessionId,
      customerId,
      customerEmail,
      shippingAddressId,
      billingAddressId,
      shippingMethodId,
      notes,
      visitId,
    } = input;

    // Get cart with items
    const cart = await cartRepo.findBySessionId(sessionId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (!cart.items || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Determine customer ID
    let finalCustomerId = customerId;

    // If no customerId but email provided, create customer
    if (!finalCustomerId && customerEmail) {
      const newCustomer = await customersService.create({
        email: customerEmail,
        first_name: "",
        last_name: "",
        phone_number: "",
        is_guest: true,
      });
      finalCustomerId = newCustomer.id;
    }

    if (!finalCustomerId) {
      throw new Error("Customer ID or email is required");
    }

    // Calculate final totals
    await this.calculateTotals({
      sessionId,
      shippingAddressId,
      shippingMethodId,
    });

    // Refresh cart to get updated totals
    const updatedCart = await cartRepo.findBySessionId(sessionId);
    if (!updatedCart) {
      throw new Error("Cart not found after totals calculation");
    }

    // Prepare order items
    const orderItems = updatedCart.items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
    }));

    // Create order using existing orders service
    const order = await ordersService.create({
      customerId: finalCustomerId,
      shippingAddressId,
      billingAddressId,
      items: orderItems,
      shippingMethodId,
      discountCode: updatedCart.discountCode && 'code' in updatedCart.discountCode
        ? (updatedCart.discountCode.code as string)
        : undefined,
      sessionId: visitId || undefined, // For campaign attribution
      notes: notes || undefined,
    });

    // Mark cart as converted
    await cartRepo.update(updatedCart.id, {
      status: "converted",
      lastActivityAt: new Date(),
    });

    return order;
  },

  /**
   * Merge guest cart into user cart (optional feature)
   */
  async mergeGuestCart(input: MergeCartsInput) {
    const { fromSessionId, toSessionId, customerId } = input;

    // Get guest cart
    const guestCart = await cartRepo.findBySessionId(fromSessionId);

    if (!guestCart || guestCart.items.length === 0) {
      // No guest cart or empty, just return/create user cart
      return await this.getOrCreateCart(toSessionId, customerId);
    }

    // Get or create user cart
    await this.getOrCreateCart(toSessionId, customerId);

    // Transfer items from guest cart to user cart
    for (const item of guestCart.items) {
      await this.addItem({
        sessionId: toSessionId,
        customerId,
        variantId: item.productVariantId,
        quantity: item.quantity,
      });
    }

    // Mark guest cart as merged
    await cartRepo.update(guestCart.id, {
      status: "merged",
      lastActivityAt: new Date(),
    });

    // Return user cart
    return await cartRepo.findBySessionId(toSessionId);
  },

  /**
   * Mark expired carts as abandoned (run as scheduled job)
   */
  async markExpiredCartsAsAbandoned(): Promise<number> {
    const expiredCarts = await cartRepo.findExpiredCarts();
    const cartIds = expiredCarts.map((cart) => cart.id);

    if (cartIds.length > 0) {
      await cartRepo.markCartsAsAbandoned(cartIds);
    }

    return cartIds.length;
  },

  /**
   * Get abandoned carts (for admin)
   */
  async getAbandonedCarts(hoursAgo: number = 24, minValue?: number) {
    return await cartRepo.findAbandonedCarts(hoursAgo, minValue);
  },

  /**
   * Get active carts (for admin)
   */
  async getActiveCarts() {
    return await cartRepo.findActiveCarts();
  },

  /**
   * Get cart metrics (for admin dashboard)
   */
  async getCartMetrics() {
    return await cartRepo.getCartMetrics();
  },
};
