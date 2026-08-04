import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.policy.findMany({ orderBy: { key: "asc" } }));
}
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ key: z.enum(["terms", "privacy", "refund", "warranty"]), title: z.string().trim().min(1).max(160), content: z.string().trim().min(1) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid policy" }, { status: 400 });
  const { key, ...data } = parsed.data;
  return NextResponse.json(await prisma.policy.upsert({ where: { key }, create: { key, ...data }, update: { ...data, version: { increment: 1 } } }));
}
