import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !/^(--apply|--order=\d+|--after=\d+|--limit=\d+)$/.test(arg))) {
    throw new Error("Usage: tsx scripts/reconcile-onepay.ts [--order=123] [--after=0] [--limit=50] [--apply]");
  }
  const value = (key: string, fallback: number) =>
    Number(args.find((arg) => arg.startsWith(`--${key}=`))?.split("=")[1] ?? fallback);
  const id = value("order", 0);
  const after = value("after", 0);
  const limit = value("limit", 50);
  if (![id, after, limit].every(Number.isSafeInteger) || limit < 1 || limit > 100) {
    throw new Error("Invalid order, cursor or limit (1-100)");
  }
  const { prisma } = await import("../lib/prisma");
  const { reconcileOnepayOrder, PaymentVerificationError } = await import("../lib/onepay-payment");
  try {
    const orders = await prisma.order.findMany({
      where: { paymentMethod: "onepay", paid: false, id: id || { gt: after } },
      orderBy: { id: "asc" },
      take: limit,
    });
    console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "dry-run", count: orders.length }));
    for (const order of orders) {
      if (!order.transactionId) {
        console.log(JSON.stringify({ orderId: order.id, result: "manual-review-missing-transaction-id" }));
        continue;
      }
      try {
        const result = await reconcileOnepayOrder(prisma, order.id, {
          source: "reconciliation",
          dryRun: !args.includes("--apply"),
          notify: false,
        });
        console.log(
          JSON.stringify({
            orderId: order.id,
            paid: result.order.paid,
            wouldMarkPaid: result.wouldMarkPaid,
            changed: result.changed,
            requiresReview: order.status === "cancelled" || Boolean(order.deletedAt),
          })
        );
      } catch (error) {
        process.exitCode = 1;
        console.error(
          JSON.stringify({
            orderId: order.id,
            result: error instanceof PaymentVerificationError ? error.code : "database-error",
          })
        );
      }
    }
    console.log(JSON.stringify({ nextAfter: !id && orders.length === limit ? orders.at(-1)?.id : null }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Reconciliation could not complete. Check database/gateway configuration and arguments.", e);
  process.exitCode = 1;
});
