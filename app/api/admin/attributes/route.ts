import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const attributes = await prisma.attribute.findMany({
    where: { deletedAt: null },
    include: { values: { where: { deletedAt: null }, orderBy: { value: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(attributes);
}

const createSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).default([]),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  let slug = slugify(data.name);
  let suffix = 0;
  while (await prisma.attribute.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(data.name)}-${suffix}`;
  }

  const attribute = await prisma.attribute.create({
    data: {
      name: data.name,
      slug,
      values: { create: data.values.map((value) => ({ value })) },
    },
    include: { values: true },
  });
  return NextResponse.json(attribute, { status: 201 });
}
