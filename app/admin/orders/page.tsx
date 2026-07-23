import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { prisma } from "@/lib/prisma";
import type { AdminOrder } from "@/lib/admin-api";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: { select: { id: true, name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Orders">
      <div>
        <h2 className="text-lg font-semibold">Orders</h2>
        <p className="text-sm text-muted-foreground">{orders.length} orders placed</p>
      </div>
      <OrdersTable orders={serialize<AdminOrder[]>(orders)} />
    </AdminShell>
  );
}
