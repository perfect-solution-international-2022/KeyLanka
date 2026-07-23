import Link from "next/link";
import Image from "next/image";
import type { Brand } from "@/lib/api";

function BrandCard({ b }: { b: Brand }) {
  return (
    <Link
      href={`/brand/${b.slug}`}
      className="shrink-0 w-36 flex flex-col items-center justify-center gap-2 border border-gray-200 rounded-lg p-4 bg-white hover:border-brand hover:shadow-md transition-all"
    >
      <div className="relative h-10 w-full">
        {b.logo ? (
          <Image src={b.logo} alt={b.name} fill className="object-contain" sizes="140px" />
        ) : (
          <div className="h-10 w-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
            {b.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 text-center">{b.name}</span>
    </Link>
  );
}

export default function BrandStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className="flex gap-4 w-max animate-marquee">
        {[...brands, ...brands].map((b, i) => (
          <BrandCard key={`${b.id}-${i}`} b={b} />
        ))}
      </div>
    </div>
  );
}
