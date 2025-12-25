/**
 * Calculate order totals from items
 */
export const calculateOrderTotals = (
  items: Array<{ quantity: number; unitPrice: string }>,
  taxRate: number = 0,
  shippingCost: string = "0"
) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * parseFloat(item.unitPrice);
  }, 0);

  const tax = subtotal * taxRate;
  const shipping = parseFloat(shippingCost);
  const total = subtotal + tax + shipping;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    shippingCost: shipping.toFixed(2),
    total: total.toFixed(2),
  };
};


/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXX (e.g., ORD-20241224-00001)
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, "0");

  return `ORD-${year}${month}${day}-${random}`;
};