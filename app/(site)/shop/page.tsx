import { Suspense } from "react";
import ShopContent from "@/components/ShopContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop Car Keys, Remotes & Locksmith Tools",
  description:
    "Browse Key Lanka's range of car keys, smart remotes, key shells, transponders, accessories and professional locksmith tools in Sri Lanka.",
  path: "/shop",
});

export default function ShopPage() {
  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="container-page text-sm text-gray-500">
          Home <span className="mx-1">›</span> <span className="text-gray-800 font-medium">Shop</span>
        </div>
      </div>
      <Suspense fallback={<div className="container-page py-12 text-gray-400">Loading shop...</div>}>
        <ShopContent />
      </Suspense>
    </div>
  );
}
