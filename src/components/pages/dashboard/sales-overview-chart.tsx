"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchSelect } from "@/components/molecules/search-select";
import { formatChartDate, formatCurrencyCompact } from "@/lib/format";
import {
  CHART_PERIOD_OPTIONS,
  sliceChartData,
  type DashboardData,
} from "@/lib/dashboard";

import { SalesChartTooltip } from "./dashboard-chart-parts";

/** Daily sales area chart with a period selector (owns its own period state). */
export function SalesOverviewChart({
  salesChart,
}: {
  salesChart: DashboardData["salesChart"];
}) {
  const [period, setPeriod] = useState("30d");
  const chartData = sliceChartData(salesChart, period);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sales Overview</CardTitle>
          <div className="w-36">
            <SearchSelect
              size="sm"
              clearable={false}
              value={period}
              onChange={setPeriod}
              options={CHART_PERIOD_OPTIONS}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCurrencyCompact(v)}
              />
              <Tooltip content={<SalesChartTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
