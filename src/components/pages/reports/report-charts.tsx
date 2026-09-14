"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatChartDate,
  getPaymentMethodLabel,
  renderPieLabel,
  REPORT_COLORS,
  type ExpensesByCategoryItem,
  type SalesByCategoryItem,
  type SalesByPaymentItem,
  type SalesOverviewItem,
} from "@/lib/reports";
import { formatCurrencyCompact } from "@/lib/format";

import {
  AreaTooltip,
  BarTooltip,
  CustomLegend,
  PieTooltip,
} from "./report-chart-parts";
import { ChartSkeleton, PieChartSkeleton } from "./report-skeletons";
import { ReportCard } from "./report-primitives";

const AXIS_TICK = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
} as const;

/** Percentage-labelled donut shared by the two "by category" charts. */
function PercentageDonut({
  data,
  dataKey,
}: {
  data: { category: string; percentage: number }[];
  dataKey: string;
}) {
  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            labelLine={false}
            label={renderPieLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={REPORT_COLORS[index % REPORT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend
        payload={data.map((item, i) => ({
          value: item.category,
          color: REPORT_COLORS[i % REPORT_COLORS.length],
          payload: { percentage: item.percentage },
        }))}
      />
    </>
  );
}

export function SalesTrendChart({
  data,
  loading,
}: {
  data: SalesOverviewItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Sales Trend"
      description="Daily revenue over the selected period"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<ChartSkeleton />}
    >
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data ?? []}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            className="text-xs"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            className="text-xs"
            tickFormatter={formatCurrencyCompact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<AreaTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}

export function SalesByCategoryChart({
  data,
  loading,
}: {
  data: SalesByCategoryItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Sales by Category"
      description="Revenue distribution across categories"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<PieChartSkeleton />}
    >
      <PercentageDonut data={data ?? []} dataKey="revenue" />
    </ReportCard>
  );
}

export function SalesByPaymentChart({
  data,
  loading,
}: {
  data: SalesByPaymentItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Sales by Payment Method"
      description="Revenue by payment type"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<ChartSkeleton />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data ?? []}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={formatCurrencyCompact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="method"
            tickFormatter={getPaymentMethodLabel}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<BarTooltip />} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {(data ?? []).map((_, index) => (
              <Cell
                key={index}
                fill={REPORT_COLORS[index % REPORT_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}

export function ExpensesByCategoryChart({
  data,
  loading,
}: {
  data: ExpensesByCategoryItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Expenses by Category"
      description="Breakdown of operating expenses"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<PieChartSkeleton />}
    >
      <PercentageDonut data={data ?? []} dataKey="total" />
    </ReportCard>
  );
}

export function ExpenseBreakdownChart({
  data,
  loading,
}: {
  data: ExpensesByCategoryItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Expense Breakdown"
      description="Detailed expense amounts by category"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<ChartSkeleton />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data ?? []}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="category"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrencyCompact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<BarTooltip />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {(data ?? []).map((_, index) => (
              <Cell
                key={index}
                fill={REPORT_COLORS[index % REPORT_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
