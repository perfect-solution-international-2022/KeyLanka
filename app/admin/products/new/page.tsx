import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories, getBrands } from "@/lib/queries";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <AdminShell title="Add Product">
      <ProductForm categories={categories} brands={brands} fullWidth />
    </AdminShell>
  );
}
