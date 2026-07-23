import { AdminShell } from "@/components/admin/AdminShell";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default function AdminServicesPage() {
  return (
    <AdminShell title="Services">
      <ServicesManager />
    </AdminShell>
  );
}
