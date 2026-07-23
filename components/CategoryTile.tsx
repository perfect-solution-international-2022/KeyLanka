import Link from "next/link";
import Image from "next/image";

const ICONS: Record<string, string> = {
  "locksmith-tools": "🔧",
  "car-keys": "🔑",
  "key-shells": "🗝️",
  "key-covers": "🛡️",
  "remotes": "📡",
  "key-blanks": "🗜️",
  "lock-and-ignition-parts": "🔒",
  "accessories": "🔋",
};

export default function CategoryTile({
  name,
  slug,
  image,
  href,
}: {
  name: string;
  slug: string;
  image?: string | null;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/category/${slug}`}
      className="group flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden hover:border-brand hover:shadow-md transition-all text-center"
    >
      <div className="relative aspect-square bg-white">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl bg-brand-light">
            {ICONS[slug] ?? "🔑"}
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-800 py-3 px-2">{name}</span>
    </Link>
  );
}
