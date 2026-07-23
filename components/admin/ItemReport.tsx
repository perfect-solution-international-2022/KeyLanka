"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/api";
import { exportToExcel } from "@/lib/export-excel";

export interface ItemReportRow {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  stock: number;
  price: number;
  unitsSold: number;
  revenue: number;
}

const chartConfig = {
  revenue: { label: "Revenue (Rs.)", color: "var(--color-brand)" },
} satisfies ChartConfig;

export function ItemReport({ items }: { items: ItemReportRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  const topItems = useMemo(
    () =>
      [...items]
        .filter((i) => i.unitsSold > 0)
        .slice(0, 10)
        .map((i) => ({ name: i.name.length > 18 ? `${i.name.slice(0, 18)}…` : i.name, revenue: i.revenue })),
    [items]
  );

  function handleExport() {
    exportToExcel("item-report", [
      {
        name: "Items",
        rows: filtered.map((i) => ({
          Name: i.name,
          SKU: i.sku,
          Category: i.category,
          Brand: i.brand,
          "Units Sold": i.unitsSold,
          Revenue: i.revenue,
          "Current Stock": i.stock,
          Price: i.price,
        })),
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
          <CardDescription>Revenue by product, best sellers first</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <BarChart data={topItems} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} fontSize={12} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>{filtered.length} of {items.length} products</CardDescription>
          <CardAction className="col-span-2 sm:col-start-2 sm:col-span-1 row-start-2 sm:row-start-1 sm:row-span-2 mt-2 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search name, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full sm:w-56"
            />
            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-muted shrink-0"
            >
              <Download size={13} /> Download Excel
            </button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{i.name}</span>
                        <span className="text-xs text-muted-foreground">{i.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{i.category}</TableCell>
                    <TableCell className="text-right">{i.unitsSold}</TableCell>
                    <TableCell className="text-right">{formatCurrency(i.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={i.stock === 0 ? "destructive" : i.stock < 10 ? "secondary" : "outline"}>
                        {i.stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No items match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
