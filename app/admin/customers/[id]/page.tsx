import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: { orders: { where: { deletedAt: null }, include: { items: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!customer || customer.role !== "BUYER") notFound();

  const completedOrders = customer.orders.filter((o) => o.status === "delivered");
  const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <AdminShell title={customer.name}>
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft size={15} /> Back to Customers
      </Link>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Customer</div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
          <div className="text-sm text-muted-foreground">{customer.phone ?? "—"}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Completed Orders</div>
          <div className="text-2xl font-semibold">{completedOrders.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
          <div className="text-2xl font-semibold">{formatCurrency(totalSpent)}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customer.orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{formatOrderNumber(o.id)}</TableCell>
                <TableCell>{o.items.reduce((sum, i) => sum + i.quantity, 0)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className="capitalize">
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(Number(o.total))}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {o.createdAt.toLocaleDateString()}
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
            {customer.orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  This customer hasn&apos;t placed any orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
