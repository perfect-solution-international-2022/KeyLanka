import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { getMaintenanceSettings } from "@/lib/queries";
import { recordSecurityEvent } from "@/lib/security-audit";
import { revalidatePath, revalidateTag } from "next/cache";

const schema = z.object({
  enabled: z.boolean(),
  message: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getMaintenanceSettings());
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid maintenance settings" }, { status: 400 });
  }

  const settings = await prisma.maintenanceSettings.upsert({
    where: { id: 1 },
    update: { enabled: parsed.data.enabled, message: parsed.data.message ?? null },
    create: { id: 1, enabled: parsed.data.enabled, message: parsed.data.message ?? null },
  });
  revalidateTag("maintenance-settings", { expire: 0 });
  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_MAINTENANCE_MODE_CHANGED",
    targetType: "MAINTENANCE_SETTINGS",
    targetId: 1,
    metadata: { enabled: parsed.data.enabled },
  });
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  revalidatePath("/", "layout");
  revalidateTag("maintenance-settings", { expire: 0 });

  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_SITE_CACHE_CLEARED",
    targetType: "SITE_CACHE",
    metadata: {},
  });

  return NextResponse.json(
    { ok: true, clearedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
