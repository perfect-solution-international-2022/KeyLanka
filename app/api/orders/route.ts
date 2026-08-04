import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";
import { InsufficientStockError, reserveStock } from "@/lib/inventory";
import { getUnitPrice, resolvePriceSource } from "@/lib/pricing";
import { formatOrderNumber } from "@/lib/order-number";
import { sendMail, renderOrderConfirmationEmail } from "@/lib/mail";
import { getShippingCost } from "@/lib/queries";
import { createPolicyAgreementSnapshot } from "@/lib/policy-agreement";

const createOrderSchema = z.object({
  shippingName: z.string().min(1),
  shippingLine1: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingDistrict: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingPhone: z.string().min(1),
  paymentMethod: z.enum(["cod", "bank_transfer"]).default("cod"), // onepay orders go through /api/checkout/onepay instead
  paymentSlipAssetId: z.string().min(1).optional(),
  policyAgreementAccepted: z.literal(true),
});

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId, deletedAt: null },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (data.paymentMethod === "bank_transfer") {
    const [user, settings, slip] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { locksmithStatus: true } }),
      prisma.bankTransferSettings.findUnique({ where: { id: 1 } }),
      data.paymentSlipAssetId
        ? prisma.uploadAsset.findFirst({ where: { id: data.paymentSlipAssetId, ownerId: userId, visibility: "PRIVATE", purpose: "BANK_TRANSFER_SLIP", bankTransferOrder: null }, select: { id: true } })
        : null,
    ]);
    if (user?.locksmithStatus !== "approved") return NextResponse.json({ error: "Bank transfer is only available to approved locksmith members" }, { status: 403 });
    if (!settings?.enabled) return NextResponse.json({ error: "Bank transfer is currently unavailable" }, { status: 409 });
    if (!slip) return NextResponse.json({ error: "Upload a valid payment slip" }, { status: 400 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true, variant: true, warranty: true },
  });
  if (cartItems.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  const unitPrices = cartItems.map((ci) =>
    getUnitPrice(
      resolvePriceSource(
        {
          price: Number(ci.product.price),
          wholesalePrice: ci.product.wholesalePrice != null ? Number(ci.product.wholesalePrice) : null,
          wholesaleMinQty: ci.product.wholesaleMinQty,
        },
        ci.variant
          ? { price: Number(ci.variant.price), wholesalePrice: ci.variant.wholesalePrice != null ? Number(ci.variant.wholesalePrice) : null }
          : null
      ),
      ci.quantity
    )
  );
  const subtotal = cartItems.reduce((sum, ci, i) => sum + (unitPrices[i] + Number(ci.warranty?.price ?? 0)) * ci.quantity, 0);
  const shippingCost = await getShippingCost();
  const total = subtotal + shippingCost;
  const policyAgreement = await createPolicyAgreementSnapshot();

  try {
    const order = await prisma.$transaction(async (tx) => {
      await reserveStock(
        tx,
        cartItems.map((ci) => ({
          productId: ci.productId,
          variantId: ci.variantId,
          quantity: ci.quantity,
          name: ci.product.name,
          allowBackorder: ci.product.allowBackorder,
        }))
      );

      const created = await tx.order.create({
        data: {
          userId,
          total,
          shippingCost,
          shippingName: data.shippingName,
          shippingLine1: data.shippingLine1,
          shippingCity: data.shippingCity,
          shippingDistrict: data.shippingDistrict,
          shippingPostalCode: data.shippingPostalCode,
          shippingPhone: data.shippingPhone,
          paymentMethod: data.paymentMethod,
          paymentSlipAssetId: data.paymentMethod === "bank_transfer" ? data.paymentSlipAssetId : null,
          policyAgreement,
          items: {
            create: cartItems.map((ci, i) => ({
              productId: ci.productId,
              variantId: ci.variantId,
              name: ci.product.name,
              sku: ci.variant?.sku ?? ci.product.sku,
              price: unitPrices[i],
              quantity: ci.quantity,
              warrantyName: ci.warranty?.name ?? "No Warranty",
              warrantyDays: ci.warranty?.days ?? null,
              warrantyPrice: ci.warranty?.price ?? 0,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (user) {
      await sendMail({
        to: user.email,
        subject: `Order Confirmed — ${formatOrderNumber(order.id)}`,
        html: renderOrderConfirmationEmail({
          name: user.name,
          orderNumber: formatOrderNumber(order.id),
          items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price.toString() })),
          total: order.total.toString(),
          shippingAddress: `${order.shippingLine1}, ${order.shippingCity}${order.shippingDistrict ? `, ${order.shippingDistrict}` : ""}`,
        }),
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
