import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories, getBrands } from "@/lib/queries";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <AdminShell title="Add Product">
      <h2 className="text-lg font-semibold mb-4">Add Product</h2>
      <ProductForm categories={categories} brands={brands} />
    </AdminShell>
  );
}
