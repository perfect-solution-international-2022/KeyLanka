"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminApi, AdminOrder } from "@/lib/admin-api";
import { formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";
import { confirmToast } from "@/lib/confirm-toast";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
};

export function OrderDetail({ order: initial }: { order: AdminOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(status: string) {
    if (status === "cancelled") {
      const confirmed = await confirmToast(`Cancel ${formatOrderNumber(order.id)}?`, {
        confirmLabel: "Cancel Order",
        description: "The customer's stock reservation will be released.",
      });
      if (!confirmed) return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updateOrderStatus(order.id, status);
      setOrder(updated);
      toast.success(status === "cancelled" ? "Order cancelled" : "Order accepted");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-4xl">
      <div className="space-y-4">
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="px-4 py-3 border-b font-medium text-sm">Items</div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground text-xs">Qty {item.quantity}</div>
                </div>
                <div>{formatCurrency(Number(item.price) * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Shipping</span>
            <span>{Number(order.shippingCost) === 0 ? "Free" : formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="px-4 py-3 border-t flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="border rounded-lg bg-card p-4 text-sm space-y-1">
          <div className="font-medium mb-2">Shipping</div>
          <div>{order.shippingName}</div>
          <div>{order.shippingLine1}</div>
          <div>
            {order.shippingCity}
            {order.shippingDistrict ? `, ${order.shippingDistrict}` : ""}
            {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
          </div>
          <div>{order.shippingPhone}</div>
          <div className="text-muted-foreground capitalize pt-1">
            Payment: {order.paymentMethod.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg bg-card p-4 text-sm space-y-1">
          <div className="font-medium mb-2">Customer</div>
          <div>{order.user.name}</div>
          <div className="text-muted-foreground">{order.user.email}</div>
        </div>

        <div className="border rounded-lg bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"} className="capitalize">
              {order.status}
            </Badge>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          {order.status === "pending" ? (
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={() => handleStatusChange("processing")}
                className="flex-1 flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium py-2 rounded-md"
              >
                <CheckCircle2 size={15} /> Accept
              </button>
              <button
                disabled={saving}
                onClick={() => handleStatusChange("cancelled")}
                className="flex-1 flex items-center justify-center gap-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-60 text-sm font-medium py-2 rounded-md"
              >
                <XCircle size={15} /> Cancel
              </button>
            </div>
          ) : order.status !== "cancelled" ? (
            <button
              disabled={saving}
              onClick={() => handleStatusChange("cancelled")}
              className="w-full flex items-center justify-center gap-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-60 text-sm font-medium py-2 rounded-md"
            >
              <XCircle size={15} /> Cancel Order
            </button>
          ) : null}

          <p className="text-xs text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
