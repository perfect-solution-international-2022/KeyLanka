import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ name: z.string().trim().min(1).max(120), days: z.number().int().min(0), price: z.number().min(0), active: z.boolean() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid warranty" }, { status: 400 });
  return NextResponse.json(await prisma.warranty.update({ where: { id: Number((await params).id) }, data: parsed.data }));
}
