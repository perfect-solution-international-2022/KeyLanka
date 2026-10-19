import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PaymentVerificationError, reconcileOnepayOrder } from "@/lib/onepay-payment";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";
const callbackSchema = z.object({ transaction_id: z.string().trim().min(1).max(191) });

/**
 * OnePay webhook callback handler.
 * OnePay's callback is only used as a trigger; payment authenticity is verified
 * independently from OnePay's transaction-status API before marking paid.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, "onepay-webhook", { limit: 60, windowMs: 60 * 1000 });
    if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

    const parsed = callbackSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { transactionId: parsed.data.transaction_id } });
    if (!order || order.paymentMethod !== "onepay") {
      // Retryable if callback arrives before transactionId persistence finishes
      return NextResponse.json({ error: "Transaction not yet available" }, { status: 503, headers: { "Retry-After": "10" } });
    }

    if (order.paid) {
      return NextResponse.json({ ok: true, verifiedPaid: true, alreadyProcessed: true });
    }

    try {
      const result = await reconcileOnepayOrder(prisma, order.id, { source: "webhook" });
      return NextResponse.json({
        ok: true,
        verifiedPaid: result.order.paid,
        alreadyProcessed: !result.changed && result.order.paid,
      });
    } catch (error) {
      await recordSecurityEvent({
        req,
        action: "ONEPAY_VERIFICATION_FAILED",
        targetType: "ORDER",
        targetId: order.id,
        metadata: { reason: error instanceof PaymentVerificationError ? error.code : "database" },
      });
      throw error;
    }
  } catch (error) {
    const mismatch = error instanceof PaymentVerificationError && error.code === "mismatch";
    console.error("OnePay callback could not be processed", {
      reason: mismatch ? "mismatch" : "unavailable",
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: mismatch ? "Transaction details do not match" : "Unable to verify transaction" },
      { status: mismatch ? 409 : 503, headers: { "Retry-After": "10" } }
    );
  }
}
