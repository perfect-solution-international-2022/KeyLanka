import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerAccountActions } from "@/components/admin/CustomerAccountActions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = Number(id);
  const [customer, completedSummary, activeOrderCount] = await Promise.all([
  prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      suspendedAt: true,
      suspensionReason: true,
      locksmithStatus: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      locksmithApplication: { select: { businessName: true, status: true, createdAt: true } },
      securityAuditLogs: { select: { id: true, action: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 },
      _count: { select: { cartItems: true, wishlistItems: true } },
      orders: {
        where: { deletedAt: null },
        select: { id: true, status: true, total: true, createdAt: true, items: { select: { quantity: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  }),
  prisma.order.aggregate({
    where: { userId: customerId, status: "delivered", deletedAt: null },
    _count: { _all: true },
    _sum: { total: true },
  }),
  prisma.order.count({ where: { userId: customerId, deletedAt: null } }),
  ]);
  if (!customer || customer.role !== "BUYER") notFound();

  const completedOrderCount = completedSummary._count._all;
  const totalSpent = Number(completedSummary._sum.total ?? 0);

  return (
    <AdminShell title={customer.name}>
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft size={15} /> Back to Customers
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={customer.suspendedAt ? "destructive" : "outline"}>{customer.suspendedAt ? "Suspended" : "Active"}</Badge>
        <Badge variant="secondary">Customer ID #{customer.id}</Badge>
        {customer.locksmithStatus && <Badge variant="secondary" className="capitalize">Locksmith: {customer.locksmithStatus}</Badge>}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Customer</div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
          <div className="text-sm text-muted-foreground">{customer.phone ?? "—"}</div>
          <div className="mt-2 text-xs text-muted-foreground">Joined {customer.createdAt.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Completed Orders</div>
          <div className="text-2xl font-semibold">{completedOrderCount}</div>
          <div className="text-xs text-muted-foreground">{activeOrderCount} total active orders</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
          <div className="text-2xl font-semibold">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground mb-1">Saved Activity</div>
          <div className="text-sm"><span className="font-semibold">{customer._count.cartItems}</span> cart items</div>
          <div className="text-sm"><span className="font-semibold">{customer._count.wishlistItems}</span> wishlist items</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CustomerAccountActions customerId={customer.id} suspendedAt={customer.suspendedAt?.toISOString() ?? null} suspensionReason={customer.suspensionReason} />

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="font-medium">Saved Addresses</div>
          {customer.addresses.map((address) => (
            <div key={address.id} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <div className="font-medium">{address.fullName} {address.isDefault && <span className="text-xs text-brand">(Default)</span>}</div>
              <div className="text-muted-foreground">{address.line1}, {address.city}</div>
              <div className="text-muted-foreground">{address.phone}</div>
            </div>
          ))}
          {customer.addresses.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses.</p>}
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="font-medium">Account Activity</div>
          {customer.securityAuditLogs.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="break-words">{event.action.replaceAll("_", " ").toLowerCase()}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{event.createdAt.toLocaleDateString()}</span>
            </div>
          ))}
          {customer.securityAuditLogs.length === 0 && <p className="text-sm text-muted-foreground">No security activity recorded.</p>}
          {customer.locksmithApplication && (
            <div className="border-t pt-3 text-sm">
              <div className="font-medium">{customer.locksmithApplication.businessName}</div>
              <div className="capitalize text-muted-foreground">Locksmith application: {customer.locksmithApplication.status}</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-3"><div className="font-medium">Recent Orders</div><div className="text-xs text-muted-foreground">Showing the latest {Math.min(activeOrderCount, 50)} orders</div></div>
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
