"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/molecules/error-state";
import { isDashboardEmpty } from "@/lib/dashboard";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { KpiRow } from "./kpi-row";
import { LowStockCard } from "./low-stock-card";
import { QuickActionsCard } from "./quick-actions-card";
import { RecentSalesCard } from "./recent-sales-card";
import { SalesByCategoryChart } from "./sales-by-category-chart";
import { SalesOverviewChart } from "./sales-overview-chart";
import { TopProductsCard } from "./top-products-card";
import { useDashboard } from "./use-dashboard";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent>
          <ErrorState
            title="Failed to load dashboard"
            message={error}
            onRetry={refetch}
          />
        </CardContent>
      </Card>
    );
  }

  if (loading || !data) return <DashboardSkeleton />;

  if (isDashboardEmpty(data)) return <DashboardEmptyState />;

  return (
    <div className="space-y-6">
      <KpiRow data={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesOverviewChart salesChart={data.salesChart} />
        <SalesByCategoryChart categories={data.salesByCategory} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TopProductsCard products={data.topProducts} />
          <RecentSalesCard sales={data.recentSales} />
        </div>
        <LowStockCard products={data.lowStockProducts} />
      </div>

      <QuickActionsCard />
    </div>
  );
}
