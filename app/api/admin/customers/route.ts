import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    role: u.role,
    createdAt: u.createdAt,
    orderCount: u.orders.length,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2),
  }));

  return NextResponse.json(customers);
}
