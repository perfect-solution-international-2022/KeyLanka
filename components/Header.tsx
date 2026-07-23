"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/api";
import { useAuth, useCart, useWishlist } from "@/app/providers";
import CategoryMegaMenu from "./CategoryMegaMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/brands", label: "Brands" },
  { href: "/services", label: "Services" },
];

const INFO_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/why-choose-us", label: "Why Choose Us" },
  { href: "/support", label: "Technical Support" },
  { href: "/contact", label: "Contact Us" },
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20s-7-4.35-9.5-8.5C.5 8 2.5 4.5 6 4.5c2 0 3.5 1 6 3.5 2.5-2.5 4-3.5 6-3.5 3.5 0 5.5 3.5 3.5 7C19 15.65 12 20 12 20z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="21" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="21" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.2 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

export default function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cart = useCart();
  const wishlist = useWishlist();
  const auth = useAuth();
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/shop${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container-page flex items-center gap-3 sm:gap-6 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden shrink-0 h-9 w-9 flex items-center justify-center text-gray-700"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo-icon.png" alt="Key Lanka" width={56} height={56} className="h-9 w-9 sm:h-14 sm:w-14 object-contain" />
          <div className="leading-tight">
            <div className="font-extrabold text-sm sm:text-lg tracking-tight">
              KEY <span className="text-brand">LANKA</span>
            </div>
            <div className="hidden sm:block text-[10px] uppercase text-gray-500 tracking-wide">
              Car Keys &amp; Locksmith Tools
            </div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-stretch max-w-2xl">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search for products, brands..."
            className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button type="submit" className="bg-brand hover:bg-brand-dark text-white px-4 rounded-r-md flex items-center justify-center">
            <SearchIcon />
          </button>
        </form>

        <div className="flex items-center gap-3 sm:gap-5 ml-auto text-sm">
          {auth.user?.role === "ADMIN" && (
            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-block text-xs font-medium border border-brand text-brand rounded px-2.5 py-1.5 hover:bg-brand-light"
            >
              Admin
            </Link>
          )}
          <Link href="/account" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-brand">
            <UserIcon />
            <span className="hidden sm:block text-[11px]">Account</span>
          </Link>
          <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 text-gray-700 hover:text-brand">
            <HeartIcon />
            <span className="hidden sm:block text-[11px]">Wishlist</span>
            {wishlist.count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-brand text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {wishlist.count}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative flex flex-col items-center gap-0.5 text-gray-700 hover:text-brand">
            <CartIcon />
            <span className="hidden sm:block text-[11px]">Cart</span>
            {cart.count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-brand text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cart.count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search row */}
      <form onSubmit={handleSearch} className="md:hidden border-t border-gray-100 px-4 py-2.5 flex items-stretch">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search for products, brands..."
          className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button type="submit" className="bg-brand hover:bg-brand-dark text-white px-3 rounded-r-md flex items-center justify-center">
          <SearchIcon />
        </button>
      </form>

      <div className="hidden md:block border-t border-gray-100">
        <div className="container-page flex items-center gap-6 py-2.5 text-sm relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-md font-medium"
          >
            All Categories
          </button>
          {menuOpen && (
            <CategoryMegaMenu categories={categories} onClose={() => setMenuOpen(false)} />
          )}

          <nav className="flex items-center gap-5">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-gray-700 hover:text-brand font-medium">
                {l.label}
              </Link>
            ))}
            <div className="relative" onMouseEnter={() => setInfoOpen(true)} onMouseLeave={() => setInfoOpen(false)}>
              <button className="text-gray-700 hover:text-brand font-medium">Information</button>
              {infoOpen && (
                <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-lg py-2 w-48">
                  {INFO_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className="block px-4 py-2 text-gray-700 hover:bg-brand-light hover:text-brand text-sm">
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/contact" className="text-gray-700 hover:text-brand font-medium">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="light w-[85vw] sm:max-w-sm p-0 overflow-y-auto bg-background text-foreground">
          <SheetHeader className="border-b border-gray-100">
            <SheetTitle className="flex items-center gap-2">
              <Image src="/logo-icon.png" alt="Key Lanka" width={32} height={32} className="h-8 w-8 object-contain" />
              KEY LANKA
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-gray-800 font-medium border-b border-gray-50 hover:bg-brand-light hover:text-brand"
              >
                {l.label}
              </Link>
            ))}

            <button
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="flex items-center justify-between px-4 py-3 text-gray-800 font-medium border-b border-gray-50"
            >
              Shop by Category
              <ChevronRight size={16} className={mobileCategoriesOpen ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>
            {mobileCategoriesOpen && (
              <div className="bg-gray-50 py-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-2 text-sm text-gray-600 hover:text-brand"
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/brands"
                  onClick={() => setMobileOpen(false)}
                  className="block px-6 py-2 text-sm text-gray-600 hover:text-brand"
                >
                  Vehicle Brands
                </Link>
              </div>
            )}

            {INFO_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-gray-800 font-medium border-b border-gray-50 hover:bg-brand-light hover:text-brand"
              >
                {l.label}
              </Link>
            ))}

            {auth.user?.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-brand font-medium"
              >
                Admin Dashboard
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
