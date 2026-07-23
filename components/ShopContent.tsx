"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Category, Brand, Product } from "@/lib/api";
import ProductCard from "./ProductCard";

const PRODUCT_TYPES = ["Smart Keys", "Remote Keys", "Key Shells", "Key Blanks", "Transponders"];

export default function ShopContent({
  fixedCategorySlug,
  fixedBrandSlug,
}: {
  fixedCategorySlug?: string;
  fixedBrandSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const search = searchParams.get("search") ?? "";
  const selectedBrands = useMemo(() => (searchParams.get("brand")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const selectedTypes = useMemo(() => (searchParams.get("productType")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "popularity";
  const page = Number(searchParams.get("page") ?? "1");
  const categorySlug = fixedCategorySlug ?? searchParams.get("category") ?? "";
  const brandSlug = fixedBrandSlug ?? "";

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api.getBrands().then(setBrands).catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getProducts({
        category: categorySlug || undefined,
        brand: fixedBrandSlug || selectedBrands.join(",") || undefined,
        productType: selectedTypes.join(",") || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        search: search || undefined,
        sort,
        page,
        limit: 12,
      })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, fixedBrandSlug, selectedBrands, selectedTypes, minPrice, maxPrice, search, sort, page]);

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutator(next);
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  function toggleListValue(key: string, value: string) {
    updateParams((params) => {
      const current = params.get(key)?.split(",").filter(Boolean) ?? [];
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length) params.set(key, current.join(","));
      else params.delete(key);
    });
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`?${next.toString()}`);
  }

  function clearFilters() {
    router.push(fixedCategorySlug ? "" : "/shop");
  }

  const from = total === 0 ? 0 : (page - 1) * 12 + 1;
  const to = Math.min(page * 12, total);

  return (
    <div className="container-page py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 min-w-0">
      <aside className="space-y-6 min-w-0">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
          <ul className="space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() =>
                    fixedCategorySlug
                      ? router.push(`/category/${c.slug}`)
                      : updateParams((p) => (categorySlug === c.slug ? p.delete("category") : p.set("category", c.slug)))
                  }
                  className={`flex items-center justify-between w-full text-left px-1 py-1 rounded hover:text-brand ${
                    categorySlug === c.slug ? "text-brand font-medium" : "text-gray-700"
                  }`}
                >
                  {c.name} <span className="text-gray-300">›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Filter by Price</h3>
          <div className="flex items-center gap-2 text-sm min-w-0">
            <input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              onBlur={(e) => updateParams((p) => (e.target.value ? p.set("minPrice", e.target.value) : p.delete("minPrice")))}
              className="w-full min-w-0 border border-gray-300 rounded px-2 py-1"
            />
            <span className="text-gray-400 shrink-0">-</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              onBlur={(e) => updateParams((p) => (e.target.value ? p.set("maxPrice", e.target.value) : p.delete("maxPrice")))}
              className="w-full min-w-0 border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>

        {!brandSlug && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
            <ul className="space-y-1.5 text-sm max-h-56 overflow-y-auto pr-1">
              {brands.map((b) => (
                <li key={b.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.slug)}
                    onChange={() => toggleListValue("brand", b.slug)}
                    className="accent-brand"
                  />
                  <span className="text-gray-700">
                    {b.name} {b._count ? <span className="text-gray-400">({b._count.products})</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Product Type</h3>
          <ul className="space-y-1.5 text-sm">
            {PRODUCT_TYPES.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(t)}
                  onChange={() => toggleListValue("productType", t)}
                  className="accent-brand"
                />
                <span className="text-gray-700">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={clearFilters} className="text-brand text-sm font-medium hover:underline">
          Clear Filters
        </button>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-gray-600">
          <span>
            {loading ? "Loading..." : `Showing ${from}-${to} of ${total} results`}
          </span>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => updateParams((p) => p.set("sort", e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button onClick={() => setView("grid")} className={`px-2 py-1.5 text-xs ${view === "grid" ? "bg-brand text-white" : "bg-white"}`}>
                Grid
              </button>
              <button onClick={() => setView("list")} className={`px-2 py-1.5 text-xs ${view === "list" ? "bg-brand text-white" : "bg-white"}`}>
                List
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg aspect-[3/4] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">No products found for the selected filters.</p>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-4"}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="px-3 py-1.5 border rounded shrink-0 cursor-pointer hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 transition-colors"
            >
              Prev
            </button>
            <span className="sm:hidden text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`hidden sm:inline-flex px-3 py-1.5 border rounded cursor-pointer transition-colors ${
                  page === i + 1 ? "bg-brand text-white border-brand hover:bg-brand-dark" : "hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-3 py-1.5 border rounded shrink-0 cursor-pointer hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
