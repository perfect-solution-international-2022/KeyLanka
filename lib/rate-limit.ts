import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestFingerprint } from "@/lib/request-security";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  req: NextRequest,
  scope: string,
  options: RateLimitOptions,
  identifier?: string
) {
  const now = new Date();
  const key = `${scope}:${requestFingerprint(req, identifier)}`;

  return prisma.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });
    const windowExpired =
      !bucket || now.getTime() - bucket.windowStart.getTime() >= options.windowMs;

    if (windowExpired) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, windowStart: now },
        create: { key, count: 1, windowStart: now },
      });
      return { limited: false, remaining: options.limit - 1, retryAfter: 0 };
    }

    const retryAfter = Math.max(
      1,
      Math.ceil((options.windowMs - (now.getTime() - bucket.windowStart.getTime())) / 1000)
    );
    if (bucket.count >= options.limit) {
      return { limited: true, remaining: 0, retryAfter };
    }

    await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { limited: false, remaining: options.limit - bucket.count - 1, retryAfter };
  });
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
