"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/api";
import { exportToExcel } from "@/lib/export-excel";

export interface SalesReportData {
  daily: { date: string; orders: number; revenue: number }[];
  totalRevenue: number;
  totalOrders: number;
  cancelledCount: number;
  avgOrderValue: number;
  byStatus: { status: string; count: number }[];
  byPaymentMethod: { method: string; count: number }[];
}

const chartConfig = {
  revenue: { label: "Revenue (Rs.)", color: "var(--color-brand)" },
  orders: { label: "Orders", color: "var(--color-brand-dark)" },
} satisfies ChartConfig;

export function SalesReport({ data }: { data: SalesReportData }) {
  function handleExport() {
    exportToExcel("sales-report", [
      {
        name: "Summary",
        rows: [
          { Metric: "Total Revenue", Value: data.totalRevenue },
          { Metric: "Total Orders", Value: data.totalOrders },
          { Metric: "Cancelled Orders", Value: data.cancelledCount },
          { Metric: "Average Order Value", Value: Number(data.avgOrderValue.toFixed(2)) },
        ],
      },
      {
        name: "Daily Sales",
        rows: data.daily.map((d) => ({ Date: d.date, Orders: d.orders, Revenue: d.revenue })),
      },
      {
        name: "By Status",
        rows: data.byStatus.map((s) => ({ Status: s.status, Count: s.count })),
      },
      {
        name: "By Payment Method",
        rows: data.byPaymentMethod.map((p) => ({ "Payment Method": p.method, Count: p.count })),
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(data.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {data.totalOrders.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Avg Order Value</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(data.avgOrderValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Cancelled Orders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {data.cancelledCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>Daily orders and revenue (cancelled orders excluded)</CardDescription>
          <CardAction>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-muted"
            >
              <Download size={13} /> Download Excel
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient id="fillRevenueReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="revenue" type="natural" fill="url(#fillRevenueReport)" stroke="var(--color-revenue)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byStatus.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byPaymentMethod.map((p) => (
                  <TableRow key={p.method}>
                    <TableCell className="capitalize">{p.method.replace("_", " ")}</TableCell>
                    <TableCell className="text-right">{p.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
