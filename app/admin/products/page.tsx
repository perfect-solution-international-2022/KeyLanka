import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { prisma } from "@/lib/prisma";
import type { AdminProduct } from "@/lib/admin-api";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, brand: true },
    orderBy: { id: "desc" },
  });

  return (
    <AdminShell title="Products">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} products in the catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          Add Product
        </Link>
      </div>
      <ProductsTable products={serialize<AdminProduct[]>(products)} />
    </AdminShell>
  );
}
