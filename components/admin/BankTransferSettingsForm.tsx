"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = { enabled: boolean; bankName: string; branchName: string; accountName: string; accountNumber: string };

export function BankTransferSettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const saved = await adminApi.updateBankTransferSettings(form);
      setForm(saved); toast.success("Bank transfer settings updated");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings"); }
    finally { setSaving(false); }
  }
  const field = (key: keyof Omit<Settings, "enabled">, label: string) => (
    <div className="space-y-1.5"><Label htmlFor={key}>{label}</Label><Input id={key} value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} /></div>
  );
  return <form onSubmit={save} className="max-w-2xl space-y-5 rounded-xl border bg-card p-6">
    <div><h2 className="font-semibold">Locksmith Bank Transfer</h2><p className="mt-1 text-sm text-muted-foreground">Available only to approved locksmith members.</p></div>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((v) => ({ ...v, enabled: e.target.checked }))} className="h-4 w-4 accent-brand" />Enable bank transfer at checkout</label>
    <div className="grid gap-4 sm:grid-cols-2">{field("bankName", "Bank Name")}{field("branchName", "Branch Name")}{field("accountName", "Account Name")}{field("accountNumber", "Account Number")}</div>
    <button disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save Bank Details"}</button>
  </form>;
}
