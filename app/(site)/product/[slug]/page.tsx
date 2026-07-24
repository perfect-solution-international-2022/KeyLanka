import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getProductBySlug, getWholesaleMinQty, isServerLocksmithAuthorized } from "@/lib/queries";
import ProductDetail from "@/components/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, wholesaleMinQty] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getWholesaleMinQty().catch(() => 10),
  ]);
  if (!product) notFound();

  if (product.category?.restricted && !(await isServerLocksmithAuthorized())) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restricted to Locksmith Merchants</h1>
        <p className="text-gray-500 mb-6">
          This product is only available to approved KeyLanka Locksmith Merchants.
        </p>
        <Link
          href="/account/become-locksmith"
          className="inline-block bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md"
        >
          Become a Locksmith Merchant
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="container-page text-sm text-gray-500">
          Home <span className="mx-1">›</span> Shop <span className="mx-1">›</span>{" "}
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>
      </div>
      <ProductDetail product={product} wholesaleMinQty={wholesaleMinQty} />
    </div>
  );
}
