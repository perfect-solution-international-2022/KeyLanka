"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  adminApi,
  AdminProduct,
  AdminProductInput,
  AdminCategory,
  AdminBrand,
  AdminAttribute,
  AdminProductVariant,
  AdminWarranty,
} from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BADGES = ["", "HOT", "NEW"];
type ProductTab = "general" | "attributes" | "variations" | "inventory" | "seo";

const SIMPLE_TABS: { id: ProductTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "inventory", label: "Inventory" },
  { id: "seo", label: "SEO" },
];

const VARIABLE_TABS: { id: ProductTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "attributes", label: "Attributes" },
  { id: "variations", label: "Variations" },
  { id: "inventory", label: "Inventory" },
  { id: "seo", label: "SEO" },
];

function cartesian(groups: number[][]): number[][] {
  let combos: number[][] = [[]];
  for (const g of groups) combos = combos.flatMap((c) => g.map((id) => [...c, id]));
  return combos;
}

function blankVariant(base: {
  sku: string;
  price: string;
  wholesalePrice: string;
  lowStockThreshold: string;
}, attributeValueIds: number[], isDefault: boolean): AdminProductVariant {
  return {
    sku: base.sku,
    price: base.price || "0",
    compareAtPrice: null,
    wholesalePrice: base.wholesalePrice || null,
    productCost: null,
    stockStatus: "in_stock",
    stock: 0,
    lowStockThreshold: Number(base.lowStockThreshold) || 10,
    weightKg: null,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    image: null,
    isDefault,
    attributeValueIds,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const selectClass =
  "w-full h-10 border border-input rounded-lg px-3 text-sm bg-background outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export function ProductForm({
  product,
  categories,
  brands,
  fullWidth = false,
}: {
  product?: AdminProduct;
  categories: AdminCategory[];
  brands: AdminBrand[];
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [activeTab, setActiveTab] = useState<ProductTab>("general");

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [wholesalePrice, setWholesalePrice] = useState(product?.wholesalePrice ?? "");
  const [wholesaleMinQty, setWholesaleMinQty] = useState(String(product?.wholesaleMinQty ?? 10));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.lowStockThreshold ?? 10));
  const [allowBackorder, setAllowBackorder] = useState(product?.allowBackorder ?? false);
  const [soldIndividually, setSoldIndividually] = useState(product?.soldIndividually ?? false);
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [productType, setProductType] = useState(
    product?.productType === "Variable Product" ? "Variable Product" : "Single Product"
  );
  const [categoryIds, setCategoryIds] = useState<number[]>(
    product?.categories?.length
      ? product.categories.map((category) => category.id)
      : product?.categoryId
        ? [product.categoryId]
        : categories[0]?.id
          ? [categories[0].id]
          : []
  );
  const [brandId, setBrandId] = useState(product?.brandId ? String(product.brandId) : "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [focusKeywords, setFocusKeywords] = useState(product?.focusKeywords ?? "");
  const [imageAlt, setImageAlt] = useState(product?.imageAlt ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isVariable = productType === "Variable Product";

  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<number, number[]>>({});
  const [variants, setVariants] = useState<AdminProductVariant[]>(product?.variants ?? []);
  const [warranties, setWarranties] = useState<AdminWarranty[]>([]);
  const [warrantyIds, setWarrantyIds] = useState<number[]>(product?.warranties?.map((w) => w.id) ?? []);

  useEffect(() => {
    adminApi.getAttributes().then((data) => {
      setAttributes(data);
      if (product?.variants?.length) {
        const valueToAttr = new Map<number, number>();
        for (const attr of data) for (const v of attr.values) valueToAttr.set(v.id, attr.id);
        const initial: Record<number, number[]> = {};
        for (const variant of product.variants) {
          for (const valueId of variant.attributeValueIds) {
            const attrId = valueToAttr.get(valueId);
            if (attrId === undefined) continue;
            initial[attrId] = initial[attrId] ? [...new Set([...initial[attrId], valueId])] : [valueId];
          }
        }
        setSelectedAttrValues(initial);
      }
    });
    adminApi.getWarranties().then((data) => setWarranties(data.filter((w) => w.active)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flatCategories = categories.flatMap((category) => [category, ...(category.children ?? [])]);
  const featuredImage = images.slice(0, 1);
  const galleryImages = images.slice(1);
  const previewTitle = seoTitle || name || "Product title";
  const previewDescription =
    metaDescription || shortDescription || "Add a concise description that explains this product to shoppers.";
  const previewSlug = slug || "product-name";
  const stockStatus = Number(stock) > 0 ? "in-stock" : "out-of-stock";

  const TABS = isVariable ? VARIABLE_TABS : SIMPLE_TABS;

  const tabIds = useMemo(
    () => ({
      general: "product-tab-general",
      attributes: "product-tab-attributes",
      variations: "product-tab-variations",
      inventory: "product-tab-inventory",
      seo: "product-tab-seo",
    }),
    []
  );

  function toggleAttrValue(attributeId: number, valueId: number) {
    setSelectedAttrValues((prev) => {
      const current = prev[attributeId] ?? [];
      const next = current.includes(valueId) ? current.filter((id) => id !== valueId) : [...current, valueId];
      return { ...prev, [attributeId]: next };
    });
  }

  function toggleCategory(categoryId: number) {
    setCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]
    );
  }

  function generateVariations() {
    const chosenGroups = Object.values(selectedAttrValues).filter((ids) => ids.length > 0);
    if (chosenGroups.length === 0) {
      setVariants([]);
      return;
    }
    const combos = cartesian(chosenGroups);
    const existingByKey = new Map(variants.map((v) => [[...v.attributeValueIds].sort((a, b) => a - b).join(","), v]));

    const next = combos.map((combo, index) => {
      const key = [...combo].sort((a, b) => a - b).join(",");
      const existing = existingByKey.get(key);
      if (existing) return existing;
      return blankVariant(
        { sku: sku || "VAR", price, wholesalePrice, lowStockThreshold },
        combo,
        variants.length === 0 && index === 0
      );
    });
    if (!next.some((v) => v.isDefault) && next.length) next[0] = { ...next[0], isDefault: true };
    setVariants(next);
  }

  function updateVariant(index: number, patch: Partial<AdminProductVariant>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length && !next.some((v) => v.isDefault)) next[0] = { ...next[0], isDefault: true };
      return next;
    });
  }

  function setDefaultVariant(index: number) {
    setVariants((prev) => prev.map((v, i) => ({ ...v, isDefault: i === index })));
  }

  function attributeValueLabel(valueId: number): string {
    for (const attr of attributes) {
      const value = attr.values.find((v) => v.id === valueId);
      if (value) return value.value;
    }
    return "";
  }

  useEffect(() => {
    if (!isVariable && (activeTab === "attributes" || activeTab === "variations")) {
      queueMicrotask(() => setActiveTab("general"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVariable]);

  function updateFeaturedImage(next: string[]) {
    setImages(next.length ? [next[0], ...galleryImages] : galleryImages);
  }

  function updateGalleryImages(next: string[]) {
    setImages(featuredImage.length ? [...featuredImage, ...next] : next);
  }

  function changeStockStatus(value: string) {
    if (value === "out-of-stock") setStock("0");
    else if (Number(stock) <= 0) setStock("1");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || categoryIds.length === 0 || !price) {
      setActiveTab("general");
      setError("Complete the required fields in General.");
      return;
    }
    if (!sku.trim()) {
      setActiveTab("inventory");
      setError("Add a SKU in Inventory.");
      return;
    }
    if (images.length === 0) {
      setActiveTab("general");
      setError("Add a featured product image.");
      return;
    }
    if (wholesalePrice && Number(wholesaleMinQty) < 1) {
      setActiveTab("general");
      setError("Wholesale activation quantity must be at least 1.");
      return;
    }
    if (isVariable) {
      if (variants.length === 0) {
        setActiveTab("variations");
        setError("Select attributes and generate at least one variation.");
        return;
      }
      const variantSkus = variants.map((v) => v.sku.trim());
      if (variantSkus.some((s) => !s)) {
        setActiveTab("variations");
        setError("Every variation needs a SKU.");
        return;
      }
      if (new Set(variantSkus).size !== variantSkus.length) {
        setActiveTab("variations");
        setError("Variation SKUs must be unique.");
        return;
      }
      if (variants.some((v) => !v.price || Number(v.price) <= 0)) {
        setActiveTab("variations");
        setError("Every variation needs a regular price.");
        return;
      }
    }

    setLoading(true);
    const payload: AdminProductInput = {
      name: name.trim(),
      slug: slugify(slug || name),
      sku: sku.trim(),
      price: Number(price),
      compareAtPrice: null,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      wholesaleMinQty: Number(wholesaleMinQty),
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      allowBackorder,
      soldIndividually,
      badge: badge || null,
      featured,
      shortDescription,
      description,
      seoTitle,
      metaDescription,
      focusKeywords,
      imageAlt,
      images,
      productType: productType || null,
      categoryId: categoryIds.includes(product?.categoryId ?? -1) ? product!.categoryId : categoryIds[0],
      categoryIds,
      brandId: brandId ? Number(brandId) : null,
      variants: isVariable
        ? variants.map((v) => ({
            ...v,
            sku: v.sku.trim(),
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
            productCost: v.productCost ? Number(v.productCost) : null,
            stock: Number(v.stock),
            lowStockThreshold: Number(v.lowStockThreshold),
            weightKg: v.weightKg ? Number(v.weightKg) : null,
            lengthCm: v.lengthCm ? Number(v.lengthCm) : null,
            widthCm: v.widthCm ? Number(v.widthCm) : null,
            heightCm: v.heightCm ? Number(v.heightCm) : null,
          }))
        : [],
      warrantyIds,
    };

    try {
      if (isEdit && product) {
        await adminApi.updateProduct(product.id, payload);
        toast.success("Product updated");
      } else {
        await adminApi.createProduct(payload);
        toast.success("Product created");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${fullWidth ? "w-full" : "max-w-2xl"} overflow-hidden rounded-xl border border-border bg-card shadow-sm`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">{isEdit ? "Edit Product" : "Create Product"}</h2>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          aria-label="Close product form"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={19} />
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!slugTouched) setSlug(slugify(nextName));
            }}
            placeholder="e.g. Toyota Smart Key"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Categories</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {flatCategories.map((category) => (
                <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span>{category.parentId ? `— ${category.name}` : category.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select one or more categories.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="productType">Product Type</Label>
            <select
              id="productType"
              value={productType}
              onChange={(event) => setProductType(event.target.value)}
              className={selectClass}
            >
              <option value="Single Product">Single Product</option>
              <option value="Variable Product">Variable Product</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shortDescription">Product Short Description</Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            placeholder="One-line summary"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Product Description</Label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Featured Image</Label>
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <ImageUploader images={featuredImage} onChange={updateFeaturedImage} />
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or SVG.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Gallery Images</Label>
            <div className="flex min-h-40 items-center rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <ImageUploader images={galleryImages} onChange={updateGalleryImages} multiple />
            </div>
            <p className="text-xs text-muted-foreground">Upload multiple product images.</p>
          </div>
        </div>

        <div>
          <div role="tablist" aria-label="Product details" className="flex overflow-x-auto border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={tabIds[tab.id]}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tabIds[tab.id]}-panel`}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section
            id={`${tabIds.general}-panel`}
            role="tabpanel"
            aria-labelledby={tabIds.general}
            hidden={activeTab !== "general"}
            className="grid gap-4 py-6 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Available Warranties</Label>
              <p className="text-xs text-muted-foreground">No Warranty is automatically available. Select any additional warranties for this product.</p>
              <div className="flex flex-wrap gap-3 rounded-lg border p-3">
                {warranties.length === 0 ? <span className="text-sm text-muted-foreground">No warranty types configured.</span> : warranties.map((w) => <label key={w.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={warrantyIds.includes(w.id)} onChange={() => setWarrantyIds((ids) => ids.includes(w.id) ? ids.filter((id) => id !== w.id) : [...ids, w.id])} className="accent-brand" />{w.name} ({w.days} days, Rs. {Number(w.price).toLocaleString()})</label>)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Regular Price (Rs.)</Label>
              <Input id="price" type="number" min={0.01} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wholesalePrice">Wholesale Price (Rs.)</Label>
              <Input
                id="wholesalePrice"
                type="number"
                min={0.01}
                step="0.01"
                value={wholesalePrice}
                onChange={(event) => setWholesalePrice(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wholesaleMinQty">Wholesale Activates At</Label>
              <Input
                id="wholesaleMinQty"
                type="number"
                min={1}
                step={1}
                value={wholesaleMinQty}
                onChange={(event) => setWholesaleMinQty(event.target.value)}
                disabled={!wholesalePrice}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-muted-foreground">
                Example: enter 10 to apply wholesale pricing at 10 or more items.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand (optional)</Label>
              <select id="brand" value={brandId} onChange={(event) => setBrandId(event.target.value)} className={selectClass}>
                <option value="">No brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="badge">Badge</Label>
              <select id="badge" value={badge} onChange={(event) => setBadge(event.target.value)} className={selectClass}>
                {BADGES.map((value) => <option key={value} value={value}>{value || "None"}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="h-4 w-4 accent-brand" />
              Show in Featured Products
            </label>
          </section>

          {isVariable && (
            <section
              id={`${tabIds.attributes}-panel`}
              role="tabpanel"
              aria-labelledby={tabIds.attributes}
              hidden={activeTab !== "attributes"}
              className="space-y-4 py-6"
            >
              <p className="text-sm text-muted-foreground">Select attribute values, then generate variations.</p>
              {attributes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No attributes yet.{" "}
                  <a href="/admin/attributes" target="_blank" rel="noreferrer" className="text-brand underline">
                    Add attributes like Color and Size
                  </a>{" "}
                  first.
                </p>
              ) : (
                attributes.map((attr) => (
                  <div key={attr.id} className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold">{attr.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attr.values.map((v) => {
                        const selected = (selectedAttrValues[attr.id] ?? []).includes(v.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => toggleAttrValue(attr.id, v.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              selected
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-border text-foreground hover:border-brand/50"
                            }`}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {isVariable && (
            <section
              id={`${tabIds.variations}-panel`}
              role="tabpanel"
              aria-labelledby={tabIds.variations}
              hidden={activeTab !== "variations"}
              className="space-y-4 py-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Product Variations</h3>
                <button
                  type="button"
                  onClick={() => {
                    const hasSelection = Object.values(selectedAttrValues).some((ids) => ids.length > 0);
                    if (!hasSelection) {
                      setError("Please select attributes first in the Attributes tab.");
                      return;
                    }
                    setError("");
                    generateVariations();
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Generate Variations
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border p-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowBackorder}
                    onChange={(event) => setAllowBackorder(event.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  Allow backorder when out of stock
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={soldIndividually}
                    onChange={(event) => setSoldIndividually(event.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  Sold individually (limit one per order)
                </label>
              </div>

              {variants.map((variant, index) => (
                <details key={index} open={index === 0} className="group rounded-lg border border-border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">Variation #{index + 1}:</span>
                      {variant.attributeValueIds.map((valueId) => (
                        <span key={valueId} className="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700">
                          {attributeValueLabel(valueId)}
                        </span>
                      ))}
                      {variant.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          removeVariant(index);
                        }}
                        aria-label={`Remove variation ${index + 1}`}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X size={16} />
                      </button>
                      <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
                    </div>
                  </summary>

                  <div className="border-t border-border p-4">
                    <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={variant.isDefault}
                        onChange={(event) => {
                          if (event.target.checked) setDefaultVariant(index);
                        }}
                        className="h-4 w-4 accent-brand"
                      />
                      Is Default?
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>SKU</Label>
                        <Input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Regular Price</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={variant.price}
                          onChange={(event) => updateVariant(index, { price: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Sale Price</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={variant.compareAtPrice ?? ""}
                          onChange={(event) => updateVariant(index, { compareAtPrice: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Wholesale Price</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={variant.wholesalePrice ?? ""}
                          onChange={(event) => updateVariant(index, { wholesalePrice: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Product Cost</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={variant.productCost ?? ""}
                          onChange={(event) => updateVariant(index, { productCost: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Stock Status</Label>
                        <select
                          value={variant.stockStatus}
                          onChange={(event) => updateVariant(index, { stockStatus: event.target.value })}
                          className={selectClass}
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Stock Quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={variant.stock}
                          onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Low Stock Threshold</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={variant.lowStockThreshold}
                          onChange={(event) => updateVariant(index, { lowStockThreshold: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.weightKg ?? ""}
                          onChange={(event) => updateVariant(index, { weightKg: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Length (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.lengthCm ?? ""}
                          onChange={(event) => updateVariant(index, { lengthCm: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Width (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.widthCm ?? ""}
                          onChange={(event) => updateVariant(index, { widthCm: event.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.heightCm ?? ""}
                          onChange={(event) => updateVariant(index, { heightCm: event.target.value || null })}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <Label>Variation Image</Label>
                      <ImageUploader
                        images={variant.image ? [variant.image] : []}
                        onChange={(imgs) => updateVariant(index, { image: imgs[0] ?? null })}
                      />
                    </div>
                  </div>
                </details>
              ))}
            </section>
          )}

          <section
            id={`${tabIds.inventory}-panel`}
            role="tabpanel"
            aria-labelledby={tabIds.inventory}
            hidden={activeTab !== "inventory"}
            className="grid gap-4 py-6 md:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Product SKU" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" min={0} step={1} value={stock} onChange={(event) => setStock(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockStatus">Stock Status</Label>
              <select id="stockStatus" value={stockStatus} onChange={(event) => changeStockStatus(event.target.value)} className={selectClass}>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min={0}
                step={1}
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowBackorder} onChange={(event) => setAllowBackorder(event.target.checked)} className="h-4 w-4 accent-brand" />
              Allow backorders when out of stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={soldIndividually} onChange={(event) => setSoldIndividually(event.target.checked)} className="h-4 w-4 accent-brand" />
              Sold individually (limit one per order)
            </label>
          </section>

          <section
            id={`${tabIds.seo}-panel`}
            role="tabpanel"
            aria-labelledby={tabIds.seo}
            hidden={activeTab !== "seo"}
            className="space-y-5 py-6"
          >
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">Google Preview</p>
              <p className="text-lg text-blue-700">{previewTitle}</p>
              <p className="text-sm text-green-700">keylanka.lk/product/{previewSlug}</p>
              <p className="mt-1 text-sm text-muted-foreground">{previewDescription}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" maxLength={60} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Product title for Google" />
              <p className="text-xs text-muted-foreground">{seoTitle.length}/60 recommended characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                rows={3}
                maxLength={160}
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                placeholder="Describe the product benefit, compatibility and delivery in Sri Lanka."
                className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <p className="text-xs text-muted-foreground">{metaDescription.length}/160 recommended characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex">
                <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">/product/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  className="rounded-l-none"
                  placeholder="product-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="focusKeywords">Focus Keywords</Label>
              <Input
                id="focusKeywords"
                value={focusKeywords}
                onChange={(event) => setFocusKeywords(event.target.value)}
                placeholder="smart key, Toyota key, Sri Lanka"
              />
              <p className="text-xs text-muted-foreground">Separate related search phrases with commas.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imageAlt">Featured Image Alt Text</Label>
              <Input
                id="imageAlt"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe what is visible in the product image"
              />
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          disabled={loading}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
