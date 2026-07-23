import { AdminShell } from "@/components/admin/AdminShell";
import { AccountsManager } from "@/components/admin/AccountsManager";

export default function AdminAccountsPage() {
  return (
    <AdminShell title="Accounts">
      <AccountsManager />
    </AdminShell>
  );
}
