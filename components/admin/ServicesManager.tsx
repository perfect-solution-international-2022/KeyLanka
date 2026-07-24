"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, X, ChevronDown } from "lucide-react";
import { adminApi, AdminService } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_ICON_OPTIONS, getIconByName } from "@/lib/service-icon-options";
import { confirmToast } from "@/lib/confirm-toast";

interface FormState {
  id: number | null;
  title: string;
  description: string;
  icon: string | null;
}

const EMPTY_FORM: FormState = { id: null, title: "", description: "", icon: null };

function IconPicker({ value, onChange }: { value: string | null; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SERVICE_ICON_OPTIONS;
    return SERVICE_ICON_OPTIONS.filter((o) => o.name.toLowerCase().includes(q));
  }, [search]);

  const SelectedIcon = getIconByName(value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 border border-input rounded-lg px-3 py-2 text-sm bg-transparent h-9"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          {SelectedIcon ? <SelectedIcon size={16} className="text-foreground" /> : null}
          {value ?? "Choose an icon (optional)"}
        </span>
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="mt-2 border rounded-lg p-2 bg-card">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 mb-2"
            autoFocus
          />
          <div className="grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filtered.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`h-9 w-9 flex items-center justify-center rounded-md border hover:border-brand hover:text-brand ${
                  value === name ? "border-brand text-brand bg-brand-light" : "border-transparent text-muted-foreground"
                }`}
              >
                <Icon size={17} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-6 text-xs text-muted-foreground text-center py-4">No icons match &quot;{search}&quot;</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServicesManager() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setServices(await adminApi.getServices());
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
        await adminApi.updateService(form.id, { title: form.title, description: form.description, icon: form.icon });
        toast.success("Service updated");
      } else {
        await adminApi.createService({ title: form.title, description: form.description, icon: form.icon });
        toast.success("Service added");
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    const confirmed = await confirmToast(`Delete "${title}"?`, {
      confirmLabel: "Delete",
      description: "This cannot be undone.",
    });
    if (!confirmed) return;
    setError("");
    try {
      await adminApi.deleteService(id);
      toast.success("Service deleted");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 h-fit bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{form.id ? "Edit Service" : "Add Service"}</h3>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="svc-title">Title</Label>
          <Input id="svc-title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-desc">Description</Label>
          <textarea
            id="svc-desc"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Icon</Label>
          <IconPicker value={form.icon} onChange={(name) => setForm((f) => ({ ...f, icon: name }))} />
        </div>
        <button
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
        >
          {saving ? "Saving..." : form.id ? "Save Changes" : "Add Service"}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          services.map((s) => {
            const SIcon = getIconByName(s.icon);
            return (
            <div key={s.id} className="border rounded-lg p-4 bg-card flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0">
                  {SIcon ? <SIcon size={16} /> : <span className="text-xs text-muted-foreground">—</span>}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium">{s.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setForm({ id: s.id, title: s.title, description: s.description, icon: s.icon })}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.title)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
