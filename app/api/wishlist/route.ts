import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";

async function scopeFilter(req: NextRequest) {
  const userId = await getUserId(req);
  if (userId) return { userId };
  const sessionId = req.headers.get("x-session-id");
  if (sessionId && z.string().uuid().safeParse(sessionId).success) return { sessionId };
  return null;
}

export async function GET(req: NextRequest) {
  const scope = await scopeFilter(req);
  if (!scope) return NextResponse.json([]);
  const items = await prisma.wishlistItem.findMany({
    where: scope,
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

const addSchema = z.object({ productId: z.number() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { productId } = parsed.data;

  const scope = await scopeFilter(req);
  if (!scope) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const existing = await prisma.wishlistItem.findFirst({ where: { ...scope, productId } });
  if (existing) return NextResponse.json(existing);

  const item = await prisma.wishlistItem.create({
    data: { ...scope, productId },
    include: { product: true },
  });
  return NextResponse.json(item, { status: 201 });
}
