import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [pendingOrders, pendingLocksmith] = await Promise.all([
    prisma.order.count({ where: { status: "pending" } }),
    prisma.locksmithApplication.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({ pendingOrders, pendingLocksmith });
}
