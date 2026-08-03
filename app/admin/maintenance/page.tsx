import { AdminShell } from "@/components/admin/AdminShell";
import { MaintenanceSettingsForm } from "@/components/admin/MaintenanceSettingsForm";
import { getMaintenanceSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  const settings = await getMaintenanceSettings();

  return (
    <AdminShell title="Site Maintenance">
      <MaintenanceSettingsForm initialEnabled={settings.enabled} initialMessage={settings.message} />
    </AdminShell>
  );
}
