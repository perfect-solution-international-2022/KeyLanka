import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a condition name" }, { status: 400 });
  const conditionId = Number(id);
  const slug = slugify(parsed.data.name);
  const owner = await prisma.condition.findUnique({ where: { slug } });
  if (owner && owner.id !== conditionId) return NextResponse.json({ error: "Condition already exists" }, { status: 409 });
  return NextResponse.json(await prisma.condition.update({ where: { id: conditionId }, data: { name: parsed.data.name, slug } }));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const conditionId = Number(id);
  const usage = await prisma.condition.findUnique({ where: { id: conditionId }, include: { _count: { select: { products: true, variants: true } } } });
  if (!usage) return NextResponse.json({ error: "Condition not found" }, { status: 404 });
  if (usage._count.products + usage._count.variants > 0) return NextResponse.json({ error: "Remove this condition from products and variations before deleting it" }, { status: 409 });
  await prisma.condition.delete({ where: { id: conditionId } });
  return NextResponse.json({ ok: true });
}
