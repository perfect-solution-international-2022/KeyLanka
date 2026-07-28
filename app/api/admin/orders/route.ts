import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { expireStaleOnepayOrders } from "@/lib/inventory";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await expireStaleOnepayOrders(prisma);

  const orders = await prisma.order.findMany({
    include: { user: { select: { id: true, name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
