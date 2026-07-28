"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { getUnitPrice } from "@/lib/pricing";
import { useCart, useWishlist } from "@/app/providers";

export default function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [busyAction, setBusyAction] = useState<"cart" | "buy" | null>(null);
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const wishlisted = wishlist.isWishlisted(product.id);
  const rating = Math.round(Number(product.rating));
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] ?? "/products/placeholder-1.svg");

  const hasWholesale = product.wholesalePrice != null;
  const unitPrice = getUnitPrice(product, qty);
  const isWholesaleActive = hasWholesale && qty >= product.wholesaleMinQty;
  const unavailable = product.stock === 0 && !product.allowBackorder;

  async function handleAddToCart() {
    setBusyAction("cart");
    try {
      await cart.addToCart(product.id, qty);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this product to the cart");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBuyNow() {
    setBusyAction("buy");
    try {
      await cart.addToCart(product.id, qty);
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
            src={selectedImage}
            alt={product.imageAlt || product.name}
            fill
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
                <Image src={image} alt="" fill className="object-contain p-1.5" />
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
            Buy {product.wholesaleMinQty}+ units for {formatCurrency(product.wholesalePrice!)} each
            {isWholesaleActive ? " — applied to your order below" : ""}
          </p>
        )}

        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{product.description}</p>

        <dl className="grid grid-cols-2 gap-2 text-sm mt-4 text-gray-600">
          <dt className="text-gray-400">SKU</dt>
          <dd>{product.sku}</dd>
          <dt className="text-gray-400">Category</dt>
          <dd>{product.category?.name}</dd>
          <dt className="text-gray-400">Availability</dt>
          <dd className={product.stock > 0 || product.allowBackorder ? "text-green-600" : "text-red-600"}>
            {product.stock > 0 ? `In Stock (${product.stock})` : product.allowBackorder ? "Available on backorder" : "Out of Stock"}
          </dd>
        </dl>

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
              className={`h-11 w-11 rounded-md border flex items-center justify-center ${
                wishlisted ? "border-brand text-brand" : "border-gray-300 text-gray-500"
              }`}
              aria-label="Toggle wishlist"
            >
              ♥
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable || busyAction !== null}
              className="border border-brand text-brand hover:bg-brand-light disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 font-medium py-3 rounded-md"
            >
              {busyAction === "cart" ? "Adding..." : "Add to Cart"}
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
