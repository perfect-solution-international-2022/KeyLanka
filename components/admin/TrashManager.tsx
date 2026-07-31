"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { confirmToast } from "@/lib/confirm-toast";
import { formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface TrashOrder {
  id: number;
  status: string;
  total: string;
  deletedAt: string;
  user: { name: string; email: string };
}

export interface TrashProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  deletedAt: string;
  category: { name: string };
}

export interface SimpleTrashItem {
  id: number;
  name: string;
  deletedAt: string;
  type: "category" | "brand" | "service" | "attribute" | "attributeValue";
}

export function TrashManager({ orders, products, otherItems }: { orders: TrashOrder[]; products: TrashProduct[]; otherItems: SimpleTrashItem[] }) {
  const router = useRouter();
  const [restoring, setRestoring] = useState<string | null>(null);

  async function restore(type: "order" | "product", id: number, label: string) {
    const confirmed = await confirmToast(`Restore ${label}?`, {
      confirmLabel: "Restore",
      description: `This ${type} will return to its normal list.`,
    });
    if (!confirmed) return;

    const key = `${type}-${id}`;
    setRestoring(key);
    try {
      await adminApi.restoreTrashItem(type, id);
      toast.success(`${type === "order" ? "Order" : "Product"} restored`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  }

  async function restoreOther(item: SimpleTrashItem) {
    const confirmed = await confirmToast(`Restore “${item.name}”?`, {
      confirmLabel: "Restore",
      description: "This item will return to its normal admin list and storefront where applicable.",
    });
    if (!confirmed) return;
    const key = `${item.type}-${item.id}`;
    setRestoring(key);
    try {
      await adminApi.restoreTrashItem(item.type, item.id);
      toast.success("Item restored");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Deleted Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} orders in Trash</p>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Deleted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell><Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{formatOrderNumber(order.id)}</Link></TableCell>
                  <TableCell><div>{order.user.name}</div><div className="text-xs text-muted-foreground">{order.user.email}</div></TableCell>
                  <TableCell className="capitalize">{order.status}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{new Date(order.deletedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><button disabled={restoring === `order-${order.id}`} onClick={() => restore("order", order.id, formatOrderNumber(order.id))} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"><RotateCcw size={13} /> Restore</button></TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No deleted orders.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Deleted Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} products in Trash</p>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Deleted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{new Date(product.deletedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><button disabled={restoring === `product-${product.id}`} onClick={() => restore("product", product.id, `“${product.name}”`)} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"><RotateCcw size={13} /> Restore</button></TableCell>
                </TableRow>
              ))}
              {products.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No deleted products.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Other Deleted Items</h2><p className="text-sm text-muted-foreground">{otherItems.length} items in Trash</p></div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Deleted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {otherItems.map((item) => (
                <TableRow key={`${item.type}-${item.id}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.type.replace("attributeValue", "attribute value")}</TableCell>
                  <TableCell>{new Date(item.deletedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><button disabled={restoring === `${item.type}-${item.id}`} onClick={() => restoreOther(item)} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"><RotateCcw size={13} /> Restore</button></TableCell>
                </TableRow>
              ))}
              {otherItems.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No other deleted items.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
