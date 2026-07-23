import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth-server";
import { sendMail, renderPasswordResetEmail } from "@/lib/mail";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

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
