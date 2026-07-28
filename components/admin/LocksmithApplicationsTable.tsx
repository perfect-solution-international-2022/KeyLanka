"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, FileText, ExternalLink, Ban, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi, AdminLocksmithApplication } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  disabled: "outline",
};

type TabValue = "pending" | "approved" | "rejected" | "disabled" | "all";

function docName(url: string) {
  try {
    return new URL(url, "http://keylanka.local").searchParams.get("name") ?? url.split("/").pop() ?? url;
  } catch {
    return url.split("/").pop() ?? url;
  }
}

function isPdf(url: string) {
  try {
    return new URL(url, "http://keylanka.local").searchParams.get("type") === "pdf";
  } catch {
    return url.toLowerCase().endsWith(".pdf");
  }
}

export function LocksmithApplicationsTable({ applications: initial }: { applications: AdminLocksmithApplication[] }) {
  const [applications, setApplications] = useState(initial);
  const [tab, setTab] = useState<TabValue>("pending");
  const [rejecting, setRejecting] = useState<AdminLocksmithApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      disabled: applications.filter((a) => a.status === "disabled").length,
      all: applications.length,
    }),
    [applications]
  );

  const filtered = useMemo(
    () => (tab === "all" ? applications : applications.filter((a) => a.status === tab)),
    [applications, tab]
  );

  async function approve(app: AdminLocksmithApplication) {
    setError("");
    try {
      const updated = await adminApi.updateLocksmithApplicationStatus(app.id, "approved");
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  }

  async function disable(app: AdminLocksmithApplication) {
    const confirmed = await confirmToast(`Disable ${app.fullName}'s Locksmith Merchant access?`, {
      confirmLabel: "Disable",
      description: "They'll immediately lose access to locksmith-only categories and products.",
    });
    if (!confirmed) return;
    setError("");
    try {
      const updated = await adminApi.updateLocksmithApplicationStatus(app.id, "disabled");
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable");
    }
  }

  async function reEnable(app: AdminLocksmithApplication) {
    const confirmed = await confirmToast(`Re-enable ${app.fullName}'s Locksmith Merchant access?`, {
      confirmLabel: "Re-enable",
    });
    if (!confirmed) return;
    setError("");
    try {
      const updated = await adminApi.updateLocksmithApplicationStatus(app.id, "approved");
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-enable");
    }
  }

  async function submitRejection() {
    if (!rejecting) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updateLocksmithApplicationStatus(rejecting.id, "rejected", rejectionReason);
      setApplications((prev) => prev.map((a) => (a.id === rejecting.id ? { ...a, ...updated } : a)));
      setRejecting(null);
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full min-w-0">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="pending" className="shrink-0">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved" className="shrink-0">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected" className="shrink-0">Rejected ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="disabled" className="shrink-0">Disabled ({counts.disabled})</TabsTrigger>
          <TabsTrigger value="all" className="shrink-0">All ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Applied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((app) => {
              const docs = [
                { label: "ID Front", url: app.nationalIdFront },
                { label: "ID Back", url: app.nationalIdBack },
                { label: "Utility Bill", url: app.utilityBillDoc },
                ...app.businessRegDocs.map((url, i) => ({ label: `Business Doc ${i + 1}`, url })),
              ];
              return (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{app.fullName}</span>
                      <span className="text-xs text-muted-foreground">{app.email}</span>
                      <span className="text-xs text-muted-foreground">{app.mobileNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[180px]">
                      <span>{app.businessName}</span>
                      <span className="text-xs text-muted-foreground truncate">{app.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {docs.map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setPreviewDoc(d)}
                          className="inline-flex items-center gap-1 text-xs text-brand hover:underline text-left"
                          title={docName(d.url)}
                        >
                          <FileText size={12} /> {d.label}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status] ?? "secondary"} className="capitalize">
                      {app.status}
                    </Badge>
                    {app.status === "rejected" && app.rejectionReason && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-[160px]">{app.rejectionReason}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => approve(app)}
                          className="inline-flex items-center gap-1 text-xs font-medium border border-green-200 text-green-700 rounded-md px-2 py-1.5 hover:bg-green-50"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejecting(app);
                            setRejectionReason("");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium border border-destructive/30 text-destructive rounded-md px-2 py-1.5 hover:bg-destructive/10"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    ) : app.status === "approved" ? (
                      <button
                        onClick={() => disable(app)}
                        className="inline-flex items-center gap-1 text-xs font-medium border border-destructive/30 text-destructive rounded-md px-2 py-1.5 hover:bg-destructive/10"
                      >
                        <Ban size={13} /> Disable
                      </button>
                    ) : app.status === "disabled" ? (
                      <button
                        onClick={() => reEnable(app)}
                        className="inline-flex items-center gap-1 text-xs font-medium border border-green-200 text-green-700 rounded-md px-2 py-1.5 hover:bg-green-50"
                      >
                        <RotateCcw size={13} /> Re-enable
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Rejected</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No applications in this tab.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Optionally let {rejecting?.fullName} know why their Locksmith Merchant application was rejected.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Reason (optional)"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-transparent"
          />
          <button
            onClick={submitRejection}
            disabled={saving}
            className="w-full bg-destructive hover:bg-destructive/90 disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
          >
            {saving ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{previewDoc?.label}</span>
            </DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <>
              <div className="rounded-lg border bg-muted/30 overflow-hidden max-h-[70vh]">
                {isPdf(previewDoc.url) ? (
                  <div className="flex min-h-48 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                    PDFs are downloaded instead of rendered in the browser for security.
                  </div>
                ) : (
                  <Image
                    src={previewDoc.url}
                    alt={previewDoc.label}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-auto max-h-[70vh] w-full object-contain"
                  />
                )}
              </div>
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand"
              >
                <ExternalLink size={12} /> {isPdf(previewDoc.url) ? "Download document" : "Open original in a new tab"}
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
