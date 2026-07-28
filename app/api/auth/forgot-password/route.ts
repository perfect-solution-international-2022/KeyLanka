import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth-server";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email().transform((value) => value.trim().toLowerCase()) });

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, "auth-forgot-password", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const identityLimit = await checkRateLimit(
    req,
    "auth-forgot-password-identity",
    { limit: 3, windowMs: 60 * 60 * 1000 },
    parsed.data.email
  );
  if (identityLimit.limited) return rateLimitResponse(identityLimit.retryAfter);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  if (user) {
    const token = signResetToken(user.id, user.passwordHash);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const resetUrl = `${appUrl}/account/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your Key Lanka password",
      html: renderPasswordResetEmail(user.name, resetUrl),
    });
  }

  return NextResponse.json({ ok: true });
}
