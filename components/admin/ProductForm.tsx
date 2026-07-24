"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi, AdminProduct, AdminProductInput, AdminCategory, AdminBrand } from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BADGES = ["", "HOT", "NEW"];

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: AdminProduct;
  categories: AdminCategory[];
  brands: AdminBrand[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ?? "");
  const [wholesalePrice, setWholesalePrice] = useState(product?.wholesalePrice ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number | null>(null);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((s) => setWholesaleMinQty(s.wholesaleMinQty))
      .catch(() => {});
  }, []);
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [description, setDescription] = useState(product?.description ?? "");
  const [productType, setProductType] = useState(product?.productType ?? "");
  const [categoryId, setCategoryId] = useState(String(product?.categoryId ?? categories[0]?.id ?? ""));
  const [brandId, setBrandId] = useState(product?.brandId ? String(product.brandId) : "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const flatCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (images.length === 0) {
      setError("Add at least one product image.");
      return;
    }

    setLoading(true);
    const payload: AdminProductInput = {
      name,
      sku,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      stock: Number(stock),
      badge: badge || null,
      featured,
      description,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <Label className="mb-2 block">Product Images</Label>
        <ImageUploader images={images} onChange={setImages} multiple />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" required value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (Rs.)</Label>
          <Input id="price" type="number" min={0} step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compareAtPrice">Compare-at Price</Label>
          <Input
            id="compareAtPrice"
            type="number"
            min={0}
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wholesalePrice">Wholesale Price (Rs.)</Label>
          <Input
            id="wholesalePrice"
            type="number"
            min={0}
            step="0.01"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
            placeholder="Optional"
          />
          <p className="text-xs text-muted-foreground">
            {wholesaleMinQty
              ? `Applies automatically when a customer buys ${wholesaleMinQty}+ units. Change the threshold in Settings.`
              : "Applies automatically once the store-wide minimum quantity is reached."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" min={0} required value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-transparent"
          >
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `— ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand (optional)</Label>
          <select
            id="brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-transparent"
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="badge">Badge</Label>
          <select
            id="badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-transparent"
          >
            {BADGES.map((b) => (
              <option key={b} value={b}>
                {b || "None"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="productType">Product Type</Label>
          <Input
            id="productType"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder="e.g. Smart Keys"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        Show in Featured Products on the homepage
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          disabled={loading}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium px-5 py-2 rounded-md text-sm"
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="border border-gray-300 px-5 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
