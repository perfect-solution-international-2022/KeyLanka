"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { adminApi, AdminCategory } from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormState {
  id: number | null;
  name: string;
  parentId: string;
  image: string | null;
}

const EMPTY_FORM: FormState = { id: null, name: "", parentId: "", image: null };

export function CategoriesManager() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setCategories(await adminApi.getCategories());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const topLevel = categories.filter((c) => !c.parentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      parentId: form.parentId ? Number(form.parentId) : null,
      image: form.image,
    };
    try {
      if (form.id) {
        await adminApi.updateCategory(form.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: AdminCategory) {
    setForm({ id: c.id, name: c.name, parentId: c.parentId ? String(c.parentId) : "", image: c.image });
    setError("");
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await adminApi.deleteCategory(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 h-fit bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{form.id ? "Edit Category" : "Add Category"}</h3>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-parent">Parent Category</Label>
          <select
            id="cat-parent"
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            className="w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-transparent"
          >
            <option value="">None (top-level)</option>
            {topLevel
              .filter((c) => c.id !== form.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label className="mb-2 block">Image</Label>
          <ImageUploader images={form.image ? [form.image] : []} onChange={(imgs) => setForm((f) => ({ ...f, image: imgs[0] ?? null }))} />
        </div>
        <button
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
        >
          {saving ? "Saving..." : form.id ? "Save Changes" : "Add Category"}
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          topLevel.map((cat) => (
            <div key={cat.id} className="border rounded-lg overflow-hidden bg-card">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat._count?.products ?? 0} products
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {(cat.children ?? []).length > 0 && (
                <ul className="divide-y">
                  {cat.children!.map((sub) => {
                    const full = categories.find((c) => c.id === sub.id) ?? sub;
                    return (
                      <li key={sub.id} className="flex items-center justify-between px-4 py-2 pl-8 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{full.name}</span>
                          <span className="text-xs text-muted-foreground">{full._count?.products ?? 0} products</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(full)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
