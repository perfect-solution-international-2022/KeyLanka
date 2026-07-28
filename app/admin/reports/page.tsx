import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsView } from "@/components/admin/ReportsView";
import { getSalesReport, getItemReport } from "@/lib/queries";

const RANGE_LABELS: Record<number, string> = {
  7: "the last 7 days",
  30: "the last 30 days",
  90: "the last 90 days",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const requestedDays = Number(params.range);
  const rangeDays = requestedDays === 7 || requestedDays === 30 ? requestedDays : 90;
  const initialTab = params.tab === "items" ? "items" : "sales";
  const [sales, items] = await Promise.all([getSalesReport(rangeDays), getItemReport(rangeDays)]);

  return (
    <AdminShell title="Reports">
      <ReportsView
        sales={sales}
        items={items}
        rangeDays={rangeDays}
        rangeLabel={RANGE_LABELS[rangeDays]}
        initialTab={initialTab}
      />
    </AdminShell>
  );
}
