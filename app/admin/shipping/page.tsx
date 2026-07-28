import { AdminShell } from "@/components/admin/AdminShell";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { getShippingCost } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const shippingCost = await getShippingCost();

  return (
    <AdminShell title="Shipping Settings">
      <ShippingSettingsForm initialCost={shippingCost} />
    </AdminShell>
  );
}
