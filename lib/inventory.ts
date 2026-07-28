import { Prisma, PrismaClient } from "@prisma/client";

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
  items: { productId: number; quantity: number; name?: string; allowBackorder?: boolean }[]
) {
  for (const item of items) {
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
export async function releaseStock(tx: TxClient, items: { productId: number; quantity: number }[]) {
  for (const item of items) {
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
 * its stock would stay locked. This sweeps those out on each admin orders fetch.
 */
export async function expireStaleOnepayOrders(prisma: PrismaClient) {
  const cutoff = new Date(Date.now() - STALE_ORDER_MINUTES * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { paymentMethod: "onepay", paid: false, status: "pending", createdAt: { lt: cutoff } },
    include: { items: true },
  });
  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, paid: false, status: "pending" },
        data: { status: "cancelled", paymentStatusMessage: "Checkout abandoned before payment" },
      });
      if (updated.count === 1) {
        await releaseStock(
          tx,
          order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        );
      }
    });
  }
}
