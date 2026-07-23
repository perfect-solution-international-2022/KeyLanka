"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, X } from "lucide-react";
import { adminApi, AdminBrand } from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FormState {
  id: number | null;
  name: string;
  logo: string | null;
}

const EMPTY_FORM: FormState = { id: null, name: "", logo: null };

export function BrandsManager() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setBrands(await adminApi.getBrands());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.updateBrand(form.id, { name: form.name, logo: form.logo });
      } else {
        await adminApi.createBrand({ name: form.name, logo: form.logo });
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this brand?")) return;
    setError("");
    try {
      await adminApi.deleteBrand(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 h-fit bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{form.id ? "Edit Brand" : "Add Brand"}</h3>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="brand-name">Name</Label>
          <Input id="brand-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-2 block">Logo</Label>
          <ImageUploader images={form.logo ? [form.logo] : []} onChange={(imgs) => setForm((f) => ({ ...f, logo: imgs[0] ?? null }))} />
        </div>
        <button
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
        >
          {saving ? "Saving..." : form.id ? "Save Changes" : "Add Brand"}
        </button>
      </form>

      <div className="rounded-lg border bg-card overflow-hidden h-fit">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              brands.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {b.logo ? (
                        <div className="relative h-8 w-8 rounded bg-muted overflow-hidden shrink-0">
                          <Image src={b.logo} alt="" fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{b._count?.products ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setForm({ id: b.id, name: b.name, logo: b.logo })}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
