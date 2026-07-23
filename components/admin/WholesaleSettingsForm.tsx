"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WholesaleSettingsForm({ initialMinQty }: { initialMinQty: number }) {
  const router = useRouter();
  const [minQty, setMinQty] = useState(String(initialMinQty));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const value = Number(minQty);
    if (!Number.isInteger(value) || value < 1) {
      setError("Enter a whole number of at least 1.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSettings({ wholesaleMinQty: value });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg bg-card p-4 space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <div className="space-y-1.5">
        <Label htmlFor="minQty">Minimum quantity to activate wholesale price</Label>
        <Input
          id="minQty"
          type="number"
          min={1}
          value={minQty}
          onChange={(e) => setMinQty(e.target.value)}
          className="max-w-[160px]"
        />
        <p className="text-xs text-muted-foreground">
          Example: if this is set to 10, a product priced at Rs. 1,800 with a wholesale price of Rs. 1,500 will
          charge Rs. 1,500 per unit once the customer&apos;s quantity reaches 10.
        </p>
      </div>
      <button
        disabled={saving}
        className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
