import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SalesReport } from "@/components/admin/SalesReport";
import { ItemReport } from "@/components/admin/ItemReport";
import { getSalesReport, getItemReport } from "@/lib/queries";

export default async function AdminReportsPage() {
  const [sales, items] = await Promise.all([getSalesReport(90), getItemReport()]);

  return (
    <AdminShell title="Reports">
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="items">Item Report</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          <SalesReport data={sales} />
        </TabsContent>
        <TabsContent value="items" className="mt-4">
          <ItemReport items={items} />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
