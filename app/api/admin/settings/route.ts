import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { getStoreSettings } from "@/lib/queries";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await getStoreSettings();
  return NextResponse.json(settings);
}

const schema = z.object({ wholesaleMinQty: z.number().int().min(1) });

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid value" }, { status: 400 });

  const settings = await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: { wholesaleMinQty: parsed.data.wholesaleMinQty },
    create: { id: 1, wholesaleMinQty: parsed.data.wholesaleMinQty },
  });

  return NextResponse.json(settings);
}
