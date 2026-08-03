"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export function ShippingSettingsForm({ initialCost }: { initialCost: number }) {
  const [shippingCost, setShippingCost] = useState(String(initialCost));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(shippingCost);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid shipping cost");
      return;
    }

    setSaving(true);
    try {
      const saved = await adminApi.updateShippingSettings({ shippingCost: value });
      setShippingCost(String(Number(saved.shippingCost)));
      toast.success("Shipping cost updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update shipping cost");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Truck size={20} />
        </div>
        <div>
          <h2 className="font-semibold">Store shipping cost</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This amount is added to every order and charged through checkout. Set it to 0 for free shipping.
          </p>
        </div>
      </div>

      <label htmlFor="shippingCost" className="mb-2 block text-sm font-medium">
        Island-wide shipping cost (Rs.)
      </label>
      <input
        id="shippingCost"
        type="number"
        min="0"
        step="0.01"
        required
        value={shippingCost}
        onChange={(event) => setShippingCost(event.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Shipping Cost"}
        </button>
      </div>
    </form>
  );
}
