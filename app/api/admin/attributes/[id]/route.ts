import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  addValues: z.array(z.string().min(1)).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const attribute = await prisma.attribute.update({
    where: { id: Number(id) },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.addValues?.length ? { values: { create: data.addValues.map((value) => ({ value })) } } : {}),
    },
    include: { values: true },
  });
  return NextResponse.json(attribute);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  try {
    await prisma.attribute.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "Cannot delete: attribute values are still used by product variants." }, { status: 409 });
    }
    throw err;
  }
}
