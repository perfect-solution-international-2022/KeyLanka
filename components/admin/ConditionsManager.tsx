"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, AdminCondition } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConditionsManager() {
  const [items, setItems] = useState<AdminCondition[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() { setItems(await adminApi.getConditions()); }
  useEffect(() => { queueMicrotask(() => void refresh()); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await adminApi.updateCondition(editingId, { name: name.trim() });
      else await adminApi.createCondition({ name: name.trim() });
      toast.success(editingId ? "Condition updated" : "Condition added");
      setName(""); setEditingId(null); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save condition"); }
    finally { setSaving(false); }
  }

  async function remove(item: AdminCondition) {
    if (!await confirmToast(`Delete “${item.name}”?`, { confirmLabel: "Delete", description: "Conditions currently assigned to products cannot be deleted." })) return;
    try { await adminApi.deleteCondition(item.id); toast.success("Condition deleted"); await refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete condition"); }
  }

  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <form onSubmit={submit} className="h-fit space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{editingId ? "Edit Condition" : "Add Condition"}</h3>{editingId && <button type="button" onClick={() => { setEditingId(null); setName(""); }}><X size={16}/></button>}</div>
      <div className="space-y-1.5"><Label htmlFor="condition-name">Name</Label><Input id="condition-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New or Used"/></div>
      <button disabled={saving || !name.trim()} className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Save Changes" : "Add Condition"}</button>
    </form>
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium"><span>Condition</span><span>Assigned</span><span>Actions</span></div>
      {items.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No conditions yet. Add New, Used, etc.</p> : items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-0"><span className="font-medium">{item.name}</span><span className="text-sm text-muted-foreground">{(item._count?.products ?? 0) + (item._count?.variants ?? 0)}</span><div className="flex gap-1"><button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setEditingId(item.id); setName(item.name); }} className="rounded p-2 hover:bg-muted"><Pencil size={15}/></button><button type="button" aria-label={`Delete ${item.name}`} onClick={() => void remove(item)} className="rounded p-2 text-destructive hover:bg-muted"><Trash2 size={15}/></button></div></div>)}
    </div>
  </div>;
}
