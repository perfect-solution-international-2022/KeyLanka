import Link from "next/link";
import Image from "next/image";
import { getBrands } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Car Keys & Remotes by Vehicle Brand",
  description:
    "Find compatible car keys, smart remotes, shells, covers and transponders for leading vehicle brands available from Key Lanka in Sri Lanka.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await getBrands().catch(() => []);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Brands</h1>
      <p className="text-gray-500 text-sm mb-6">Find keys, remotes, shells and covers for your vehicle brand.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brand/${b.slug}`}
            className="flex flex-col items-center gap-2 border border-gray-200 rounded-lg p-5 bg-white hover:border-brand hover:shadow-md transition-all text-center"
          >
            <div className="relative h-12 w-full">
              {b.logo ? (
                <Image src={b.logo} alt={b.name} fill className="object-contain" sizes="140px" />
              ) : (
                <div className="h-12 w-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {b.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-800">{b.name}</span>
            {b._count && <span className="text-xs text-gray-400">{b._count.products} products</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
