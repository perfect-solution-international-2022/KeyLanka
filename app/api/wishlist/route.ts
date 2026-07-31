import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestScope } from "@/lib/request-scope";

export async function GET(req: NextRequest) {
  const scope = await getRequestScope(req);
  if (scope === "blocked") return NextResponse.json({ error: "Account access is blocked" }, { status: 403 });
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

  const scope = await getRequestScope(req);
  if (scope === "blocked") return NextResponse.json({ error: "Account access is blocked" }, { status: 403 });
  if (!scope) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const existing = await prisma.wishlistItem.findFirst({ where: { ...scope, productId } });
  if (existing) return NextResponse.json(existing);

  const item = await prisma.wishlistItem.create({
    data: { ...scope, productId },
    include: { product: true },
  });
  return NextResponse.json(item, { status: 201 });
}
