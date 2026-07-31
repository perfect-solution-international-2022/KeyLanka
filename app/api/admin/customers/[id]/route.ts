import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security-audit";

const schema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(500).optional(),
}).refine((data) => !data.suspended || Boolean(data.reason), {
  message: "A suspension reason is required",
  path: ["reason"],
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  const parsed = schema.safeParse(await req.json());
  if (!Number.isInteger(id) || id < 1 || !parsed.success) {
    return NextResponse.json({ error: parsed.success ? "Invalid customer" : parsed.error.issues[0]?.message }, { status: 400 });
  }

  const customer = await prisma.user.findFirst({ where: { id, role: "BUYER" }, select: { id: true } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      suspendedAt: parsed.data.suspended ? new Date() : null,
      suspensionReason: parsed.data.suspended ? parsed.data.reason : null,
      sessionVersion: { increment: 1 },
    },
    select: { suspendedAt: true, suspensionReason: true },
  });

  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: parsed.data.suspended ? "ADMIN_CUSTOMER_SUSPENDED" : "ADMIN_CUSTOMER_RESTORED",
    targetType: "USER",
    targetId: id,
    metadata: parsed.data.suspended ? { reason: parsed.data.reason } : undefined,
  });

  return NextResponse.json(updated);
}
