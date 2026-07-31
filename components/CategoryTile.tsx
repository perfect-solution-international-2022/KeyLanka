import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";

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
  locked,
}: {
  name: string;
  slug: string;
  image?: string | null;
  href?: string;
  locked?: boolean;
}) {
  const inner = (
    <>
      <div className="relative aspect-square bg-white">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
            className={`object-cover transition-transform ${locked ? "grayscale opacity-60" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className={`h-full w-full flex items-center justify-center text-4xl ${locked ? "bg-gray-100 grayscale opacity-60" : "bg-brand-light"}`}>
            {ICONS[slug] ?? "🔑"}
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <Lock size={22} className="text-gray-500" />
          </div>
        )}
      </div>
      <span className={`text-sm font-semibold py-3 px-2 ${locked ? "text-gray-600" : "text-gray-800"}`}>{name}</span>
    </>
  );

  if (locked) {
    return (
      <div
        className="flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden text-center cursor-not-allowed"
        title="Restricted to approved Locksmith Merchants"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href ?? `/category/${slug}`}
      className="group flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden hover:border-brand hover:shadow-md transition-all text-center"
    >
      {inner}
    </Link>
  );
}
