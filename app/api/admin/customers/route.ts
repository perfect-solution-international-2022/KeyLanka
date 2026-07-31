import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, orderSummaries] = await Promise.all([
    prisma.user.findMany({
      where: { role: "BUYER" },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, suspendedAt: true, suspensionReason: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { status: "delivered", deletedAt: null },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);
  const summaryByUser = new Map(orderSummaries.map((summary) => [summary.userId, summary]));

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
    suspendedAt: u.suspendedAt,
    suspensionReason: u.suspensionReason,
    orderCount: summaryByUser.get(u.id)?._count._all ?? 0,
    totalSpent: Number(summaryByUser.get(u.id)?._sum.total ?? 0).toFixed(2),
  }));

  return NextResponse.json(customers);
}
