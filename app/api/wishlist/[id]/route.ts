import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const userId = await getUserId(req);
  const sessionId = req.headers.get("x-session-id");
  const guestSession =
    sessionId && z.string().uuid().safeParse(sessionId).success ? sessionId : null;
  if (!Number.isInteger(id) || (!userId && !guestSession)) {
    return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  }
  const item = await prisma.wishlistItem.findFirst({
    where: { id, ...(userId ? { userId } : { sessionId: guestSession! }) },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  await prisma.wishlistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
