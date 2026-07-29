import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const variantSchema = z.object({
  id: z.number().optional(),
  sku: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  wholesalePrice: z.number().positive().nullable().optional(),
  productCost: z.number().positive().nullable().optional(),
  stockStatus: z.enum(["in_stock", "out_of_stock"]).default("in_stock"),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  weightKg: z.number().positive().nullable().optional(),
  lengthCm: z.number().positive().nullable().optional(),
  widthCm: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  image: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  attributeValueIds: z.array(z.number()).min(1),
});

export type VariantInput = z.infer<typeof variantSchema>;

export async function saveVariants(
  tx: Prisma.TransactionClient,
  productId: number,
  variants: VariantInput[]
) {
  await tx.productVariant.deleteMany({ where: { productId } });
  if (!variants.length) return;

  for (const v of variants) {
    await tx.productVariant.create({
      data: {
        productId,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        wholesalePrice: v.wholesalePrice ?? null,
        productCost: v.productCost ?? null,
        stockStatus: v.stockStatus,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
        weightKg: v.weightKg ?? null,
        lengthCm: v.lengthCm ?? null,
        widthCm: v.widthCm ?? null,
        heightCm: v.heightCm ?? null,
        image: v.image || null,
        isDefault: v.isDefault,
        values: { create: v.attributeValueIds.map((attributeValueId) => ({ attributeValueId })) },
      },
    });
  }
}
