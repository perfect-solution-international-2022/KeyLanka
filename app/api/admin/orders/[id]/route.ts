import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { releaseStock } from "@/lib/inventory";
import { recordSecurityEvent } from "@/lib/security-audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { user: { select: { id: true, name: true, email: true } }, items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const updateSchema = z.object({ status: z.enum(STATUSES) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { id: Number(id) }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.$transaction(async (tx) => {
    // Cancelling releases the stock that was reserved when the order was placed.
    if (parsed.data.status === "cancelled" && existing.status !== "cancelled") {
      await releaseStock(tx, existing.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    }

    return tx.order.update({
      where: { id: Number(id) },
      data: { status: parsed.data.status },
      include: { user: { select: { id: true, name: true, email: true } }, items: true },
    });
  });
  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_ORDER_STATUS_CHANGED",
    targetType: "ORDER",
    targetId: order.id,
    metadata: { from: existing.status, to: order.status },
  });

  return NextResponse.json(order);
}
