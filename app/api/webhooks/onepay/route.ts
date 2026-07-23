import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOnePaySuccessStatus, OnePayWebhookPayload } from "@/lib/onepay";
import { releaseStock } from "@/lib/inventory";
import { formatOrderNumber } from "@/lib/order-number";
import { sendMail, renderOrderConfirmationEmail } from "@/lib/mail";

/**
 * OnePay server-to-server payment notification.
 *
 * Documented payload (docs.onepay.lk/api-documentation/payment-api):
 *   { transaction_id, status, status_message, additional_data }
 *
 * CAVEAT: OnePay's public docs do not document a signature/secret for this
 * webhook, so this endpoint cannot cryptographically verify the sender.
 * As a mitigation, updates are only applied to orders that (a) were created
 * with paymentMethod "onepay", (b) are not already marked paid, and (c) can
 * be matched to an order we actually created via OnePay — first by the
 * ipg_transaction_id we stored at checkout-link creation time, falling back
 * to the orderId embedded in additional_data. If OnePay confirms a webhook
 * secret/header exists, wire it in here before relying on this in production.
 */
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as OnePayWebhookPayload | null;
  if (!payload || !payload.transaction_id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let order = await prisma.order.findUnique({ where: { transactionId: payload.transaction_id } });

  if (!order) {
    let orderId: number | null = null;
    try {
      const parsed = payload.additional_data ? JSON.parse(payload.additional_data) : null;
      if (parsed?.orderId) orderId = Number(parsed.orderId);
    } catch {
      // additional_data wasn't JSON we recognize
    }
    order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null;
  }

  if (!order || order.paymentMethod !== "onepay") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paid || order.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const success = isOnePaySuccessStatus(payload.status);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order!.id },
      data: {
        transactionId: payload.transaction_id,
        paymentStatusMessage: payload.status_message,
        paid: success,
        status: success ? "processing" : "cancelled",
      },
    });

    if (!success) {
      const items = await tx.orderItem.findMany({ where: { orderId: order!.id } });
      await releaseStock(tx, items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    }
  });

  if (success) {
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
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price.toString() })),
          total: order.total.toString(),
          shippingAddress: `${order.shippingLine1}, ${order.shippingCity}${order.shippingDistrict ? `, ${order.shippingDistrict}` : ""}`,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
