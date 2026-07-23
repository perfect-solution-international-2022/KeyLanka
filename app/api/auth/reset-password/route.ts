import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/auth-server";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Decode without verifying the fingerprint first, just to find the user.
  const decoded = decodeUnverified(parsed.data.token);
  if (!decoded) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const userId = verifyResetToken(parsed.data.token, user.passwordHash);
  if (!userId) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}

function decodeUnverified(token: string): { userId: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return typeof payload.userId === "number" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
