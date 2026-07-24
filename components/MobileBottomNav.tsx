"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingBag, User } from "lucide-react";
import { useAuth, useCart, useWishlist } from "@/app/providers";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();

  const items = [
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/wishlist", label: "Wish List", icon: Heart },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: auth.user ? "/account" : "/account/login", label: "Account", icon: User },
  ];

  const counts: Record<string, number> = {
    "/wishlist": wishlist.count,
    "/cart": cart.count,
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const count = counts[item.href];
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
              active ? "text-brand" : "text-gray-500"
            }`}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
              {!!count && (
                <span className="absolute -top-1.5 -right-2 bg-brand text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
