'use client';

import { CheckCircle2, CircleDollarSign, Package, ShoppingCart } from 'lucide-react';

import { PeriodSelector } from '@/components/pages/reports/period-selector';
import { StatCard, StatCardSkeleton } from '@/components/molecules/stat-card';
import { formatCurrency } from '@/lib/format';
import { useGoodsExpense } from './use-goods-expense';

/**
 * v1: lump-sum "sold vs. paid for goods" only — no per-category breakdown yet.
 * Route is currently unlisted in the sidebar (see src/lib/nav.ts).
 */
export default function GoodsExpensePage() {
  const {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    data,
    loading,
    refreshing,
    refresh,
  } = useGoodsExpense();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Expense</h1>
        <p className="text-sm text-muted-foreground">
          What you paid for restocked goods vs. what you sold, for the selected period.
        </p>
      </div>

      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={ShoppingCart}
              label="Total Sold"
              value={formatCurrency(data.totalSold)}
              iconClassName="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={Package}
              label="Paid for Goods (Restock)"
              value={formatCurrency(data.totalPaidForGoods)}
              iconClassName="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Paid Expenses"
              value={formatCurrency(data.paidExpenses)}
              iconClassName="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={CircleDollarSign}
              label="Unpaid Expenses"
              value={formatCurrency(data.unpaidExpenses)}
              iconClassName="bg-rose-50 text-rose-600"
            />
          </>
        )}
      </div>
    </div>
  );
}
