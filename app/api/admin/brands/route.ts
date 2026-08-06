import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireCatalogManager } from "@/lib/auth-server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  if (!(await requireCatalogManager(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const brands = await prisma.brand.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(brands);
}

const brandSchema = z.object({
  name: z.string().min(1),
  logo: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  let slug = slugify(data.name);
  let suffix = 0;
  while (await prisma.brand.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(data.name)}-${suffix}`;
  }

  const brand = await prisma.brand.create({ data: { name: data.name, slug, logo: data.logo || null } });
  return NextResponse.json(brand, { status: 201 });
}
