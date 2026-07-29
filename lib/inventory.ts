import { Prisma, PrismaClient } from "@prisma/client";
import { getTransactionStatus, type OnePayTransactionStatus } from "@/lib/onepay";

type TxClient = Prisma.TransactionClient | PrismaClient;

export class InsufficientStockError extends Error {
  constructor(public productName: string) {
    super(`Not enough stock for "${productName}"`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Atomically decrements stock for each item, all-or-nothing.
 * Each decrement is a single `UPDATE ... WHERE stock >= quantity`, which MySQL
 * serializes at the row level — this is what actually prevents two concurrent
 * checkouts from both succeeding for the last unit, not just an application-level
 * read-then-write check (which would race).
 *
 * Must be called with a transaction client (prisma.$transaction) so that if any
 * item lacks stock, prior decrements in the same order are rolled back too.
 */
export async function reserveStock(
  tx: TxClient,
  items: { productId: number; variantId?: number | null; quantity: number; name?: string; allowBackorder?: boolean }[]
) {
  for (const item of items) {
    if (item.variantId) {
      if (item.allowBackorder) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
        continue;
      }
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { sku: true } });
        throw new InsufficientStockError(item.name ?? variant?.sku ?? `variant #${item.variantId}`);
      }
      continue;
    }

    if (item.allowBackorder) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      continue;
    }
    const result = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (result.count === 0) {
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
      throw new InsufficientStockError(item.name ?? product?.name ?? `product #${item.productId}`);
    }
  }
}

/** Reverses a previous reserveStock call, e.g. when a payment ultimately fails. */
export async function releaseStock(
  tx: TxClient,
  items: { productId: number; variantId?: number | null; quantity: number }[]
) {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
      continue;
    }
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

const STALE_ORDER_MINUTES = 30;

/**
 * OnePay orders are created (and stock reserved) before the customer reaches
 * OnePay, since we can't reserve stock only on payment success without risking
 * overselling the last unit. If the customer abandons checkout — closes the tab,
 * hits back — instead of returning to /checkout/onepay-return, no webhook or
 * return-page visit ever fires, so the order would sit as "pending" forever and
 * its stock would stay locked.
 *
 * A stale order is verified with OnePay before deletion. If OnePay cannot be
 * reached, or says the transaction was paid, the order is left untouched. This
 * avoids deleting a paid order merely because its webhook was delayed.
 */
export async function deleteExpiredUnpaidOnepayOrders(
  prisma: PrismaClient,
  options: {
    now?: Date;
    verifyTransaction?: (transactionId: string) => Promise<OnePayTransactionStatus>;
  } = {}
) {
  const now = options.now ?? new Date();
  const verifyTransaction = options.verifyTransaction ?? getTransactionStatus;
  const cutoff = new Date(now.getTime() - STALE_ORDER_MINUTES * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { paymentMethod: "onepay", paid: false, status: "pending", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  let deleted = 0;
  let paid = 0;
  let verificationFailed = 0;

  for (const order of stale) {
    if (order.transactionId) {
      try {
        const verification = await verifyTransaction(order.transactionId);
        const identityMatches = verification.transactionId === order.transactionId;
        const amountMatches = Math.abs(verification.amount - Number(order.total)) < 0.005;
        if (!identityMatches || !amountMatches || verification.currency !== "LKR") {
          verificationFailed += 1;
          continue;
        }
        if (verification.paid) {
          paid += 1;
          continue;
        }
      } catch {
        verificationFailed += 1;
        continue;
      }
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, paid: false, status: "pending" },
        data: { status: "expiring" },
      });
      if (claimed.count === 1) {
        await releaseStock(
          tx,
          order.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }))
        );
        await tx.securityAuditLog.create({
          data: {
            actorUserId: order.userId,
            action: "ONEPAY_ORDER_EXPIRED_DELETED",
            targetType: "ORDER",
            targetId: String(order.id),
            metadata: {
              transactionId: order.transactionId,
              expiredAfterMinutes: STALE_ORDER_MINUTES,
            },
          },
        });
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        await tx.order.delete({ where: { id: order.id } });
        deleted += 1;
      }
    });
  }

  return { checked: stale.length, deleted, paid, verificationFailed };
}
