'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import {
  getPeriodDates,
  getPreviousPeriodDates,
  type ExpensesByCategoryItem,
  type PeriodKey,
  type ProfitData,
  type ReportState,
  type SalesByCategoryItem,
  type SalesByPaymentItem,
  type SalesByProductItem,
  type SalesByStaffItem,
  type SalesOverviewItem,
  type SupplierPurchaseItem,
  type TopCustomerItem,
} from '@/lib/reports';

async function fetchReport<T>(type: string, startDate: string, endDate: string): Promise<T | null> {
  try {
    const json = await apiClient.get<{ data: T; error?: string }>(
      `/api/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`,
      'Failed to fetch report',
    );
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch {
    return null;
  }
}

/** One report card's query — a thin wrapper so each keeps its own loading state. */
function useReport<T>(type: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', type, startDate, endDate],
    queryFn: () => fetchReport<T>(type, startDate, endDate),
  });
}

/** Loads every report for the selected period, plus the previous period's profit. */
export function useReports() {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const queryClient = useQueryClient();

  const { startDate, endDate } = getPeriodDates(period, customStart, customEnd);
  const prev = getPreviousPeriodDates(startDate, endDate);

  const salesOverview = useReport<SalesOverviewItem[]>('sales_overview', startDate, endDate);
  const salesByProduct = useReport<SalesByProductItem[]>('sales_by_product', startDate, endDate);
  const salesByCategory = useReport<SalesByCategoryItem[]>('sales_by_category', startDate, endDate);
  const salesByStaff = useReport<SalesByStaffItem[]>('sales_by_staff', startDate, endDate);
  const salesByPayment = useReport<SalesByPaymentItem[]>('sales_by_payment', startDate, endDate);
  const expensesByCategory = useReport<ExpensesByCategoryItem[]>('expenses_by_category', startDate, endDate);
  const profit = useReport<ProfitData>('profit', startDate, endDate);
  const topCustomers = useReport<TopCustomerItem[]>('top_customers', startDate, endDate);
  const supplierPurchases = useReport<SupplierPurchaseItem[]>('supplier_purchases', startDate, endDate);
  const previousPeriodProfit = useReport<ProfitData>('profit', prev.startDate, prev.endDate);

  const queries = [
    salesOverview,
    salesByProduct,
    salesByCategory,
    salesByStaff,
    salesByPayment,
    expensesByCategory,
    profit,
    topCustomers,
    supplierPurchases,
    previousPeriodProfit,
  ];

  const reports: ReportState = {
    salesOverview: salesOverview.data ?? null,
    salesByProduct: salesByProduct.data ?? null,
    salesByCategory: salesByCategory.data ?? null,
    salesByStaff: salesByStaff.data ?? null,
    salesByPayment: salesByPayment.data ?? null,
    expensesByCategory: expensesByCategory.data ?? null,
    profit: profit.data ?? null,
    topCustomers: topCustomers.data ?? null,
    supplierPurchases: supplierPurchases.data ?? null,
    previousPeriodProfit: previousPeriodProfit.data ?? null,
  };

  const loading = {
    salesOverview: salesOverview.isPending,
    salesByProduct: salesByProduct.isPending,
    salesByCategory: salesByCategory.isPending,
    salesByStaff: salesByStaff.isPending,
    salesByPayment: salesByPayment.isPending,
    expensesByCategory: expensesByCategory.isPending,
    profit: profit.isPending,
    topCustomers: topCustomers.isPending,
    supplierPurchases: supplierPurchases.isPending,
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    reports,
    loading,
    error: queries.some((q) => q.isError) ? 'Failed to load reports. Please try again.' : null,
    refreshing: queries.some((q) => q.isFetching),
    refresh,
  };
}
