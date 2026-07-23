"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/providers";
import { formatCurrency } from "@/lib/api";
import { getUnitPrice, getLineTotal } from "@/lib/pricing";

export default function CartPage() {
  const cart = useCart();

  if (cart.loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading cart...</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        <div className="space-y-4">
          {cart.items.map((item) => {
            const unitPrice = getUnitPrice(item.product, item.quantity, cart.wholesaleMinQty);
            const isWholesale = item.product.wholesalePrice != null && item.quantity >= cart.wholesaleMinQty;
            return (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-20 w-20 bg-gray-50 rounded shrink-0">
                    <Image
                      src={item.product.images?.[0] ?? "/products/placeholder-1.svg"}
                      alt={item.product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`} className="font-medium text-gray-900 hover:text-brand line-clamp-1">
                      {item.product.name}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      {formatCurrency(unitPrice)}
                      {isWholesale && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                          WHOLESALE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:ml-auto">
                  <div className="flex items-center border border-gray-300 rounded-md shrink-0">
                    <button
                      onClick={() => cart.updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-2.5 py-1.5 text-gray-600"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5 text-gray-600">
                      +
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold text-gray-900 shrink-0">
                    {formatCurrency(getLineTotal(item.product, item.quantity, cart.wholesaleMinQty))}
                  </div>
                  <button onClick={() => cart.removeItem(item.id)} className="text-gray-400 hover:text-brand text-sm shrink-0">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="border border-gray-200 rounded-lg p-5 h-fit">
        <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-3 mb-4">
          <span>Total</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
        <Link href="/checkout" className="block text-center bg-brand hover:bg-brand-dark text-white font-medium py-3 rounded-md">
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
