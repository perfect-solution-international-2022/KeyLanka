"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { getUnitPrice } from "@/lib/pricing";
import { useCart, useWishlist } from "@/app/providers";

export default function ProductDetail({ product, wholesaleMinQty }: { product: Product; wholesaleMinQty: number }) {
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const wishlist = useWishlist();
  const wishlisted = wishlist.isWishlisted(product.id);
  const rating = Math.round(Number(product.rating));

  const hasWholesale = product.wholesalePrice != null;
  const unitPrice = getUnitPrice(product, qty, wholesaleMinQty);
  const isWholesaleActive = hasWholesale && qty >= wholesaleMinQty;

  return (
    <div className="container-page py-10 grid md:grid-cols-2 gap-10">
      <div className="bg-gray-50 rounded-lg border border-gray-200 aspect-square relative flex items-center justify-center">
        {product.badge && (
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded ${
              product.badge === "HOT" ? "bg-brand text-white" : "bg-green-600 text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
        <Image
          src={product.images?.[0] ?? "/products/placeholder-1.svg"}
          alt={product.name}
          fill
          className="object-contain p-12"
        />
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
            Buy {wholesaleMinQty}+ units for {formatCurrency(product.wholesalePrice!)} each
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
          <dd className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
            {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
          </dd>
        </dl>

        <div className="flex items-center gap-3 mt-6">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600">
              -
            </button>
            <span className="px-4 text-sm">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-gray-600">
              +
            </button>
          </div>
          <button
            onClick={() => cart.addToCart(product.id, qty)}
            disabled={product.stock === 0}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-medium py-3 rounded-md"
          >
            Add to Cart — {formatCurrency(unitPrice * qty)}
          </button>
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
      </div>
    </div>
  );
}
