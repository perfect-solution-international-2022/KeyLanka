import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-server";
import { isAuthLocksmithAuthorized } from "@/lib/queries";
import { getRequestScope } from "@/lib/request-scope";

export async function GET(req: NextRequest) {
  const scope = await getRequestScope(req);
  if (scope === "blocked") return NextResponse.json({ error: "Account access is blocked" }, { status: 403 });
  if (!scope) return NextResponse.json([]);
  const items = await prisma.cartItem.findMany({
    where: scope,
    include: { product: true, warranty: true, variant: { include: { values: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

const addSchema = z.object({
  productId: z.number(),
  variantId: z.number().optional(),
  quantity: z.number().min(1).default(1),
  warrantyId: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { productId, variantId, warrantyId, quantity } = parsed.data;

  const scope = await getRequestScope(req);
  if (scope === "blocked") return NextResponse.json({ error: "Account access is blocked" }, { status: 403 });
  if (!scope) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null }, include: { category: true, warranties: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.category.restricted && !(await isAuthLocksmithAuthorized(await verifyAuth(req)))) {
    return NextResponse.json({ error: "This product is restricted to approved Locksmith Merchants" }, { status: 403 });
  }

  if (warrantyId && !product.warranties.some((w) => w.id === warrantyId && w.active)) return NextResponse.json({ error: "Warranty is not available for this product" }, { status: 400 });

  if (product.productType === "Variable Product") {
    if (!variantId) return NextResponse.json({ error: "Select a variation" }, { status: 400 });
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      return NextResponse.json({ error: "Variation not found" }, { status: 404 });
    }
  }

  const existing = await prisma.cartItem.findFirst({ where: { ...scope, productId, variantId: variantId ?? null, warrantyId: warrantyId ?? null } });
  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: product.soldIndividually ? 1 : existing.quantity + quantity },
      include: { product: true, warranty: true, variant: { include: { values: true } } },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { ...scope, productId, variantId: variantId ?? null, warrantyId: warrantyId ?? null, quantity: product.soldIndividually ? 1 : quantity },
      include: { product: true, warranty: true, variant: { include: { values: true } } },
    });
  }
  return NextResponse.json(item, { status: 201 });
}
