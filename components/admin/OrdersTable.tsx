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
import { Eye } from "lucide-react";
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

type TabValue = "all" | "pending" | "completed" | "cancelled";

function matchesTab(status: string, tab: TabValue) {
  if (tab === "all") return true;
  if (tab === "pending") return status === "pending";
  if (tab === "cancelled") return status === "cancelled";
  // "completed" = anything the admin has accepted and moved past pending, that isn't cancelled
  return status !== "pending" && status !== "cancelled";
}

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("pending");

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => matchesTab(o.status, "pending")).length,
      completed: orders.filter((o) => matchesTab(o.status, "completed")).length,
      cancelled: orders.filter((o) => matchesTab(o.status, "cancelled")).length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => matchesTab(o.status, tab))
      .filter(
        (o) =>
          !q ||
          String(o.id).includes(q) ||
          formatOrderNumber(o.id).toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q)
      );
  }, [orders, search, tab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full min-w-0">
          <TabsList className="w-full overflow-x-auto justify-start">
            <TabsTrigger value="pending" className="shrink-0">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="completed" className="shrink-0">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled" className="shrink-0">Cancelled ({counts.cancelled})</TabsTrigger>
            <TabsTrigger value="all" className="shrink-0">All Orders ({counts.all})</TabsTrigger>
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
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-2.5 py-1.5 hover:bg-muted"
                  >
                    <Eye size={13} /> View
                  </Link>
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
