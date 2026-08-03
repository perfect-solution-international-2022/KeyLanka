"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConeIcon, RefreshCwIcon } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MaintenanceSettingsForm({
  initialEnabled,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialMessage: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [confirmCacheClear, setConfirmCacheClear] = useState(false);
  const [lastClearedAt, setLastClearedAt] = useState<string | null>(null);

  async function save(nextEnabled: boolean) {
    setSaving(true);
    try {
      const saved = await adminApi.updateMaintenanceSettings({ enabled: nextEnabled, message });
      setEnabled(saved.enabled);
      toast.success(saved.enabled ? "Coming Soon mode turned on" : "Coming Soon mode turned off");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update maintenance mode");
    } finally {
      setSaving(false);
    }
  }

  async function handleMessageSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await adminApi.updateMaintenanceSettings({ enabled, message });
      setMessage(saved.message ?? "");
      toast.success("Message updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update message");
    } finally {
      setSaving(false);
    }
  }

  async function clearCache() {
    setClearingCache(true);
    try {
      const result = await adminApi.clearSiteCache();
      setLastClearedAt(result.clearedAt);
      setConfirmCacheClear(false);
      toast.success("Site cache cleared successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear site cache");
    } finally {
      setClearingCache(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-brand">
            <ConeIcon size={20} />
          </div>
          <div>
            <h2 className="font-semibold">Coming Soon mode</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When turned on, visitors see a Coming Soon page instead of the store. Admins can still log in and
              manage the site as usual.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium">{enabled ? "Site is in Coming Soon mode" : "Site is live"}</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? "Only admins can browse the store." : "Everyone can browse the store."}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={(checked) => { setEnabled(checked); save(checked); }} disabled={saving} />
        </div>

        <form onSubmit={handleMessageSave} className="mt-6">
          <label htmlFor="maintenanceMessage" className="mb-2 block text-sm font-medium">
            Coming Soon message (optional)
          </label>
          <textarea
            id="maintenanceMessage"
            rows={3}
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="We're putting the finishing touches on something great. Check back soon!"
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Message"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <RefreshCwIcon size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Site cache</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh all cached pages and tagged site data. Visitors will receive the latest content as each page is
              requested again.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {lastClearedAt
                  ? `Last cleared ${new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(lastClearedAt))}`
                  : "No cache clear has been run in this session."}
              </p>
              <button
                type="button"
                onClick={() => setConfirmCacheClear(true)}
                disabled={clearingCache}
                className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                <RefreshCwIcon size={16} />
                Clear Site Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={confirmCacheClear}
        onOpenChange={(open) => {
          if (!clearingCache) setConfirmCacheClear(open);
        }}
      >
        <DialogContent showCloseButton={!clearingCache}>
          <DialogHeader>
            <DialogTitle>Clear the entire site cache?</DialogTitle>
            <DialogDescription>
              This refreshes all cached pages and maintenance settings. The first request to each page may be a little
              slower while fresh content is generated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmCacheClear(false)}
              disabled={clearingCache}
              className="rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearCache}
              disabled={clearingCache}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              <RefreshCwIcon size={16} className={clearingCache ? "animate-spin" : undefined} />
              {clearingCache ? "Clearing..." : "Yes, Clear Cache"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
