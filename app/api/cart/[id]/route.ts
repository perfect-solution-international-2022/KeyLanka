import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";

async function ownsItem(req: NextRequest, id: number) {
  const userId = await getUserId(req);
  const sessionId = req.headers.get("x-session-id");
  const guestSession =
    sessionId && z.string().uuid().safeParse(sessionId).success ? sessionId : null;
  if (!userId && !guestSession) return null;
  return prisma.cartItem.findFirst({
    where: { id, ...(userId ? { userId } : { sessionId: guestSession! }) },
    include: { product: true },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  const parsed = z.object({ quantity: z.number().int().min(1).max(999) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const currentItem = await ownsItem(req, id);
  if (!currentItem) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  const item = await prisma.cartItem.update({
    where: { id },
    data: { quantity: currentItem.product.soldIndividually ? 1 : parsed.data.quantity },
    include: { product: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !(await ownsItem(req, id))) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }
  await prisma.cartItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
