"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { useCart, useWishlist } from "@/app/providers";

function Stars({ rating }: { rating: string }) {
  const r = Math.round(Number(rating));
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(r)}
      <span className="text-gray-300">{"★".repeat(5 - r)}</span>
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const wishlisted = wishlist.isWishlisted(product.id);

  return (
    <div className="group border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col">
      <div className="relative bg-gray-50 aspect-square">
        {product.badge && (
          <span
            className={`absolute top-2 left-2 z-10 text-[11px] font-semibold px-2 py-0.5 rounded ${
              product.badge === "HOT" ? "bg-brand text-white" : "bg-green-600 text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
        <button
          onClick={() => wishlist.toggleWishlist(product.id)}
          aria-label="Toggle wishlist"
          className={`absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center text-sm ${
            wishlisted ? "text-brand" : "text-gray-400"
          }`}
        >
          ♥
        </button>
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images?.[0] ?? "/products/placeholder-1.svg"}
            alt={product.name}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform"
          />
        </Link>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-brand">
          {product.name}
        </Link>
        <div className="flex items-center gap-1">
          <Stars rating={product.rating} />
          <span className="text-[11px] text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
          )}
        </div>
        {product.wholesalePrice && (
          <span className="text-[11px] text-brand font-medium">
            Wholesale from {formatCurrency(product.wholesalePrice)}
          </span>
        )}
        <button
          onClick={() => cart.addToCart(product.id, 1)}
          disabled={product.stock === 0}
          className="mt-auto pt-2 w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white text-sm font-medium py-2 rounded-md transition-colors"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
