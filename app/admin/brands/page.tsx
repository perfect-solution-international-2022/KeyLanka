import { AdminShell } from "@/components/admin/AdminShell";
import { BrandsManager } from "@/components/admin/BrandsManager";

export default function AdminBrandsPage() {
  return (
    <AdminShell title="Brands">
      <BrandsManager />
    </AdminShell>
  );
}
