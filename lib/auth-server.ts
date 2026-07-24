import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = "token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

export type Role = "BUYER" | "ADMIN";

export interface TokenPayload {
  userId: number;
  role: Role;
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

export function getUserId(req: NextRequest): number | null {
  return getAuth(req)?.userId ?? null;
}

export function requireAdmin(req: NextRequest): TokenPayload | null {
  const auth = getAuth(req);
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
    secure: false,
    maxAge: MAX_AGE,
    path: "/",
  };
}

export { COOKIE_NAME };
