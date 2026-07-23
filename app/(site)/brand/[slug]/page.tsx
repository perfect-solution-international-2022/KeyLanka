import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/lib/queries";
import ShopContent from "@/components/ShopContent";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug).catch(() => null);
  if (!brand) notFound();

  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="container-page text-sm text-gray-500">
          Home <span className="mx-1">›</span> Brands <span className="mx-1">›</span>{" "}
          <span className="text-gray-800 font-medium">{brand.name}</span>
        </div>
      </div>
      <div className="container-page pt-8 flex items-center gap-4">
        {brand.logo && (
          <div className="relative h-12 w-28 shrink-0">
            <Image src={brand.logo} alt={brand.name} fill className="object-contain object-left" sizes="112px" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{brand.name} Keys &amp; Remotes</h1>
          <p className="text-gray-500 text-sm mt-1">Smart keys, remote keys, key shells, covers, transponders &amp; blanks for {brand.name}.</p>
        </div>
      </div>
      <Suspense fallback={<div className="container-page py-12 text-gray-400">Loading...</div>}>
        <ShopContent fixedBrandSlug={slug} />
      </Suspense>
    </div>
  );
}
