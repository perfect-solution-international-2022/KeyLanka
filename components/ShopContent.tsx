"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Grid2X2, List, Lock, SlidersHorizontal, X } from "lucide-react";
import { api, Category, Brand, Condition, Product } from "@/lib/api";
import { useAuth } from "@/app/providers";
import { isLocksmithAuthorized } from "@/lib/locksmith";
import ProductCard from "./ProductCard";

export default function ShopContent({
  fixedCategorySlug,
  fixedBrandSlug,
}: {
  fixedCategorySlug?: string;
  fixedBrandSlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const authorized = isLocksmithAuthorized(auth.user);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const search = searchParams.get("search") ?? "";
  const selectedBrands = useMemo(() => (searchParams.get("brand")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const selectedConditions = useMemo(() => (searchParams.get("condition")?.split(",").filter(Boolean) ?? []), [searchParams]);
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "popularity";
  const page = Number(searchParams.get("page") ?? "1");
  const categorySlug = fixedCategorySlug ?? searchParams.get("category") ?? "";
  const brandSlug = fixedBrandSlug ?? "";

  const activeFilterCount =
    (categorySlug && !fixedCategorySlug ? 1 : 0) + selectedBrands.length + selectedConditions.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  useEffect(() => {
    api.getCategories().then((items) => {
      setCategories(items);
      setExpandedCategories(new Set(items.filter((category) => category.children?.length).map((category) => category.id)));
    }).catch(() => setCategories([]));
    api.getBrands().then(setBrands).catch(() => setBrands([]));
    api.getConditions().then(setConditions).catch(() => setConditions([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    api
      .getProducts({
        category: categorySlug || undefined,
        brand: fixedBrandSlug || selectedBrands.join(",") || undefined,
        condition: selectedConditions.join(",") || undefined,
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
  }, [categorySlug, fixedBrandSlug, selectedBrands, selectedConditions, minPrice, maxPrice, search, sort, page]);

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutator(next);
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
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
    router.push(`${pathname}?${next.toString()}`);
  }

  function selectCategory(slug: string) {
    setFiltersOpen(false);
    if (fixedCategorySlug) router.push(`/category/${slug}`);
    else updateParams((params) => (categorySlug === slug ? params.delete("category") : params.set("category", slug)));
  }

  function toggleCategoryExpanded(id: number) {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setFiltersOpen(false);
    router.replace(pathname);
  }

  const from = total === 0 ? 0 : (page - 1) * 12 + 1;
  const to = Math.min(page * 12, total);

  const filtersPanel = (
    <div className="space-y-6 min-w-0">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <ul className="space-y-1 text-sm">
          {categories.map((c) => {
            const locked = c.restricted && !authorized;
            const hasChildren = Boolean(c.children?.length);
            const containsSelectedCategory = c.slug === categorySlug || Boolean(c.children?.some((child) => child.slug === categorySlug));
            const expanded = expandedCategories.has(c.id);
            return (
              <li key={c.id}>
                {locked ? (
                  <span
                    className="flex items-center justify-between w-full px-1 py-1 rounded text-gray-300 cursor-not-allowed"
                    title="Restricted to approved Locksmith Merchants"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lock size={11} /> {c.name}
                    </span>
                  </span>
                ) : (
                  hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(c.id)}
                      aria-expanded={expanded}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-100 hover:text-brand ${
                        containsSelectedCategory ? "bg-brand-light text-brand font-medium" : "text-gray-700"
                      }`}
                    >
                      <span>{c.name}</span>
                      <ChevronRight size={16} className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectCategory(c.slug)}
                      className={`w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-100 hover:text-brand ${
                        categorySlug === c.slug ? "bg-brand-light text-brand font-medium" : "text-gray-700"
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                )}
                {!locked && hasChildren && expanded && (
                  <ul className="mt-1 mb-2 space-y-0.5 border-l-2 border-brand/20 pl-3 ml-3">
                    <li>
                      <button
                        type="button"
                        onClick={() => selectCategory(c.slug)}
                        className={`w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-100 hover:text-brand ${
                          categorySlug === c.slug ? "bg-brand-light text-brand font-medium" : "text-gray-500"
                        }`}
                      >
                        All {c.name}
                      </button>
                    </li>
                    {c.children?.map((child) => {
                      const childLocked = child.restricted && !authorized;
                      return (
                        <li key={child.id}>
                          {childLocked ? (
                            <span
                              className="flex items-center gap-1.5 rounded px-1 py-1 text-gray-300 cursor-not-allowed"
                              title="Restricted to approved Locksmith Merchants"
                            >
                              <Lock size={11} /> {child.name}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectCategory(child.slug)}
                              className={`w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-100 hover:text-brand ${
                                categorySlug === child.slug ? "bg-brand-light text-brand font-medium" : "text-gray-600"
                              }`}
                            >
                              {child.name}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
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

      {conditions.length > 0 && <div>
        <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
        <ul className="space-y-1.5 text-sm">
          {conditions.map((condition) => <li key={condition.id} className="flex items-center gap-2">
            <input type="checkbox" checked={selectedConditions.includes(condition.slug)} onChange={() => toggleListValue("condition", condition.slug)} className="accent-brand" />
            <span className="text-gray-700">{condition.name}</span>
          </li>)}
        </ul>
      </div>}

      <button type="button" onClick={clearFilters} className="text-brand text-sm font-medium hover:underline">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="container-page py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 min-w-0">
      <aside className="hidden md:block">{filtersPanel}</aside>

      {filtersOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col bg-white text-gray-900 shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
              <h2 id="mobile-filters-title" className="font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="flex size-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={19} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 overscroll-contain">{filtersPanel}</div>
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 hover:border-brand hover:text-brand"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
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
            <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`flex size-8 items-center justify-center ${view === "grid" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <Grid2X2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="List view"
                title="List view"
                className={`flex size-8 items-center justify-center border-l border-gray-300 ${view === "list" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <List size={16} />
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
              <ProductCard key={p.id} product={p} layout={view} />
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
