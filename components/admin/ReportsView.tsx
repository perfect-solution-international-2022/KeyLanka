"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport, type SalesReportData } from "@/components/admin/SalesReport";
import { ItemReport, type ItemReportRow } from "@/components/admin/ItemReport";

type ReportTab = "sales" | "items";

const RANGES = [
  { days: 7, label: "Week" },
  { days: 30, label: "Month" },
  { days: 90, label: "90 Days" },
] as const;

export function ReportsView({
  sales,
  items,
  rangeDays,
  rangeLabel,
  initialTab,
}: {
  sales: SalesReportData;
  items: ItemReportRow[];
  rangeDays: number;
  rangeLabel: string;
  initialTab: ReportTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [isPending, startTransition] = useTransition();

  function updateUrl(days: number, tab: ReportTab) {
    const params = new URLSearchParams({
      range: String(days),
      tab,
    });
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function changeTab(value: string) {
    const tab: ReportTab = value === "items" ? "items" : "sales";
    setActiveTab(tab);
    updateUrl(rangeDays, tab);
  }

  return (
    <Tabs value={activeTab} onValueChange={changeTab}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="items">Item Report</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2" aria-label="Report date range">
          <CalendarDays size={16} className="text-muted-foreground" />
          <div className="inline-flex rounded-lg border bg-background p-1">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                disabled={isPending}
                aria-pressed={rangeDays === range.days}
                onClick={() => updateUrl(range.days, activeTab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                  rangeDays === range.days
                    ? "bg-brand text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing data for {rangeLabel.toLowerCase()}.
      </p>

      <TabsContent value="sales" className="mt-2">
        <SalesReport data={sales} rangeDays={rangeDays} rangeLabel={rangeLabel} />
      </TabsContent>
      <TabsContent value="items" className="mt-2">
        <ItemReport items={items} rangeDays={rangeDays} rangeLabel={rangeLabel} />
      </TabsContent>
    </Tabs>
  );
}
