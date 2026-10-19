import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import {
  reconcileOnepayOrder,
  reconcileUnverifiedOnepayOrders,
  PaymentVerificationError,
} from "./onepay-payment";

function createMockDatabase(initialOrder: {
  id: number;
  userId: number;
  status: string;
  paid: boolean;
  paymentMethod: string;
  transactionId: string | null;
  total: Prisma.Decimal;
  paymentStatusMessage: string | null;
  deletedAt: Date | null;
}) {
  let order = { ...initialOrder };
  let auditLogs: unknown[] = [];
  let sentEmails: unknown[] = [];

  const db = {
    order: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        return order.id === where.id ? { ...order } : null;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: number } }) => {
        if (order.id !== where.id) throw new Error("Order not found");
        return { ...order };
      },
      findMany: async () => [{ ...order }],
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: number; paid?: boolean };
        data: { paid?: boolean; paymentStatusMessage?: string };
      }) => {
        if (order.id === where.id) {
          if (where.paid !== undefined && order.paid !== where.paid) {
            return { count: 0 };
          }
          if (data.paid !== undefined) order.paid = data.paid;
          if (data.paymentStatusMessage !== undefined) order.paymentStatusMessage = data.paymentStatusMessage;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    securityAuditLog: {
      create: async ({ data }: { data: unknown }) => {
        auditLogs.push(data);
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  } as unknown as import("@prisma/client").PrismaClient;

  return {
    db,
    getOrder: () => ({ ...order }),
    getAuditLogs: () => [...auditLogs],
    getSentEmails: () => [...sentEmails],
    sendConfirmation: async (_db: unknown, ord: unknown) => {
      sentEmails.push(ord);
    },
  };
}

test("Scenario 1: Customer creates an order -> status is Unpaid", async () => {
  const { getOrder } = createMockDatabase({
    id: 101,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_101",
    total: new Prisma.Decimal("4444.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  const order = getOrder();
  assert.equal(order.paid, false);
  assert.equal(order.status, "pending");
});

test("Scenario 2: Customer completes a verified OnePay payment -> updates to Paid without altering delivery status", async () => {
  const { db, getOrder, sendConfirmation, getSentEmails } = createMockDatabase({
    id: 102,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_102",
    total: new Prisma.Decimal("4444.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  const result = await reconcileOnepayOrder(db, 102, {
    source: "webhook",
    verifyTransaction: async () => ({
      paid: true,
      transactionId: "TX_102",
      amount: 4444.0,
      currency: "LKR",
      paidOn: "2026-10-19 12:00:00",
    }),
    sendConfirmation,
  });

  assert.equal(result.order.paid, true);
  assert.equal(result.changed, true);
  assert.equal(result.order.status, "pending"); // Delivery status untouched
  assert.equal(getOrder().paid, true);
  assert.equal(getSentEmails().length, 1);
});

test("Scenario 3: OnePay sends the success callback multiple times -> remains Paid, no duplicate email", async () => {
  const { db, getOrder, sendConfirmation, getSentEmails } = createMockDatabase({
    id: 103,
    userId: 1,
    status: "processing",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_103",
    total: new Prisma.Decimal("1000.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  const verify = async () => ({
    paid: true,
    transactionId: "TX_103",
    amount: 1000.0,
    currency: "LKR",
    paidOn: "2026-10-19 12:00:00",
  });

  // First callback
  const first = await reconcileOnepayOrder(db, 103, { source: "webhook", verifyTransaction: verify, sendConfirmation });
  assert.equal(first.order.paid, true);
  assert.equal(first.changed, true);
  assert.equal(getSentEmails().length, 1);

  // Duplicate callback
  const second = await reconcileOnepayOrder(db, 103, { source: "webhook", verifyTransaction: verify, sendConfirmation });
  assert.equal(second.order.paid, true);
  assert.equal(second.changed, false);
  assert.equal(getSentEmails().length, 1); // Still exactly 1 email!
});

test("Scenario 4: Customer cancels unpaid checkout or checkout is incomplete -> remains Unpaid", async () => {
  const { db, getOrder, sendConfirmation, getSentEmails } = createMockDatabase({
    id: 104,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_104",
    total: new Prisma.Decimal("2500.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  const result = await reconcileOnepayOrder(db, 104, {
    source: "return",
    verifyTransaction: async () => ({
      paid: false,
      transactionId: "TX_104",
      amount: 2500.0,
      currency: "LKR",
      paidOn: null,
    }),
    sendConfirmation,
  });

  assert.equal(result.order.paid, false);
  assert.equal(result.changed, false);
  assert.equal(getOrder().paid, false);
  assert.equal(getSentEmails().length, 0);
});

test("Scenario 5: Payment verification is temporarily unavailable -> keeps existing status", async () => {
  const { db, getOrder, sendConfirmation } = createMockDatabase({
    id: 105,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_105",
    total: new Prisma.Decimal("3500.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  await assert.rejects(
    async () => {
      await reconcileOnepayOrder(db, 105, {
        source: "webhook",
        verifyTransaction: async () => {
          throw new Error("OnePay connection timeout");
        },
        sendConfirmation,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof PaymentVerificationError);
      assert.equal(err.code, "unavailable");
      return true;
    }
  );

  assert.equal(getOrder().paid, false);
  assert.equal(getOrder().status, "pending");
});

test("Scenario 6: Successful callback arrives late after admin advanced delivery to Delivered -> Paid, delivery status preserved", async () => {
  const { db, getOrder, sendConfirmation } = createMockDatabase({
    id: 106,
    userId: 1,
    status: "delivered", // Admin already marked delivered!
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_106",
    total: new Prisma.Decimal("4444.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  const result = await reconcileOnepayOrder(db, 106, {
    source: "webhook",
    verifyTransaction: async () => ({
      paid: true,
      transactionId: "TX_106",
      amount: 4444.0,
      currency: "LKR",
      paidOn: "2026-10-19 12:00:00",
    }),
    sendConfirmation,
  });

  assert.equal(result.order.paid, true);
  assert.equal(result.order.status, "delivered"); // Preserved!
  assert.equal(getOrder().status, "delivered"); // MySQL has delivered!
  assert.equal(getOrder().paid, true); // MySQL has paid = true!
});

test("Scenario 7: Admin reloads the orders page after successful payment -> Paid", async () => {
  const { db, getOrder } = createMockDatabase({
    id: 107,
    userId: 1,
    status: "delivered",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_107",
    total: new Prisma.Decimal("8000.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  });

  // Admin page load triggers reconcileUnverifiedOnepayOrders
  const results = await reconcileUnverifiedOnepayOrders(db, {
    verifyTransaction: async () => ({
      paid: true,
      transactionId: "TX_107",
      amount: 8000.0,
      currency: "LKR",
      paidOn: "2026-10-19 12:00:00",
    }),
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].paid, true);
  assert.equal(getOrder().paid, true);
  assert.equal(getOrder().status, "delivered");
});
