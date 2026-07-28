import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

const updateSchema = z.object({
  name: z.string().min(1),
  parentId: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  restricted: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (data.parentId === Number(id)) {
    return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
  }

  const category = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
        image: data.image || null,
        ...(data.restricted !== undefined ? { restricted: data.restricted } : {}),
      },
    });
    // Products only carry their direct category, so a "restricted" flag on a
    // top-level category has to cascade to its children for product listings
    // and category pages to actually enforce it for subcategories too.
    if (data.restricted !== undefined) {
      await tx.category.updateMany({ where: { parentId: updated.id }, data: { restricted: data.restricted } });
    }
    return updated;
  });

  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const categoryId = Number(id);

  const childCount = await prisma.category.count({ where: { parentId: categoryId } });
  if (childCount > 0) {
    return NextResponse.json({ error: "Delete or reassign subcategories first." }, { status: 409 });
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "Cannot delete: category still has products." }, { status: 409 });
    }
    throw err;
  }
}
