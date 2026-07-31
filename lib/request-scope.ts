import { z } from "zod";
import type { NextRequest } from "next/server";
import { getAuth, verifyAuth } from "@/lib/auth-server";

export type RequestScope = { userId: number } | { sessionId: string };

export async function getRequestScope(req: NextRequest): Promise<RequestScope | "blocked" | null> {
  const tokenAuth = getAuth(req);
  if (tokenAuth) {
    const verified = await verifyAuth(req);
    return verified ? { userId: verified.userId } : "blocked";
  }

  const sessionId = req.headers.get("x-session-id");
  if (sessionId && z.string().uuid().safeParse(sessionId).success) return { sessionId };
  return null;
}
