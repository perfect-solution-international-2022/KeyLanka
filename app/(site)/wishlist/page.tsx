"use client";

import Link from "next/link";
import { useWishlist, useCart } from "@/app/providers";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const wishlist = useWishlist();
  useCart();

  if (wishlist.loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading wishlist...</div>;
  }

  if (wishlist.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-6">Save products you love for later.</p>
        <Link href="/shop" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlist.items.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
