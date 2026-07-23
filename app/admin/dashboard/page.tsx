import { AdminShell } from "@/components/admin/AdminShell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { RecentOrdersTable } from "@/components/recent-orders-table";
import { RecentCustomersTable } from "@/components/recent-customers-table";
import { SectionCards } from "@/components/section-cards";
import { getDashboardStats, getDailyOrderStats, getRecentOrders, getRecentCustomers } from "@/lib/queries";

export default async function Page() {
  const [stats, daily, recentOrders, recentCustomers] = await Promise.all([
    getDashboardStats(),
    getDailyOrderStats(30),
    getRecentOrders(8),
    getRecentCustomers(8),
  ]);

  return (
    <AdminShell title="Dashboard">
      <SectionCards stats={stats} />
      <ChartAreaInteractive data={daily} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentOrdersTable orders={recentOrders} />
        <RecentCustomersTable customers={recentCustomers} />
      </div>
    </AdminShell>
  );
}
