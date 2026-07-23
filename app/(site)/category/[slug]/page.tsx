import { Suspense } from "react";
import { notFound } from "next/navigation";
import ShopContent from "@/components/ShopContent";
import { getCategoryBySlug } from "@/lib/queries";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="container-page text-sm text-gray-500">
          Home <span className="mx-1">›</span> <span className="text-gray-800 font-medium">{category.name}</span>
        </div>
      </div>
      <Suspense fallback={<div className="container-page py-12 text-gray-400">Loading...</div>}>
        <ShopContent fixedCategorySlug={slug} />
      </Suspense>
    </div>
  );
}
