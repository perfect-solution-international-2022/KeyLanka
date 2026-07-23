import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { prisma } from "@/lib/prisma";
import type { AdminOrder } from "@/lib/admin-api";
import { formatOrderNumber } from "@/lib/order-number";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { user: { select: { id: true, name: true, email: true } }, items: true },
  });

  if (!order) notFound();

  return (
    <AdminShell title={formatOrderNumber(order.id)}>
      <OrderDetail order={serialize<AdminOrder>(order)} />
    </AdminShell>
  );
}
