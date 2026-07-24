"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import type { Category } from "@/lib/api";
import { useAuth } from "@/app/providers";
import { isLocksmithAuthorized } from "@/lib/locksmith";

export default function CategoryMegaMenu({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const authorized = isLocksmithAuthorized(auth.user);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 flex w-[720px] max-w-[90vw]"
    >
      <ul className="w-56 border-r border-gray-100 py-2">
        {categories.map((cat) => {
          const locked = cat.restricted && !authorized;
          return (
            <li key={cat.id}>
              {locked ? (
                <span
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                  title="Restricted to approved Locksmith Merchants"
                >
                  <span className="flex items-center gap-1.5">
                    <Lock size={12} /> {cat.name}
                  </span>
                </span>
              ) : (
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-brand-light hover:text-brand"
                >
                  {cat.name}
                  {cat.children && cat.children.length > 0 && <span className="text-gray-400">›</span>}
                </Link>
              )}
            </li>
          );
        })}
        <li>
          <Link href="/brands" onClick={onClose} className="flex items-center px-4 py-2.5 text-sm text-gray-800 hover:bg-brand-light hover:text-brand">
            Vehicle Brands
          </Link>
        </li>
      </ul>
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const locked = cat.restricted && !authorized;
          return (
            <div key={cat.id}>
              {locked ? (
                <span className="flex items-center gap-1.5 font-semibold text-sm text-gray-400 cursor-not-allowed">
                  <Lock size={12} /> {cat.name}
                </span>
              ) : (
                <Link href={`/category/${cat.slug}`} onClick={onClose} className="font-semibold text-sm text-gray-900 hover:text-brand">
                  {cat.name}
                </Link>
              )}
              <ul className="mt-1 space-y-1">
                {cat.children?.slice(0, 5).map((sub) =>
                  locked ? (
                    <li key={sub.id} className="text-xs text-gray-300 cursor-not-allowed">
                      {sub.name}
                    </li>
                  ) : (
                    <li key={sub.id}>
                      <Link href={`/category/${sub.slug}`} onClick={onClose} className="text-xs text-gray-500 hover:text-brand">
                        {sub.name}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
