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
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    include: { children: { where: { deletedAt: null } }, _count: { select: { products: { where: { deletedAt: null } } } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(categories);
}

const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  restricted: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  let slug = slugify(data.name);
  let suffix = 0;
  while (await prisma.category.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(data.name)}-${suffix}`;
  }

  // A new subcategory inherits its parent's restriction by default, so it
  // doesn't accidentally leak locksmith-only products through an unrestricted
  // subcategory.
  let restricted = data.restricted ?? false;
  if (data.parentId && data.restricted === undefined) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { restricted: true } });
    restricted = parent?.restricted ?? false;
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      parentId: data.parentId ?? null,
      image: data.image || null,
      restricted,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
