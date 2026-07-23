import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mergeGuestData } from "@/lib/queries";
import { signToken, authCookieOptions, COOKIE_NAME } from "@/lib/auth-server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const sessionId = req.headers.get("x-session-id");
  await mergeGuestData(sessionId, user.id);

  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.cookies.set(COOKIE_NAME, signToken({ userId: user.id, role: user.role }), authCookieOptions());
  return res;
}
