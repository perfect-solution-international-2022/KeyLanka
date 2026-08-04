import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { getBankTransferSettings } from "@/lib/queries";
import { recordSecurityEvent } from "@/lib/security-audit";

const schema = z.object({
  enabled: z.boolean(),
  bankName: z.string().trim().max(120),
  branchName: z.string().trim().max(120),
  accountName: z.string().trim().max(160),
  accountNumber: z.string().trim().max(80),
}).superRefine((data, ctx) => {
  if (data.enabled && (!data.bankName || !data.branchName || !data.accountName || !data.accountNumber)) {
    ctx.addIssue({ code: "custom", message: "Complete all bank details before enabling bank transfers" });
  }
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getBankTransferSettings());
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bank details" }, { status: 400 });
  }
  const settings = await prisma.bankTransferSettings.upsert({
    where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data },
  });
  await recordSecurityEvent({
    req, actorUserId: auth.userId, action: "ADMIN_BANK_TRANSFER_SETTINGS_CHANGED",
    targetType: "BANK_TRANSFER_SETTINGS", targetId: 1, metadata: { enabled: settings.enabled },
  });
  return NextResponse.json(settings);
}
