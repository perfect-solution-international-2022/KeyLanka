import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mergeGuestData } from "@/lib/queries";
import { signToken, authCookieOptions, COOKIE_NAME } from "@/lib/auth-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
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
  if (user.suspendedAt) {
    await recordSecurityEvent({
      req,
      actorUserId: user.id,
      action: "AUTH_LOGIN_BLOCKED_SUSPENDED",
      targetType: "USER",
      targetId: user.id,
    });
    return NextResponse.json({ error: "This account has been suspended. Contact support for assistance." }, { status: 403 });
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
