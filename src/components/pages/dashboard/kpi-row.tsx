import {
  Calculator,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/molecules/stat-card";
import { formatCurrency, formatDecimal } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard";

/** The five headline KPI tiles across the top of the dashboard. */
export function KpiRow({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        icon={DollarSign}
        label="Total Sales"
        value={formatCurrency(data.totalSales)}
        change={data.salesChange}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <StatCard
        icon={ShoppingCart}
        label="Transactions"
        value={data.totalTransactions.toLocaleString()}
        change={data.transactionsChange}
        iconClassName="bg-blue-100 text-blue-700"
      />
      <StatCard
        icon={TrendingUp}
        label="Total Profit"
        value={formatCurrency(data.totalProfit)}
        change={data.profitChange}
        iconClassName="bg-violet-100 text-violet-700"
      />
      <StatCard
        icon={Calculator}
        label="Avg Order Value"
        value={formatDecimal(data.avgOrderValue)}
        change={data.avgOrderValueChange}
        iconClassName="bg-amber-100 text-amber-700"
      />
      <StatCard
        icon={Users}
        label="Customers"
        value={data.totalCustomers.toLocaleString()}
        change={data.customersChange}
        iconClassName="bg-pink-100 text-pink-700"
      />
    </div>
  );
}
