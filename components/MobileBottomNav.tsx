"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, User } from "lucide-react";
import { useAuth, useCart, useWishlist } from "@/app/providers";
import { CartIcon, WishlistIcon } from "@/components/commerce-icons";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();

  const items = [
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/shop", label: "Shop", icon: Store },
    { href: "/wishlist", label: "Wishlist", icon: WishlistIcon },
    { href: "/cart", label: "Cart", icon: CartIcon },
    { href: auth.user ? "/account" : "/account/login", label: "Account", icon: User },
  ];

  const counts: Record<string, number> = {
    "/wishlist": wishlist.count,
    "/cart": cart.count,
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="site-mobile-nav mobile-nav-glass fixed inset-x-3 bottom-2.5 z-50 hidden h-[calc(58px+env(safe-area-inset-bottom))] min-h-[64px] items-stretch rounded-[24px] p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] max-md:flex"
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const count = counts[item.href];
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] px-0.5 py-1 text-[9px] font-semibold leading-none transition-all duration-200 ${
              active ? "mobile-nav-active text-white" : "text-white/60 active:bg-white/8 active:text-white/85"
            }`}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={active ? 2.25 : 1.9} />
              {!!count && (
                <span className="commerce-badge absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[#111]">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
