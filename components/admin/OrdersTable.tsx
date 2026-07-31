"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";
import type { AdminOrder } from "@/lib/admin-api";
import { formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
};

type TabValue = "all" | "pending" | "completed" | "cancelled" | "trash";

function matchesTab(order: AdminOrder, tab: TabValue) {
  if (tab === "trash") return Boolean(order.deletedAt);
  if (order.deletedAt) return false;
  if (tab === "all") return true;
  if (tab === "pending") return order.status === "pending";
  if (tab === "cancelled") return order.status === "cancelled";
  return order.status === "delivered";
}

export function OrdersTable({ orders, initialTab = "pending" }: { orders: AdminOrder[]; initialTab?: TabValue }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  const counts = useMemo(
    () => ({
      all: orders.filter((o) => matchesTab(o, "all")).length,
      pending: orders.filter((o) => matchesTab(o, "pending")).length,
      completed: orders.filter((o) => matchesTab(o, "completed")).length,
      cancelled: orders.filter((o) => matchesTab(o, "cancelled")).length,
      trash: orders.filter((o) => matchesTab(o, "trash")).length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => matchesTab(o, tab))
      .filter(
        (o) =>
          !q ||
          String(o.id).includes(q) ||
          formatOrderNumber(o.id).toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q)
      );
  }, [orders, search, tab]);

  async function moveToTrash(order: AdminOrder) {
    const confirmed = await confirmToast(`Move ${formatOrderNumber(order.id)} to Trash?`, {
      confirmLabel: "Move to Trash",
      description: "The order will be retained and cannot be permanently deleted from Trash.",
    });
    if (!confirmed) return;
    setDeletingId(order.id);
    try {
      await adminApi.moveOrderToTrash(order.id);
      toast.success("Order moved to Trash");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move order to Trash");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full min-w-0">
          <TabsList className="w-full overflow-x-auto justify-start">
            <TabsTrigger value="pending" className="shrink-0">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="completed" className="shrink-0">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled" className="shrink-0">Cancelled ({counts.cancelled})</TabsTrigger>
            <TabsTrigger value="all" className="shrink-0">All Orders ({counts.all})</TabsTrigger>
            <TabsTrigger value="trash" className="shrink-0">Trash ({counts.trash})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search by order #, name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:max-w-xs"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{formatOrderNumber(o.id)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{o.user.name}</span>
                    <span className="text-xs text-muted-foreground">{o.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>{o.items.reduce((sum, i) => sum + i.quantity, 0)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className="capitalize">
                      {o.status}
                    </Badge>
                    {o.paymentMethod === "onepay" && !o.paid && o.status !== "cancelled" && (
                      <Badge variant="destructive">Unpaid</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-2.5 py-1.5 hover:bg-muted"
                    >
                      <Eye size={13} /> View
                    </Link>
                    {!o.deletedAt && (
                      <button
                        type="button"
                        disabled={deletingId === o.id}
                        onClick={() => moveToTrash(o)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium border border-destructive/30 text-destructive rounded-md px-2.5 py-1.5 hover:bg-destructive/10 disabled:opacity-60"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders in this tab.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
