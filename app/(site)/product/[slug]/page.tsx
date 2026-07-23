import { notFound } from "next/navigation";
import { getProductBySlug, getWholesaleMinQty } from "@/lib/queries";
import ProductDetail from "@/components/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, wholesaleMinQty] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getWholesaleMinQty().catch(() => 10),
  ]);
  if (!product) notFound();

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
