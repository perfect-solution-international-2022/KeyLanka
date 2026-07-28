import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteExpiredUnpaidOnepayOrders } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Order expiry job is not configured" }, { status: 503 });
  }

  const provided = req.headers.get("authorization") ?? "";
  if (!safeEqual(provided, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteExpiredUnpaidOnepayOrders(prisma);
  return NextResponse.json({ ok: true, ...result });
}
