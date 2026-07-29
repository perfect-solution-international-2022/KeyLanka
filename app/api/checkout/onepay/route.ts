import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";
import { createCheckoutLink } from "@/lib/onepay";
import { InsufficientStockError, releaseStock, reserveStock } from "@/lib/inventory";
import { getUnitPrice, resolvePriceSource } from "@/lib/pricing";
import { getShippingCost } from "@/lib/queries";

const schema = z.object({
  shippingName: z.string().min(1),
  shippingLine1: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingDistrict: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingPhone: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const [user, cartItems] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.cartItem.findMany({ where: { userId }, include: { product: true, variant: true } }),
  ]);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
  const subtotal = cartItems.reduce((sum, ci, i) => sum + unitPrices[i] * ci.quantity, 0);
  const shippingCost = await getShippingCost();
  const total = subtotal + shippingCost;

  let orderId: number;
  try {
    // Stock is reserved (decremented) as soon as the order is created — not
    // when payment is confirmed — otherwise two customers could both pass
    // this check and proceed to OnePay for the last unit. If payment ends up
    // failing, the webhook below releases the stock back.
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

      return tx.order.create({
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
          paymentMethod: "onepay",
          status: "pending",
          paid: false,
          items: {
            create: cartItems.map((ci, i) => ({
              productId: ci.productId,
              variantId: ci.variantId,
              name: ci.product.name,
              sku: ci.variant?.sku ?? ci.product.sku,
              price: unitPrices[i],
              quantity: ci.quantity,
            })),
          },
        },
      });
    });
    orderId = order.id;
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const [firstName, ...rest] = user.name.trim().split(" ");

  try {
    const { checkoutUrl, transactionId } = await createCheckoutLink({
      amount: total,
      reference: `KEYLANKA-${String(orderId).padStart(6, "0")}`,
      redirectUrl: `${appUrl}/checkout/onepay-return?orderId=${orderId}`,
      customer: {
        firstName: firstName || user.name,
        lastName: rest.join(" ") || firstName || user.name,
        phone: data.shippingPhone,
        email: user.email,
      },
      additionalData: JSON.stringify({ orderId }),
    });

    // Store the transaction id now (before payment completes) so the webhook
    // can match on it directly instead of relying solely on additional_data.
    await prisma.order.update({ where: { id: orderId }, data: { transactionId } });

    // Cart is only cleared once we've successfully handed off to OnePay —
    // if link creation fails below, the order stays but the cart is intact
    // so the customer isn't left with an empty cart and no way to retry.
    await prisma.cartItem.deleteMany({ where: { userId } });

    return NextResponse.json({ orderId, checkoutUrl }, { status: 201 });
  } catch (err) {
    // Link creation failed after we'd already reserved stock — give it back.
    await prisma.$transaction(async (tx) => {
      await releaseStock(
        tx,
        cartItems.map((ci) => ({ productId: ci.productId, variantId: ci.variantId, quantity: ci.quantity }))
      );
      await tx.order.update({ where: { id: orderId }, data: { status: "cancelled" } });
    });
    const message = err instanceof Error ? err.message : "Failed to start OnePay checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
