import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mergeGuestData } from "@/lib/queries";
import { signToken, authCookieOptions, COOKIE_NAME } from "@/lib/auth-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import crypto from "crypto";
import { generateAdminLoginCode, hashAdminLoginCode } from "@/lib/admin-mfa";
import { renderAdminLoginCodeEmail, sendMail } from "@/lib/mail";
import { recordSecurityEvent } from "@/lib/security-audit";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, "auth-login", { limit: 8, windowMs: 15 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;
  const identityLimit = await checkRateLimit(
    req,
    "auth-login-identity",
    { limit: 8, windowMs: 15 * 60 * 1000 },
    data.email
  );
  if (identityLimit.limited) return rateLimitResponse(identityLimit.retryAfter);

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) {
    await recordSecurityEvent({ req, action: "AUTH_LOGIN_FAILED" });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    await recordSecurityEvent({ req, actorUserId: user.id, action: "AUTH_LOGIN_FAILED" });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.mustResetPassword) {
    await recordSecurityEvent({
      req,
      actorUserId: user.id,
      action: "AUTH_PASSWORD_RESET_REQUIRED",
      targetType: "USER",
      targetId: user.id,
    });
    return NextResponse.json(
      { error: "This account requires a password reset before login" },
      { status: 403 }
    );
  }

  if (user.role === "ADMIN") {
    const challengeId = crypto.randomUUID();
    const code = generateAdminLoginCode();
    await prisma.$transaction([
      prisma.adminLoginChallenge.deleteMany({ where: { userId: user.id } }),
      prisma.adminLoginChallenge.create({
        data: {
          id: challengeId,
          userId: user.id,
          codeHash: hashAdminLoginCode(challengeId, code),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);
    const delivered = await sendMail({
      to: user.email,
      subject: "Key Lanka Admin login code",
      html: renderAdminLoginCodeEmail(user.name, code),
    });
    if (!delivered && process.env.NODE_ENV === "production") {
      await prisma.adminLoginChallenge.delete({ where: { id: challengeId } });
      return NextResponse.json({ error: "Unable to send the admin verification code" }, { status: 503 });
    }
    await recordSecurityEvent({
      req,
      actorUserId: user.id,
      action: "ADMIN_MFA_CHALLENGE_CREATED",
      targetType: "USER",
      targetId: user.id,
    });
    return NextResponse.json({
      mfaRequired: true,
      challengeId,
      ...(process.env.NODE_ENV !== "production" && !delivered ? { developmentCode: code } : {}),
    });
  }

  const sessionId = req.headers.get("x-session-id");
  await mergeGuestData(sessionId, user.id);

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
  await recordSecurityEvent({ req, actorUserId: user.id, action: "AUTH_LOGIN_SUCCEEDED" });
  return res;
}
