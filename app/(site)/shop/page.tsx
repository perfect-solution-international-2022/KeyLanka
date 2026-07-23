import { Suspense } from "react";
import ShopContent from "@/components/ShopContent";

export const metadata = { title: "Shop | Key Lanka" };

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
