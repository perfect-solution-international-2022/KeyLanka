"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { getUnitPrice, resolvePriceSource } from "@/lib/pricing";
import { useCart, useWishlist } from "@/app/providers";
import { CartIcon, WishlistIcon } from "@/components/commerce-icons";

export default function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [busyAction, setBusyAction] = useState<"cart" | "buy" | null>(null);
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const wishlisted = wishlist.isWishlisted(product.id);
  const rating = Math.round(Number(product.rating));

  const isVariable = product.productType === "Variable Product" && (product.variants?.length ?? 0) > 0;

  const attributeGroups = useMemo(() => {
    if (!isVariable) return [];
    const groups = new Map<number, { name: string; values: Map<number, string> }>();
    for (const variant of product.variants ?? []) {
      for (const vv of variant.values) {
        const av = vv.attributeValue;
        if (!av) continue;
        if (!groups.has(av.attributeId)) groups.set(av.attributeId, { name: av.attribute?.name ?? "", values: new Map() });
        groups.get(av.attributeId)!.values.set(av.id, av.value);
      }
    }
    return Array.from(groups.entries()).map(([attributeId, g]) => ({
      attributeId,
      name: g.name,
      values: Array.from(g.values.entries()).map(([id, value]) => ({ id, value })),
    }));
  }, [isVariable, product.variants]);

  const [selectedValues, setSelectedValues] = useState<Record<number, number>>(() => {
    const defaultVariant = product.variants?.find((v) => v.isDefault) ?? product.variants?.[0];
    const initial: Record<number, number> = {};
    for (const vv of defaultVariant?.values ?? []) {
      if (vv.attributeValue) initial[vv.attributeValue.attributeId] = vv.attributeValue.id;
    }
    return initial;
  });

  const selectedVariant = useMemo(() => {
    if (!isVariable) return null;
    const selectedIds = new Set(Object.values(selectedValues));
    return (
      (product.variants ?? []).find((variant) => {
        const variantValueIds = variant.values.map((v) => v.attributeValueId);
        return variantValueIds.length === selectedIds.size && variantValueIds.every((id) => selectedIds.has(id));
      }) ?? null
    );
  }, [isVariable, product.variants, selectedValues]);

  const [selectedImage, setSelectedImage] = useState(product.images?.[0] ?? "/products/placeholder-1.svg");
  const activeImage = selectedVariant?.image || selectedImage;

  const priceSource = resolvePriceSource(product, selectedVariant);
  const hasWholesale = priceSource.wholesalePrice != null;
  const unitPrice = getUnitPrice(priceSource, qty);
  const isWholesaleActive = hasWholesale && qty >= product.wholesaleMinQty;
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;
  const displaySku = selectedVariant?.sku ?? product.sku;
  const outOfStockStatus = selectedVariant ? selectedVariant.stockStatus === "out_of_stock" : product.stock === 0;
  const unavailable = (isVariable && !selectedVariant) || (outOfStockStatus && displayStock === 0 && !product.allowBackorder);

  function selectAttributeValue(attributeId: number, valueId: number) {
    setSelectedValues((prev) => ({ ...prev, [attributeId]: valueId }));
  }

  async function handleAddToCart() {
    if (isVariable && !selectedVariant) {
      toast.error("Please select all options first");
      return;
    }
    setBusyAction("cart");
    try {
      await cart.addToCart(product.id, qty, selectedVariant?.id);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this product to the cart");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBuyNow() {
    if (isVariable && !selectedVariant) {
      toast.error("Please select all options first");
      return;
    }
    setBusyAction("buy");
    try {
      await cart.addToCart(product.id, qty, selectedVariant?.id);
      router.push("/checkout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
      setBusyAction(null);
    }
  }

  return (
    <div className="container-page py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 aspect-square relative flex items-center justify-center">
          {product.badge && (
            <span
              className={`absolute z-10 top-3 left-3 text-xs font-semibold px-2 py-1 rounded ${
                product.badge === "HOT" ? "bg-brand text-white" : "bg-green-600 text-white"
              }`}
            >
              {product.badge}
            </span>
          )}
          <Image
            src={activeImage}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-12"
          />
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {product.images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                aria-label={`View product image ${index + 1}`}
                className={`relative aspect-square overflow-hidden rounded-md border bg-gray-50 ${
                  selectedImage === image ? "border-brand ring-2 ring-brand/15" : "border-gray-200"
                }`}
              >
                <Image src={image} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <span className="text-amber-400">{"★".repeat(rating)}<span className="text-gray-300">{"★".repeat(5 - rating)}</span></span>
          <span className="text-gray-400">({product.reviewCount} reviews)</span>
          {product.brand && <span className="text-gray-400">· Brand: {product.brand.name}</span>}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-3xl font-bold text-gray-900">{formatCurrency(unitPrice)}</span>
          {product.compareAtPrice && !isWholesaleActive && (
            <span className="text-lg text-gray-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
          )}
          {isWholesaleActive && (
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
              WHOLESALE PRICE
            </span>
          )}
        </div>

        {hasWholesale && (
          <p className="text-sm text-brand mt-1.5">
            Buy {product.wholesaleMinQty}+ units for {formatCurrency(priceSource.wholesalePrice!)} each
            {isWholesaleActive ? " — applied to your order below" : ""}
          </p>
        )}

        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{product.description}</p>

        <dl className="grid grid-cols-2 gap-2 text-sm mt-4 text-gray-600">
          <dt className="text-gray-400">SKU</dt>
          <dd>{displaySku}</dd>
          <dt className="text-gray-400">Category</dt>
          <dd>{product.category?.name}</dd>
          <dt className="text-gray-400">Availability</dt>
          <dd className={displayStock > 0 || product.allowBackorder ? "text-green-600" : "text-red-600"}>
            {displayStock > 0 ? `In Stock (${displayStock})` : product.allowBackorder ? "Available on backorder" : "Out of Stock"}
          </dd>
        </dl>

        {isVariable && attributeGroups.length > 0 && (
          <div className="mt-5 space-y-4">
            {attributeGroups.map((group) => (
              <div key={group.attributeId}>
                <p className="text-sm font-medium text-gray-900 mb-2">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => selectAttributeValue(group.attributeId, value.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        selectedValues[group.attributeId] === value.id
                          ? "border-brand bg-brand-light text-brand"
                          : "border-gray-300 text-gray-700 hover:border-brand/50"
                      }`}
                    >
                      {value.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!selectedVariant && (
              <p className="text-xs text-red-600">Select all options to see price and availability.</p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            {!product.soldIndividually ? (
              <div className="flex items-center border border-gray-300 rounded-md">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600">
                  -
                </button>
                <span className="px-4 text-sm">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-gray-600">
                  +
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Limited to one per order</span>
            )}
            <button
              onClick={() => wishlist.toggleWishlist(product.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 ${
                wishlisted
                  ? "border-brand/25 bg-brand-light text-brand"
                  : "border-gray-300 bg-white text-gray-500 hover:border-brand/40 hover:text-brand"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
            >
              <WishlistIcon size={20} active={wishlisted} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable || busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-brand py-3 font-medium text-brand hover:bg-brand-light disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {busyAction === "cart" ? "Adding..." : <><CartIcon size={18} /> Add to Cart</>}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={unavailable || busyAction !== null}
              className="bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-medium py-3 rounded-md"
            >
              {busyAction === "buy" ? "Opening Checkout..." : `Buy Now — ${formatCurrency(unitPrice * qty)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
