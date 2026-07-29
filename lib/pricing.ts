/**
 * Shared, dependency-free pricing logic — usable from both client components
 * and server route handlers so the "what does this line cost" calculation
 * never drifts between what the customer sees and what the server charges.
 */
type PriceSource = {
  price: string | number;
  wholesalePrice?: string | number | null;
  wholesaleMinQty: number;
};

/**
 * Resolves which price source applies to a line: the specific variant's own
 * price/wholesale fields when the item references one, otherwise the parent
 * product's — variants don't inherit wholesaleMinQty, so that always comes
 * from the product.
 */
export function resolvePriceSource(
  product: PriceSource,
  variant?: { price: string | number; wholesalePrice?: string | number | null } | null
): PriceSource {
  if (!variant) return product;
  return {
    price: variant.price,
    wholesalePrice: variant.wholesalePrice,
    wholesaleMinQty: product.wholesaleMinQty,
  };
}

export function getUnitPrice(source: PriceSource, quantity: number): number {
  const price = Number(source.price);
  const wholesalePrice = source.wholesalePrice != null ? Number(source.wholesalePrice) : null;

  if (wholesalePrice != null && quantity >= source.wholesaleMinQty) {
    return wholesalePrice;
  }
  return price;
}

export function getLineTotal(source: PriceSource, quantity: number): number {
  return getUnitPrice(source, quantity) * quantity;
}
