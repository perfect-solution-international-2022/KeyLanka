import { AdminShell } from "@/components/admin/AdminShell";
import { BankTransferSettingsForm } from "@/components/admin/BankTransferSettingsForm";
import { getBankTransferSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export default async function BankTransferSettingsPage() {
  const settings = await getBankTransferSettings();
  return <AdminShell title="Bank Transfer Settings"><BankTransferSettingsForm initial={settings} /></AdminShell>;
}
