import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";
import { reconcileOnepayOrder } from "@/lib/onepay-payment";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: Number(id), userId, deletedAt: null },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const limit = await checkRateLimit(req, "onepay-verification", { limit: 20, windowMs: 60_000 }, String(userId));
  if (limit.limited) return rateLimitResponse(limit.retryAfter);

  if (order.paymentMethod !== "onepay" || order.paid) {
    return NextResponse.json({ paid: order.paid });
  }

  try {
    const result = await reconcileOnepayOrder(prisma, order.id, { source: "return" });
    return NextResponse.json({ paid: result.order.paid }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Payment verification is temporarily unavailable. Please check again." },
      { status: 503, headers: { "Retry-After": "10", "Cache-Control": "no-store" } }
    );
  }
}

