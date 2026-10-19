import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import {
  transactionMatchesOrder,
  reconcileOnepayOrder,
  PaymentVerificationError,
} from "./onepay-payment";

test("transactionMatchesOrder validates matching details", () => {
  const order = {
    transactionId: "TX123",
    total: new Prisma.Decimal("4444.00"),
  };

  const validVerification = {
    paid: true,
    transactionId: "TX123",
    amount: 4444.0,
    currency: "LKR",
    paidOn: "2026-10-19 12:00:00",
  };

  assert.equal(transactionMatchesOrder(order, validVerification), true);

  // Mismatched transaction ID
  assert.equal(
    transactionMatchesOrder(order, { ...validVerification, transactionId: "OTHER" }),
    false
  );

  // Mismatched currency
  assert.equal(
    transactionMatchesOrder(order, { ...validVerification, currency: "USD" }),
    false
  );

  // Mismatched amount
  assert.equal(
    transactionMatchesOrder(order, { ...validVerification, amount: 5000.0 }),
    false
  );
});

test("reconcileOnepayOrder marks unpaid order as paid when OnePay confirms payment", async () => {
  let orderState = {
    id: 10,
    userId: 1,
    status: "delivered", // Delivery status should NOT change!
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_TEST_1",
    total: new Prisma.Decimal("5000.00"),
    paymentStatusMessage: null as string | null,
    deletedAt: null,
  };

  let emailSent = false;
  let auditLogs: unknown[] = [];

  const mockDb = {
    order: {
      findUnique: async () => ({ ...orderState }),
      findUniqueOrThrow: async () => ({ ...orderState }),
      updateMany: async ({ data }: { data: { paid?: boolean; paymentStatusMessage?: string } }) => {
        if (data.paid !== undefined) orderState.paid = data.paid;
        if (data.paymentStatusMessage !== undefined) orderState.paymentStatusMessage = data.paymentStatusMessage;
        return { count: 1 };
      },
    },
    securityAuditLog: {
      create: async ({ data }: { data: unknown }) => {
        auditLogs.push(data);
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(mockDb),
  } as unknown as import("@prisma/client").PrismaClient;

  const mockVerify = async () => ({
    paid: true,
    transactionId: "TX_TEST_1",
    amount: 5000.0,
    currency: "LKR",
    paidOn: "2026-10-19 12:00:00",
  });

  const mockSendConfirmation = async () => {
    emailSent = true;
  };

  const result = await reconcileOnepayOrder(mockDb, 10, {
    source: "webhook",
    verifyTransaction: mockVerify,
    sendConfirmation: mockSendConfirmation,
  });

  assert.equal(result.order.paid, true);
  assert.equal(result.changed, true);
  assert.equal(result.order.status, "delivered"); // Delivery status preserved!
  assert.equal(orderState.paymentStatusMessage, "Payment verified by OnePay");
  assert.equal(emailSent, true);
  assert.equal(auditLogs.length, 1);
});

test("reconcileOnepayOrder does not re-send email on duplicate callback", async () => {
  const alreadyPaidOrder = {
    id: 11,
    userId: 1,
    status: "processing",
    paid: true, // Already paid!
    paymentMethod: "onepay",
    transactionId: "TX_TEST_2",
    total: new Prisma.Decimal("3000.00"),
    paymentStatusMessage: "Payment verified by OnePay",
    deletedAt: null,
  };

  let emailSent = false;

  const mockDb = {
    order: {
      findUnique: async () => ({ ...alreadyPaidOrder }),
    },
  } as unknown as import("@prisma/client").PrismaClient;

  const result = await reconcileOnepayOrder(mockDb, 11, {
    source: "webhook",
    verifyTransaction: async () => ({
      paid: true,
      transactionId: "TX_TEST_2",
      amount: 3000.0,
      currency: "LKR",
      paidOn: "2026-10-19 12:00:00",
    }),
    sendConfirmation: async () => {
      emailSent = true;
    },
  });

  assert.equal(result.order.paid, true);
  assert.equal(result.changed, false);
  assert.equal(emailSent, false); // No duplicate email!
});

test("reconcileOnepayOrder leaves order unpaid when OnePay reports payment not completed", async () => {
  let orderState = {
    id: 12,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_TEST_3",
    total: new Prisma.Decimal("2000.00"),
    paymentStatusMessage: null as string | null,
    deletedAt: null,
  };

  let emailSent = false;

  const mockDb = {
    order: {
      findUnique: async () => ({ ...orderState }),
      findUniqueOrThrow: async () => ({ ...orderState }),
      updateMany: async ({ data }: { data: { paymentStatusMessage?: string } }) => {
        if (data.paymentStatusMessage) orderState.paymentStatusMessage = data.paymentStatusMessage;
        return { count: 1 };
      },
    },
  } as unknown as import("@prisma/client").PrismaClient;

  const result = await reconcileOnepayOrder(mockDb, 12, {
    source: "webhook",
    verifyTransaction: async () => ({
      paid: false, // Not paid
      transactionId: "TX_TEST_3",
      amount: 2000.0,
      currency: "LKR",
      paidOn: null,
    }),
    sendConfirmation: async () => {
      emailSent = true;
    },
  });

  assert.equal(result.order.paid, false);
  assert.equal(result.changed, false);
  assert.equal(orderState.paymentStatusMessage, "Payment is not yet verified by OnePay");
  assert.equal(emailSent, false);
});

test("reconcileOnepayOrder throws mismatch error if amount does not match", async () => {
  const order = {
    id: 13,
    userId: 1,
    status: "pending",
    paid: false,
    paymentMethod: "onepay",
    transactionId: "TX_TEST_4",
    total: new Prisma.Decimal("2000.00"),
    paymentStatusMessage: null,
    deletedAt: null,
  };

  const mockDb = {
    order: {
      findUnique: async () => ({ ...order }),
    },
  } as unknown as import("@prisma/client").PrismaClient;

  await assert.rejects(
    async () => {
      await reconcileOnepayOrder(mockDb, 13, {
        source: "webhook",
        verifyTransaction: async () => ({
          paid: true,
          transactionId: "TX_TEST_4",
          amount: 9999.0, // Wrong amount!
          currency: "LKR",
          paidOn: null,
        }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof PaymentVerificationError);
      assert.equal(err.code, "mismatch");
      return true;
    }
  );
});
