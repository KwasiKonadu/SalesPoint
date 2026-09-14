import { DollarSign, Package, TrendingUp, Wallet } from "lucide-react";

import { StatCard, StatCardSkeleton } from "@/components/molecules/stat-card";
import { formatCurrency } from "@/lib/format";
import { calcChange, type ProfitData } from "@/lib/reports";

/** The four headline KPI tiles: revenue, COGS, gross profit, net profit. */
export function RevenueSummaryCards({
  profit,
  previousProfit,
  loading,
}: {
  profit: ProfitData | null;
  previousProfit: ProfitData | null;
  loading: boolean;
}) {
  if (loading && !profit) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const change = (current: number, key: keyof ProfitData) =>
    previousProfit
      ? calcChange(current, previousProfit[key] as number)
      : undefined;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={DollarSign}
        label="Total Revenue"
        value={formatCurrency(profit?.revenue || 0)}
        change={change(profit?.revenue || 0, "revenue")}
        changeSuffix="vs prev. period"
        iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      />
      <StatCard
        icon={Package}
        label="Cost of Goods"
        value={formatCurrency(profit?.cogs || 0)}
        change={change(profit?.cogs || 0, "cogs")}
        changeSuffix="vs prev. period"
        iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      />
      <StatCard
        icon={TrendingUp}
        label="Gross Profit"
        value={formatCurrency(profit?.grossProfit || 0)}
        change={change(profit?.grossProfit || 0, "grossProfit")}
        changeSuffix="vs prev. period"
        iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      />
      <StatCard
        icon={Wallet}
        label="Net Profit"
        value={formatCurrency(profit?.netProfit || 0)}
        change={change(profit?.netProfit || 0, "netProfit")}
        changeSuffix="vs prev. period"
        iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
      />
    </div>
  );
}
