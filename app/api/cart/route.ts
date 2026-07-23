import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";

function scopeFilter(req: NextRequest) {
  const userId = getUserId(req);
  if (userId) return { userId };
  const sessionId = req.headers.get("x-session-id");
  if (sessionId) return { sessionId };
  return null;
}

export async function GET(req: NextRequest) {
  const scope = scopeFilter(req);
  if (!scope) return NextResponse.json([]);
  const items = await prisma.cartItem.findMany({
    where: scope,
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

const addSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { productId, quantity } = parsed.data;

  const scope = scopeFilter(req);
  if (!scope) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const existing = await prisma.cartItem.findFirst({ where: { ...scope, productId } });
  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { product: true },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { ...scope, productId, quantity },
      include: { product: true },
    });
  }
  return NextResponse.json(item, { status: 201 });
}
