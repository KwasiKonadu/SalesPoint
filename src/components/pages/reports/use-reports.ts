'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  EMPTY_REPORTS,
  getPeriodDates,
  getPreviousPeriodDates,
  INITIAL_LOADING,
  type ExpensesByCategoryItem,
  type LoadingState,
  type PeriodKey,
  type ProfitData,
  type ReportKey,
  type ReportState,
  type SalesByCategoryItem,
  type SalesByPaymentItem,
  type SalesByProductItem,
  type SalesByStaffItem,
  type SalesOverviewItem,
  type SupplierPurchaseItem,
  type TopCustomerItem,
} from '@/lib/reports';

async function fetchReport<T>(
  type: string,
  startDate: string,
  endDate: string,
): Promise<T | null> {
  try {
    const res = await fetch(
      `/api/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`,
    );
    if (!res.ok) throw new Error('Failed to fetch report');
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
  } catch {
    return null;
  }
}

/** Loads every report for the selected period, plus the previous period's profit. */
export function useReports() {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportState>(EMPTY_REPORTS);
  const [loading, setLoading] = useState<LoadingState>(INITIAL_LOADING);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    const { startDate, endDate } = getPeriodDates(period, customStart, customEnd);

    const finish = (key: ReportKey) => {
      if (!ignore) setLoading((prev) => ({ ...prev, [key]: false }));
    };

    (async () => {
      setRefreshing(true);
      setError(null);
      setLoading(INITIAL_LOADING);
      try {
        const [
          salesOverview,
          salesByProduct,
          salesByCategory,
          salesByStaff,
          salesByPayment,
          expensesByCategory,
          profit,
          topCustomers,
          supplierPurchases,
        ] = await Promise.all([
          fetchReport<SalesOverviewItem[]>('sales_overview', startDate, endDate).finally(
            () => finish('salesOverview'),
          ),
          fetchReport<SalesByProductItem[]>(
            'sales_by_product',
            startDate,
            endDate,
          ).finally(() => finish('salesByProduct')),
          fetchReport<SalesByCategoryItem[]>(
            'sales_by_category',
            startDate,
            endDate,
          ).finally(() => finish('salesByCategory')),
          fetchReport<SalesByStaffItem[]>(
            'sales_by_staff',
            startDate,
            endDate,
          ).finally(() => finish('salesByStaff')),
          fetchReport<SalesByPaymentItem[]>(
            'sales_by_payment',
            startDate,
            endDate,
          ).finally(() => finish('salesByPayment')),
          fetchReport<ExpensesByCategoryItem[]>(
            'expenses_by_category',
            startDate,
            endDate,
          ).finally(() => finish('expensesByCategory')),
          fetchReport<ProfitData>('profit', startDate, endDate).finally(() =>
            finish('profit'),
          ),
          fetchReport<TopCustomerItem[]>(
            'top_customers',
            startDate,
            endDate,
          ).finally(() => finish('topCustomers')),
          fetchReport<SupplierPurchaseItem[]>(
            'supplier_purchases',
            startDate,
            endDate,
          ).finally(() => finish('supplierPurchases')),
        ]);

        const prev = getPreviousPeriodDates(startDate, endDate);
        const previousPeriodProfit = await fetchReport<ProfitData>(
          'profit',
          prev.startDate,
          prev.endDate,
        );

        if (ignore) return;
        setReports({
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
        });
      } catch {
        if (!ignore) setError('Failed to load reports. Please try again.');
      } finally {
        if (!ignore) setRefreshing(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [period, customStart, customEnd, reloadKey]);

  return {
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
  };
}
