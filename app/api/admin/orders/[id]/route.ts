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
  if (existing.deletedAt) return NextResponse.json({ error: "Orders in Trash cannot be changed" }, { status: 409 });

  const order = await prisma.$transaction(async (tx) => {
    // Cancelling releases the stock that was reserved when the order was placed.
    if (parsed.data.status === "cancelled" && existing.status !== "cancelled") {
      await releaseStock(tx, existing.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })));
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id: Number(id) }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.deletedAt) {
    return NextResponse.json({ error: "Orders in Trash cannot be deleted" }, { status: 409 });
  }

  const shouldCancel = existing.status !== "cancelled" && existing.status !== "delivered";
  const order = await prisma.$transaction(async (tx) => {
    if (shouldCancel) {
      await releaseStock(tx, existing.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })));
    }
    return tx.order.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), ...(shouldCancel ? { status: "cancelled" } : {}) },
      include: { user: { select: { id: true, name: true, email: true } }, items: true },
    });
  });

  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_ORDER_MOVED_TO_TRASH",
    targetType: "ORDER",
    targetId: order.id,
    metadata: { previousStatus: existing.status, status: order.status, stockReleased: shouldCancel },
  });

  return NextResponse.json(order);
}
