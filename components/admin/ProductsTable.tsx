"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check } from "lucide-react";
import { adminApi, AdminProduct } from "@/lib/admin-api";
import { formatCurrency } from "@/lib/api";

function StockCell({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Invalid");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminApi.updateProductStock(product.id, stock);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(product.stock));
          setEditing(true);
        }}
        className={`inline-flex items-center gap-1 hover:underline ${product.stock === 0 ? "text-destructive" : ""}`}
        title="Click to edit stock"
      >
        {product.stock}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        type="number"
        min={0}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 w-16 text-right"
      />
      <button
        onClick={save}
        disabled={saving}
        className="h-7 w-7 flex items-center justify-center rounded-md bg-brand text-white disabled:opacity-50"
      >
        <Check size={13} />
      </button>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  );
}

export function ProductsTable({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await adminApi.deleteProduct(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs h-9"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded bg-muted shrink-0 overflow-hidden">
                      <Image src={p.images[0] ?? "/products/placeholder-1.svg"} alt="" fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[220px]">{p.name}</div>
                      {p.badge && (
                        <Badge variant="secondary" className="mt-0.5 text-[10px]">
                          {p.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                <TableCell>{p.category?.name ?? "—"}</TableCell>
                <TableCell>{p.brand?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                <TableCell className="text-right">
                  <StockCell product={p} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
