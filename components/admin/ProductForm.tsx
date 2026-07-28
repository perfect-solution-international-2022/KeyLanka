"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, AdminProduct, AdminProductInput, AdminCategory, AdminBrand } from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BADGES = ["", "HOT", "NEW"];
type ProductTab = "general" | "inventory" | "seo";

const TABS: { id: ProductTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "inventory", label: "Inventory" },
  { id: "seo", label: "SEO" },
];

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
  const [categoryId, setCategoryId] = useState(String(product?.categoryId ?? categories[0]?.id ?? ""));
  const [brandId, setBrandId] = useState(product?.brandId ? String(product.brandId) : "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [focusKeywords, setFocusKeywords] = useState(product?.focusKeywords ?? "");
  const [imageAlt, setImageAlt] = useState(product?.imageAlt ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const flatCategories = categories.flatMap((category) => [category, ...(category.children ?? [])]);
  const featuredImage = images.slice(0, 1);
  const galleryImages = images.slice(1);
  const previewTitle = seoTitle || name || "Product title";
  const previewDescription =
    metaDescription || shortDescription || "Add a concise description that explains this product to shoppers.";
  const previewSlug = slug || "product-name";
  const stockStatus = Number(stock) > 0 ? "in-stock" : "out-of-stock";

  const tabIds = useMemo(
    () => ({
      general: "product-tab-general",
      inventory: "product-tab-inventory",
      seo: "product-tab-seo",
    }),
    []
  );

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

    if (!name.trim() || !categoryId || !price) {
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
      categoryId: Number(categoryId),
      brandId: brandId ? Number(brandId) : null,
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
            <Label htmlFor="category">Category</Label>
            <select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={selectClass}>
              <option value="" disabled>Select category</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parentId ? `— ${category.name}` : category.name}
                </option>
              ))}
            </select>
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
