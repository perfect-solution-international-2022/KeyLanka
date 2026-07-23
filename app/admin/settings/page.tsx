import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleSettingsForm } from "@/components/admin/WholesaleSettingsForm";
import { getWholesaleMinQty } from "@/lib/queries";

export default async function AdminSettingsPage() {
  const wholesaleMinQty = await getWholesaleMinQty();

  return (
    <AdminShell title="Settings">
      <div className="max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Wholesale Pricing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set the minimum quantity a customer must buy of a single product before its wholesale price
          (if one is set on that product) is applied instead of the regular price.
        </p>
        <WholesaleSettingsForm initialMinQty={wholesaleMinQty} />
      </div>
    </AdminShell>
  );
}
