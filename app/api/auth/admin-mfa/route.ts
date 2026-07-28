import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminLoginCode } from "@/lib/admin-mfa";
import { authCookieOptions, COOKIE_NAME, signToken } from "@/lib/auth-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";

const schema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });

  const rateLimit = await checkRateLimit(
    req,
    "admin-mfa",
    { limit: 6, windowMs: 15 * 60 * 1000 },
    parsed.data.challengeId
  );
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const challenge = await prisma.adminLoginChallenge.findUnique({
    where: { id: parsed.data.challengeId },
    include: { user: true },
  });
  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= 5 ||
    challenge.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 401 });
  }

  if (!verifyAdminLoginCode(challenge.id, parsed.data.code, challenge.codeHash)) {
    await prisma.adminLoginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    await recordSecurityEvent({
      req,
      actorUserId: challenge.userId,
      action: "ADMIN_MFA_FAILED",
      targetType: "USER",
      targetId: challenge.userId,
    });
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 401 });
  }

  await prisma.adminLoginChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });
  const user = challenge.user;
  const res = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locksmithStatus: user.locksmithStatus,
  });
  res.cookies.set(
    COOKIE_NAME,
    signToken({ userId: user.id, role: user.role, sessionVersion: user.sessionVersion }),
    authCookieOptions()
  );
  await recordSecurityEvent({
    req,
    actorUserId: user.id,
    action: "ADMIN_MFA_SUCCEEDED",
    targetType: "USER",
    targetId: user.id,
  });
  return res;
}
