/**
 * Generates a URL-friendly slug from a given string
 * @param text - The text to convert to a slug
 * @returns A normalized slug string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};


/**
 * Generates a SKU from product slug and attribute values
 * @param productSlug - The product slug
 * @param attributeValues - Array of attribute values to include in SKU
 * @returns A generated SKU string
 */
export const generateSKU = (productSlug: string, attributeValues: string[]): string => {
  const baseSlug = productSlug.replace(/-/g, "").toUpperCase().substring(0, 4);

  const attributePart = attributeValues
    .map((value) => value.replace(/\s+/g, "").toUpperCase().substring(0, 3))
    .join("-");

  return `${baseSlug}-${attributePart}`;
};

/**
 * Generates a unique SKU with a timestamp suffix for guaranteed uniqueness
 * @param productSlug - The product slug
 * @param attributeValues - Array of attribute values to include in SKU
 * @returns A unique SKU string
 */
export const generateUniqueSKU = (productSlug: string, attributeValues: string[]): string => {
  const baseSKU = generateSKU(productSlug, attributeValues);
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSKU}-${timestamp}`;
};
