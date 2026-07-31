"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";

export function CustomerAccountActions({ customerId, suspendedAt, suspensionReason }: {
  customerId: number;
  suspendedAt: string | null;
  suspensionReason: string | null;
}) {
  const router = useRouter();
  const suspended = Boolean(suspendedAt);
  const [reason, setReason] = useState(suspensionReason ?? "");
  const [saving, setSaving] = useState(false);

  async function updateSuspension() {
    if (!suspended && !reason.trim()) {
      toast.error("Enter a reason before suspending this customer");
      return;
    }
    const confirmed = await confirmToast(suspended ? "Restore this customer account?" : "Suspend this customer account?", {
      confirmLabel: suspended ? "Restore Account" : "Suspend Account",
      description: suspended
        ? "The customer will be able to sign in again."
        : "Active sessions will be invalidated and account APIs, cart, wishlist and checkout access will be blocked.",
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      await adminApi.setCustomerSuspension(customerId, !suspended, reason.trim());
      toast.success(suspended ? "Customer account restored" : "Customer account suspended");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <div className="font-medium">Account Access</div>
        <p className="text-xs text-muted-foreground">
          {suspended ? `Suspended ${new Date(suspendedAt!).toLocaleString()}` : "This customer account is active."}
        </p>
      </div>
      {!suspended && (
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3}
          placeholder="Reason for suspension (required)"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
      )}
      {suspended && suspensionReason && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm"><span className="font-medium">Reason:</span> {suspensionReason}</p>
      )}
      <button type="button" disabled={saving} onClick={updateSuspension}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${suspended ? "bg-green-600 text-white hover:bg-green-700" : "bg-destructive text-white hover:bg-destructive/90"}`}>
        {suspended ? <ShieldCheck size={16} /> : <Ban size={16} />}
        {suspended ? "Restore Account" : "Suspend Customer"}
      </button>
    </div>
  );
}
