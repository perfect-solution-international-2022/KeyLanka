import { AdminShell } from "@/components/admin/AdminShell";
import { AttributesManager } from "@/components/admin/AttributesManager";

export default function AdminAttributesPage() {
  return (
    <AdminShell title="Attributes">
      <AttributesManager />
    </AdminShell>
  );
}
