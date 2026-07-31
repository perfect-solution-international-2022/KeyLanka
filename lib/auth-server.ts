import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters");
  }
  return secret;
})();
const COOKIE_NAME = "token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

export type Role = "BUYER" | "ADMIN";

export interface TokenPayload {
  userId: number;
  role: Role;
  sessionVersion: number;
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuth(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function verifyAuth(req: NextRequest): Promise<TokenPayload | null> {
  const auth = getAuth(req);
  if (!auth || !Number.isInteger(auth.sessionVersion)) return null;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, sessionVersion: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt || user.sessionVersion !== auth.sessionVersion) return null;
  return { userId: auth.userId, role: user.role, sessionVersion: user.sessionVersion };
}

export async function getUserId(req: NextRequest): Promise<number | null> {
  return (await verifyAuth(req))?.userId ?? null;
}

export async function requireAdmin(req: NextRequest): Promise<TokenPayload | null> {
  const auth = await verifyAuth(req);
  return auth?.role === "ADMIN" ? auth : null;
}

// For use in Server Components, which don't have a NextRequest — reads the
// auth cookie via next/headers instead.
export async function getServerAuth(): Promise<TokenPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getVerifiedServerAuth(): Promise<TokenPayload | null> {
  const auth = await getServerAuth();
  if (!auth || !Number.isInteger(auth.sessionVersion)) return null;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, sessionVersion: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt || user.sessionVersion !== auth.sessionVersion) return null;
  return { userId: auth.userId, role: user.role, sessionVersion: user.sessionVersion };
}

// Password-reset tokens are stateless JWTs (no extra DB table). A fingerprint
// of the user's current passwordHash is embedded so the token is invalidated
// the moment the password actually changes, even before its 1h expiry.
function passwordFingerprint(passwordHash: string) {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function signResetToken(userId: number, passwordHash: string) {
  return jwt.sign({ userId, purpose: "reset", fp: passwordFingerprint(passwordHash) }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

export function verifyResetToken(token: string, currentPasswordHash: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; purpose: string; fp: string };
    if (payload.purpose !== "reset") return null;
    if (payload.fp !== passwordFingerprint(currentPasswordHash)) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  };
}

export { COOKIE_NAME };
