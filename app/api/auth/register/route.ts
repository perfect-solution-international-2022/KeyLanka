import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mergeGuestData } from "@/lib/queries";
import { signToken, authCookieOptions, COOKIE_NAME } from "@/lib/auth-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(10)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, "auth-register", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;
  const identityLimit = await checkRateLimit(
    req,
    "auth-register-identity",
    { limit: 3, windowMs: 60 * 60 * 1000 },
    data.email
  );
  if (identityLimit.limited) return rateLimitResponse(identityLimit.retryAfter);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, phone: data.phone },
  });

  const sessionId = req.headers.get("x-session-id");
  await mergeGuestData(sessionId, user.id);

  const res = NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    { status: 201 }
  );
  res.cookies.set(
    COOKIE_NAME,
    signToken({ userId: user.id, role: user.role, sessionVersion: user.sessionVersion }),
    authCookieOptions()
  );
  return res;
}
