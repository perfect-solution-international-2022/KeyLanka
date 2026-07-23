import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

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
