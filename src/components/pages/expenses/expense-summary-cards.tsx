import { Receipt, Tag, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { StatCard, StatCardSkeleton } from "@/components/molecules/stat-card";
import { formatCurrency } from "@/lib/format";
import { monthChangePercent, type ExpenseSummary } from "@/lib/expenses";

/** The four expense KPI tiles (this month, MoM change, top category, count). */
export function ExpenseSummaryCards({
  summary,
  loading,
}: {
  summary: ExpenseSummary;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const change = monthChangePercent(summary.thisMonth, summary.lastMonth);
  const up = change >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Receipt}
        label="Total Expenses (This Month)"
        value={formatCurrency(summary.thisMonth)}
        iconClassName="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={up ? TrendingUp : TrendingDown}
        label="vs Last Month"
        value={`${up ? "+" : ""}${change.toFixed(1)}%`}
        iconClassName={
          up ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        }
      />
      <StatCard
        icon={Tag}
        label="Top Category"
        value={
          <>
            {summary.topCategory.name}
            {summary.topCategory.amount > 0 && (
              <span className="block text-xs font-normal text-muted-foreground">
                {formatCurrency(summary.topCategory.amount)}
              </span>
            )}
          </>
        }
        iconClassName="bg-violet-50 text-violet-600"
      />
      <StatCard
        icon={Wallet}
        label="Transactions"
        value={summary.transactionCount}
        iconClassName="bg-amber-50 text-amber-600"
      />
    </div>
  );
}
