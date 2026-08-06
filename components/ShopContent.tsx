"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Lock, SlidersHorizontal } from "lucide-react";
import { api, Category, Brand, Condition, Product } from "@/lib/api";
import { useAuth } from "@/app/providers";
import { isLocksmithAuthorized } from "@/lib/locksmith";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ProductCard from "./ProductCard";

export default function ShopContent({
  fixedCategorySlug,
  fixedBrandSlug,
}: {
  fixedCategorySlug?: string;
  fixedBrandSlug?: string;
}) {
  const router = useRouter();
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
    api.getCategories().then(setCategories).catch(() => setCategories([]));
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
    router.push(fixedCategorySlug ? "" : "/shop");
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
            const expanded = expandedCategories.has(c.id) || Boolean(c.children?.some((child) => child.slug === categorySlug));
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => selectCategory(c.slug)}
                      className={`min-w-0 flex-1 rounded px-1 py-1 text-left hover:text-brand ${
                        categorySlug === c.slug ? "text-brand font-medium" : "text-gray-700"
                      }`}
                    >
                      {c.name}
                    </button>
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpanded(c.id)}
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${c.name}`}
                        aria-expanded={expanded}
                        className="flex size-7 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-brand"
                      >
                        <ChevronRight size={15} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </button>
                    )}
                  </div>
                )}
                {!locked && hasChildren && expanded && (
                  <ul className="mt-1 space-y-1 border-l border-gray-200 pl-3 ml-2">
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
                              className={`w-full rounded px-1 py-1 text-left hover:text-brand ${
                                categorySlug === child.slug ? "text-brand font-medium" : "text-gray-600"
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

      <button onClick={clearFilters} className="text-brand text-sm font-medium hover:underline">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="container-page py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 min-w-0">
      <aside className="hidden md:block">{filtersPanel}</aside>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="light w-[85vw] sm:max-w-sm overflow-y-auto bg-background text-foreground">
          <SheetHeader className="border-b border-gray-100">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="p-4">{filtersPanel}</div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-gray-600">
          <button
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
