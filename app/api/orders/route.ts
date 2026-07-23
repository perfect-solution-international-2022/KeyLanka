import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";
import { InsufficientStockError, reserveStock } from "@/lib/inventory";
import { getWholesaleMinQty } from "@/lib/queries";
import { getUnitPrice } from "@/lib/pricing";
import { formatOrderNumber } from "@/lib/order-number";
import { sendMail, renderOrderConfirmationEmail } from "@/lib/mail";

const createOrderSchema = z.object({
  shippingName: z.string().min(1),
  shippingLine1: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingDistrict: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingPhone: z.string().min(1),
  paymentMethod: z.enum(["cod", "bank_transfer"]).default("cod"), // onepay orders go through /api/checkout/onepay instead
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  if (cartItems.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  const wholesaleMinQty = await getWholesaleMinQty();
  const unitPrices = cartItems.map((ci) =>
    getUnitPrice(
      { price: Number(ci.product.price), wholesalePrice: ci.product.wholesalePrice != null ? Number(ci.product.wholesalePrice) : null },
      ci.quantity,
      wholesaleMinQty
    )
  );
  const total = cartItems.reduce((sum, ci, i) => sum + unitPrices[i] * ci.quantity, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      await reserveStock(
        tx,
        cartItems.map((ci) => ({ productId: ci.productId, quantity: ci.quantity, name: ci.product.name }))
      );

      const created = await tx.order.create({
        data: {
          userId,
          total,
          shippingName: data.shippingName,
          shippingLine1: data.shippingLine1,
          shippingCity: data.shippingCity,
          shippingDistrict: data.shippingDistrict,
          shippingPostalCode: data.shippingPostalCode,
          shippingPhone: data.shippingPhone,
          paymentMethod: data.paymentMethod,
          items: {
            create: cartItems.map((ci, i) => ({
              productId: ci.productId,
              name: ci.product.name,
              price: unitPrices[i],
              quantity: ci.quantity,
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
