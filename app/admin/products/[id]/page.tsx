import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories, getBrands } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import type { AdminProduct } from "@/lib/admin-api";
import { toAdminVariant } from "@/lib/product-variants";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: { categories: true, conditions: true, warranties: true, variants: { include: { values: true, conditions: true } } },
    }),
    getCategories(),
    getBrands(),
  ]);

  if (!product) notFound();

  return (
    <AdminShell title="Edit Product">
      <ProductForm
        product={serialize<AdminProduct>({ ...product, variants: product.variants.map(toAdminVariant) })}
        categories={categories}
        brands={brands}
        fullWidth
      />
    </AdminShell>
  );
}
