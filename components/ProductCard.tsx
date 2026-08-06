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

export default function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const wishlisted = wishlist.isWishlisted(product.id);

  return (
    <div className={`motion-card group overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md ${
      layout === "list" ? "grid min-h-40 grid-cols-[128px_minmax(0,1fr)] sm:grid-cols-[190px_minmax(0,1fr)]" : "flex flex-col"
    }`}>
      <div className={`relative bg-gray-50 ${layout === "list" ? "h-full min-h-40" : "aspect-square"}`}>
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
            sizes={layout === "list" ? "(max-width: 640px) 128px, 190px" : "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"}
            className={`object-contain group-hover:scale-105 transition-transform ${layout === "list" ? "p-3 sm:p-5" : "p-6"}`}
          />
        </Link>
      </div>
      <div className={`flex min-w-0 flex-col ${layout === "list" ? "gap-1.5 p-3 sm:p-5" : "flex-1 gap-1 p-3"}`}>
        {layout === "list" && (
          <div className="text-[11px] font-medium uppercase text-gray-500">
            {[product.category?.name, product.brand?.name].filter(Boolean).join(" · ")}
          </div>
        )}
        <Link href={`/product/${product.slug}`} className={`${layout === "list" ? "text-base sm:text-lg" : "text-sm"} font-semibold text-gray-900 line-clamp-2 hover:text-brand`}>
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
        {layout === "list" && product.shortDescription && (
          <p className="hidden text-sm leading-6 text-gray-500 sm:line-clamp-2">{product.shortDescription}</p>
        )}
        <button
          onClick={() => cart.addToCart(product.id, 1)}
          disabled={product.stock === 0}
          className={`mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:bg-gray-300 ${
            layout === "list" ? "w-full px-4 py-2 sm:w-fit" : "w-full py-2"
          }`}
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
