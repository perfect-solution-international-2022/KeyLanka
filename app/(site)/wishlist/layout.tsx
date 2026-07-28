import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false, noarchive: true },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}

