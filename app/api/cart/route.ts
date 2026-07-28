import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId, verifyAuth } from "@/lib/auth-server";
import { isAuthLocksmithAuthorized } from "@/lib/queries";

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

  const scope = await scopeFilter(req);
  if (!scope) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.category.restricted && !(await isAuthLocksmithAuthorized(await verifyAuth(req)))) {
    return NextResponse.json({ error: "This product is restricted to approved Locksmith Merchants" }, { status: 403 });
  }

  const existing = await prisma.cartItem.findFirst({ where: { ...scope, productId } });
  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: product.soldIndividually ? 1 : existing.quantity + quantity },
      include: { product: true },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { ...scope, productId, quantity: product.soldIndividually ? 1 : quantity },
      include: { product: true },
    });
  }
  return NextResponse.json(item, { status: 201 });
}
