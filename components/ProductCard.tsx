"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/api";
import { useCart, useWishlist } from "@/app/providers";
import { CartIcon, WishlistIcon } from "@/components/commerce-icons";

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
    <div className="motion-card group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-lg">
      <div className="relative bg-gray-50 aspect-square">
        {product.badge && (
          <span
            className={`absolute top-2 left-2 z-10 text-[11px] font-semibold px-2 py-0.5 rounded ${
              product.badge === "HOT" ? "bg-brand text-white" : "bg-green-800 text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
        <button
          onClick={() => wishlist.toggleWishlist(product.id)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className={`absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:scale-105 ${
            wishlisted
              ? "border-brand/20 bg-brand-light text-brand"
              : "border-gray-200 bg-white/95 text-gray-500 hover:border-brand/30 hover:text-brand"
          }`}
        >
          <WishlistIcon size={18} active={wishlisted} className="transition-transform duration-200" />
        </button>
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images?.[0] ?? "/products/placeholder-1.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
          <span className="text-[11px] text-gray-600">({product.reviewCount})</span>
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
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2 pt-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:bg-gray-300"
        >
          {product.stock === 0 ? (
            "Out of Stock"
          ) : (
            <><CartIcon size={17} /> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
}
