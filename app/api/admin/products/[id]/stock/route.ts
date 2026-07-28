import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

const schema = z.object({ stock: z.number().int().min(0) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: { stock: parsed.data.stock },
  });

  return NextResponse.json(product);
}
