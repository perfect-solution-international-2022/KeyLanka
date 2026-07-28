import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requestFingerprint } from "@/lib/request-security";

export async function recordSecurityEvent(params: {
  req?: NextRequest;
  actorUserId?: number | null;
  action: string;
  targetType?: string;
  targetId?: string | number;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.securityAuditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId === undefined ? undefined : String(params.targetId),
        ipHash: params.req ? requestFingerprint(params.req) : null,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("Security audit logging failed:", error);
  }
}

