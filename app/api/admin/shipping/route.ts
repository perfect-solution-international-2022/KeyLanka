import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { getShippingSettings } from "@/lib/queries";
import { recordSecurityEvent } from "@/lib/security-audit";

const schema = z.object({
  shippingCost: z.number().min(0).max(99999999.99),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getShippingSettings());
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid shipping cost" }, { status: 400 });
  }

  const settings = await prisma.shippingSettings.upsert({
    where: { id: 1 },
    update: { shippingCost: parsed.data.shippingCost },
    create: { id: 1, shippingCost: parsed.data.shippingCost },
  });
  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_SHIPPING_COST_CHANGED",
    targetType: "SHIPPING_SETTINGS",
    targetId: 1,
    metadata: { shippingCost: parsed.data.shippingCost },
  });
  return NextResponse.json(settings);
}
