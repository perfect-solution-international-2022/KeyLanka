import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    where: { role: "BUYER" },
    include: { orders: { where: { status: "delivered", deletedAt: null }, select: { total: true } } },
    orderBy: { createdAt: "desc" },
  });

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    createdAt: u.createdAt,
    orderCount: u.orders.length,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0),
  }));

  return (
    <AdminShell title="Customers">
      <div>
        <h2 className="text-lg font-semibold">Customers</h2>
        <p className="text-sm text-muted-foreground">{customers.length} registered buyers</p>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{c.orderCount}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(c.totalSpent)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {c.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-2.5 py-1.5 hover:bg-muted"
                  >
                    <Eye size={13} /> View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
