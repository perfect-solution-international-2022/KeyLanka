import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestScope } from "@/lib/request-scope";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const scope = await getRequestScope(req);
  if (scope === "blocked") return NextResponse.json({ error: "Account access is blocked" }, { status: 403 });
  if (!Number.isInteger(id) || !scope) {
    return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  }
  const item = await prisma.wishlistItem.findFirst({
    where: { id, ...scope },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  await prisma.wishlistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
