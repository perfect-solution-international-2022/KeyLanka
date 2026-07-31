"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, X } from "lucide-react";
import { adminApi, AdminAttribute } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FormState {
  id: number | null;
  name: string;
  values: string[];
  valueDraft: string;
}

const EMPTY_FORM: FormState = { id: null, name: "", values: [], valueDraft: "" };

export function AttributesManager() {
  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setAttributes(await adminApi.getAttributes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);

  function addValueDraft() {
    const value = form.valueDraft.trim();
    if (!value || form.values.includes(value)) return;
    setForm((f) => ({ ...f, values: [...f.values, value], valueDraft: "" }));
  }

  function removeValueDraft(value: string) {
    setForm((f) => ({ ...f, values: f.values.filter((v) => v !== value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.updateAttribute(form.id, { name: form.name, addValues: form.values });
        toast.success("Attribute updated");
      } else {
        await adminApi.createAttribute({ name: form.name, values: form.values });
        toast.success("Attribute added");
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    const confirmed = await confirmToast(`Delete "${name}"?`, {
      confirmLabel: "Delete",
      description: "The attribute will move to Trash and can be restored with its values.",
    });
    if (!confirmed) return;
    setError("");
    try {
      await adminApi.deleteAttribute(id);
      toast.success("Attribute moved to Trash");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleDeleteValue(id: number) {
    try {
      await adminApi.deleteAttributeValue(id);
      toast.success("Value deleted");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 h-fit bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{form.id ? "Edit Attribute" : "Add Attribute"}</h3>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="attr-name">Name</Label>
          <Input
            id="attr-name"
            required
            placeholder="e.g. Color"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attr-value">{form.id ? "Add new values" : "Values"}</Label>
          <div className="flex gap-2">
            <Input
              id="attr-value"
              placeholder="e.g. Black"
              value={form.valueDraft}
              onChange={(e) => setForm((f) => ({ ...f, valueDraft: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addValueDraft();
                }
              }}
            />
            <button
              type="button"
              onClick={addValueDraft}
              className="shrink-0 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted"
            >
              Add
            </button>
          </div>
          {form.values.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs text-brand"
                >
                  {value}
                  <button type="button" onClick={() => removeValueDraft(value)} aria-label={`Remove ${value}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          disabled={saving || !form.name.trim()}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
        >
          {saving ? "Saving..." : form.id ? "Save Changes" : "Add Attribute"}
        </button>
      </form>

      <div className="rounded-lg border bg-card overflow-hidden h-fit">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attribute</TableHead>
              <TableHead>Values</TableHead>
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
            ) : attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No attributes yet. Add Color, Size, etc. to enable variable products.
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium align-top">{a.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {a.values.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                        >
                          {v.value}
                          <button
                            type="button"
                            onClick={() => handleDeleteValue(v.id)}
                            aria-label={`Delete ${v.value}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setForm({ id: a.id, name: a.name, values: [], valueDraft: "" })}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.name)}
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
