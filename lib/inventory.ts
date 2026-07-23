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
  items: { productId: number; quantity: number; name?: string }[]
) {
  for (const item of items) {
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
