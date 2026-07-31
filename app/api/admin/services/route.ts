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
  const services = await prisma.service.findMany({ where: { deletedAt: null }, orderBy: { id: "asc" } });
  return NextResponse.json(services);
}

const serviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  let slug = slugify(data.title);
  let suffix = 0;
  while (await prisma.service.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(data.title)}-${suffix}`;
  }

  const service = await prisma.service.create({
    data: { title: data.title, slug, description: data.description, icon: data.icon || null },
  });
  return NextResponse.json(service, { status: 201 });
}
