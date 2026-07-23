import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default function AdminCategoriesPage() {
  return (
    <AdminShell title="Categories">
      <CategoriesManager />
    </AdminShell>
  );
}
