import { Prisma, type PrismaClient, type Order } from "@prisma/client";
import { getTransactionStatus, type OnePayTransactionStatus } from "@/lib/onepay";
import { sendMail, renderOrderConfirmationEmail } from "@/lib/mail";
import { formatOrderNumber } from "@/lib/order-number";

export class PaymentVerificationError extends Error {
  constructor(public code: "unavailable" | "mismatch" | "not_found") {
    super(`Payment verification: ${code}`);
    this.name = "PaymentVerificationError";
  }
}

export function transactionMatchesOrder(
  order: Pick<Order, "transactionId" | "total">,
  verification: OnePayTransactionStatus
): boolean {
  return (
    verification.transactionId === order.transactionId &&
    verification.currency === "LKR" &&
    Number.isFinite(verification.amount) &&
    new Prisma.Decimal(verification.amount).equals(order.total)
  );
}

async function sendConfirmation(db: PrismaClient, order: Order) {
  const [items, user] = await Promise.all([
    db.orderItem.findMany({ where: { orderId: order.id } }),
    db.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } }),
  ]);
  if (!user) return;
  await sendMail({
    to: user.email,
    subject: `Order Confirmed — ${formatOrderNumber(order.id)}`,
    html: renderOrderConfirmationEmail({
      name: user.name,
      orderNumber: formatOrderNumber(order.id),
      orderId: order.id,
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price.toString() })),
      total: order.total.toString(),
      shippingAddress: `${order.shippingLine1}, ${order.shippingCity}${
        order.shippingDistrict ? `, ${order.shippingDistrict}` : ""
      }`,
    }),
  });
}

/**
 * Single source of truth for OnePay transaction verification and database synchronization.
 * Atomically transitions an order's payment status to 'paid' in MySQL without modifying its delivery status.
 */
export async function reconcileOnepayOrder(
  db: PrismaClient,
  orderId: number,
  options: {
    source: "webhook" | "return" | "admin" | "expiry" | "reconciliation";
    dryRun?: boolean;
    notify?: boolean;
    verifyTransaction?: (id: string) => Promise<OnePayTransactionStatus>;
    sendConfirmation?: (db: PrismaClient, order: Order) => Promise<void>;
  }
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "onepay") throw new PaymentVerificationError("not_found");
  if (order.paid || !order.transactionId) return { order, changed: false, wouldMarkPaid: false };

  let verification: OnePayTransactionStatus;
  try {
    verification = await (options.verifyTransaction ?? getTransactionStatus)(order.transactionId);
  } catch (err) {
    console.error("OnePay verification unavailable", { orderId, source: options.source, err });
    throw new PaymentVerificationError("unavailable");
  }

  if (!transactionMatchesOrder(order, verification)) {
    console.error("OnePay transaction mismatch", {
      orderId,
      source: options.source,
      verification,
      orderTotal: order.total,
    });
    throw new PaymentVerificationError("mismatch");
  }

  if (options.dryRun) return { order, changed: false, wouldMarkPaid: verification.paid };

  if (!verification.paid) {
    // Unverified / pending at OnePay. Do not mark paid and never cancel or release stock.
    await db.order.updateMany({
      where: { id: orderId, paid: false, transactionId: order.transactionId },
      data: { paymentStatusMessage: "Payment is not yet verified by OnePay" },
    });
    const current = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    return { order: current, changed: false, wouldMarkPaid: false };
  }

  // Atomically claim settlement. Exactly one caller succeeds (claim.count === 1).
  // Crucially: Delivery status (status) is preserved and NEVER changed.
  const result = await db.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: {
        id: orderId,
        transactionId: order.transactionId,
        total: order.total,
        paymentMethod: "onepay",
        paid: false,
      },
      data: {
        paid: true,
        paymentStatusMessage: "Payment verified by OnePay",
      },
    });

    const current = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

    if (claim.count === 1) {
      await tx.securityAuditLog.create({
        data: {
          actorUserId: order.userId,
          action: "ONEPAY_PAYMENT_VERIFIED",
          targetType: "ORDER",
          targetId: String(orderId),
          metadata: {
            source: options.source,
            transactionId: verification.transactionId,
            amount: verification.amount,
            currency: verification.currency,
            paidOn: verification.paidOn,
          },
        },
      });
    }

    return { order: current, changed: claim.count === 1, wouldMarkPaid: false };
  });

  // Only the winning settlement sends mail, after successful commit.
  if (result.changed && options.notify !== false && !result.order.deletedAt) {
    try {
      await (options.sendConfirmation ?? sendConfirmation)(db, result.order);
    } catch (err) {
      console.error("OnePay confirmation email failed", { orderId, err });
    }
  }

  return result;
}

/**
 * Reconciles recent unpaid OnePay orders that have a stored transactionId.
 * Safe to call on admin page loads and background jobs.
 */
export async function reconcileUnverifiedOnepayOrders(
  db: PrismaClient,
  options: {
    limit?: number;
    verifyTransaction?: (id: string) => Promise<OnePayTransactionStatus>;
  } = {}
) {
  const pendingOrders = await db.order.findMany({
    where: {
      paymentMethod: "onepay",
      paid: false,
      transactionId: { not: null },
      deletedAt: null,
    },
    take: options.limit ?? 20,
    orderBy: { createdAt: "desc" },
  });

  const results = [];
  for (const o of pendingOrders) {
    try {
      const res = await reconcileOnepayOrder(db, o.id, {
        source: "admin",
        verifyTransaction: options.verifyTransaction,
      });
      results.push({ orderId: o.id, paid: res.order.paid, changed: res.changed });
    } catch {
      // Ignore individual failures so one failing order doesn't block others
    }
  }
  return results;
}

