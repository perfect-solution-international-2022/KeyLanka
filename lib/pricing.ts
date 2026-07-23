/**
 * Shared, dependency-free pricing logic — usable from both client components
 * and server route handlers so the "what does this line cost" calculation
 * never drifts between what the customer sees and what the server charges.
 */
export function getUnitPrice(
  product: { price: string | number; wholesalePrice?: string | number | null },
  quantity: number,
  wholesaleMinQty: number
): number {
  const price = Number(product.price);
  const wholesalePrice = product.wholesalePrice != null ? Number(product.wholesalePrice) : null;

  if (wholesalePrice != null && quantity >= wholesaleMinQty) {
    return wholesalePrice;
  }
  return price;
}

export function getLineTotal(
  product: { price: string | number; wholesalePrice?: string | number | null },
  quantity: number,
  wholesaleMinQty: number
): number {
  return getUnitPrice(product, quantity, wholesaleMinQty) * quantity;
}
