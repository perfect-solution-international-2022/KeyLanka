import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.condition.findMany({
    include: { _count: { select: { products: true, variants: true } } },
    orderBy: { name: "asc" },
  }));
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a condition name" }, { status: 400 });
  const slug = slugify(parsed.data.name);
  if (!slug) return NextResponse.json({ error: "Enter a valid condition name" }, { status: 400 });
  if (await prisma.condition.findUnique({ where: { slug } })) return NextResponse.json({ error: "Condition already exists" }, { status: 409 });
  return NextResponse.json(await prisma.condition.create({ data: { name: parsed.data.name, slug } }), { status: 201 });
}
