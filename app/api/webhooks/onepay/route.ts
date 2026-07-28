import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, OnePayWebhookPayload } from "@/lib/onepay";
import { formatOrderNumber } from "@/lib/order-number";
import { sendMail, renderOrderConfirmationEmail } from "@/lib/mail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";

/**
 * OnePay's callback is only used as a trigger. The documented callback has no
 * signature, so payment state is fetched independently from OnePay's
 * transaction-status endpoint before an order is marked paid.
 */
export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, "onepay-webhook", { limit: 60, windowMs: 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const payload = (await req.json().catch(() => null)) as OnePayWebhookPayload | null;
  if (!payload || typeof payload.transaction_id !== "string" || !payload.transaction_id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Never trust additional_data to select an order. Only the OnePay ID saved
  // during checkout may identify the local record.
  const order = await prisma.order.findUnique({ where: { transactionId: payload.transaction_id } });
  if (!order || order.paymentMethod !== "onepay") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paid) return NextResponse.json({ ok: true, alreadyProcessed: true });

  let verification;
  try {
    verification = await getTransactionStatus(order.transactionId!);
  } catch {
    await recordSecurityEvent({
      req,
      action: "ONEPAY_VERIFICATION_FAILED",
      targetType: "ORDER",
      targetId: order.id,
    });
    return NextResponse.json({ error: "Unable to verify transaction" }, { status: 503 });
  }

  const amountMatches = Math.abs(verification.amount - Number(order.total)) < 0.005;
  const identityMatches = verification.transactionId === order.transactionId;
  if (!identityMatches || !amountMatches || verification.currency !== "LKR") {
    await recordSecurityEvent({
      req,
      action: "ONEPAY_VERIFICATION_MISMATCH",
      targetType: "ORDER",
      targetId: order.id,
      metadata: { identityMatches, amountMatches, currency: verification.currency },
    });
    return NextResponse.json({ error: "Transaction details do not match" }, { status: 409 });
  }

  // A forged failure callback must not cancel the order or release stock.
  if (!verification.paid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatusMessage: "Payment is not yet verified by OnePay" },
    });
    return NextResponse.json({ ok: true, verifiedPaid: false });
  }

  const updated = await prisma.order.updateMany({
    where: { id: order.id, paid: false },
    data: {
      paymentStatusMessage: payload.status_message || "Payment verified by OnePay",
      paid: true,
      status: "processing",
    },
  });

  if (updated.count === 1) {
    await recordSecurityEvent({
      req,
      actorUserId: order.userId,
      action: "ONEPAY_PAYMENT_VERIFIED",
      targetType: "ORDER",
      targetId: order.id,
    });
    const [items, user] = await Promise.all([
      prisma.orderItem.findMany({ where: { orderId: order.id } }),
      prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } }),
    ]);
    if (user) {
      await sendMail({
        to: user.email,
        subject: `Order Confirmed — ${formatOrderNumber(order.id)}`,
        html: renderOrderConfirmationEmail({
          name: user.name,
          orderNumber: formatOrderNumber(order.id),
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price.toString(),
          })),
          total: order.total.toString(),
          shippingAddress: `${order.shippingLine1}, ${order.shippingCity}${
            order.shippingDistrict ? `, ${order.shippingDistrict}` : ""
          }`,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true, verifiedPaid: true });
}
