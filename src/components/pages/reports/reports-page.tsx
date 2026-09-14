"use client";

import { ReportEmptyState } from "./report-primitives";
import {
  ExpenseBreakdownChart,
  ExpensesByCategoryChart,
  SalesByCategoryChart,
  SalesByPaymentChart,
  SalesTrendChart,
} from "./report-charts";
import {
  SalesByStaffTable,
  SupplierPurchasesTable,
  TopCustomersTable,
  TopProductsTable,
} from "./report-tables";
import { PeriodSelector } from "./period-selector";
import { RevenueSummaryCards } from "./revenue-summary-cards";
import { useReports } from "./use-reports";

export default function ReportsPage() {
  const {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    reports,
    loading,
    error,
    refreshing,
    refresh,
  } = useReports();

  const hasAnyData =
    (reports.profit && reports.profit.revenue > 0) ||
    (reports.salesOverview && reports.salesOverview.length > 0);

  if (error && !hasAnyData) {
    return (
      <div className="space-y-6 p-6">
        <ReportEmptyState message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
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

      <RevenueSummaryCards
        profit={reports.profit}
        previousProfit={reports.previousPeriodProfit}
        loading={loading.profit}
      />

      <SalesTrendChart
        data={reports.salesOverview}
        loading={loading.salesOverview}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByCategoryChart
          data={reports.salesByCategory}
          loading={loading.salesByCategory}
        />
        <SalesByPaymentChart
          data={reports.salesByPayment}
          loading={loading.salesByPayment}
        />
      </div>

      <SalesByStaffTable
        data={reports.salesByStaff}
        loading={loading.salesByStaff}
      />
      <TopProductsTable
        data={reports.salesByProduct}
        loading={loading.salesByProduct}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExpensesByCategoryChart
          data={reports.expensesByCategory}
          loading={loading.expensesByCategory}
        />
        <ExpenseBreakdownChart
          data={reports.expensesByCategory}
          loading={loading.expensesByCategory}
        />
      </div>

      <TopCustomersTable
        data={reports.topCustomers}
        loading={loading.topCustomers}
      />
      <SupplierPurchasesTable
        data={reports.supplierPurchases}
        loading={loading.supplierPurchases}
      />
    </div>
  );
}
