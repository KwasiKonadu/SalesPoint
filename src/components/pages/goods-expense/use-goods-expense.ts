import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getPeriodDates, type PeriodKey } from '@/lib/reports';
import { queryKeys } from '@/lib/query-keys';

export interface GoodsExpenseData {
  totalSold: number;
  totalPaidForGoods: number;
  paidExpenses: number;
  unpaidExpenses: number;
}

const EMPTY_DATA: GoodsExpenseData = {
  totalSold: 0,
  totalPaidForGoods: 0,
  paidExpenses: 0,
  unpaidExpenses: 0,
};

async function fetchGoodsExpense(
  startDate: string,
  endDate: string,
): Promise<GoodsExpenseData> {
  const json = await apiClient.get<{ data: GoodsExpenseData; error?: string }>(
    `/api/reports?type=goods_expense&startDate=${startDate}&endDate=${endDate}`,
    'Failed to fetch goods expense report',
  );
  if (json.error) throw new Error(json.error);
  return json.data;
}

/** Lump-sum "sold vs. paid for goods" for the selected period. */
export function useGoodsExpense() {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { startDate, endDate } = getPeriodDates(period, customStart, customEnd);

  const query = useQuery({
    queryKey: queryKeys.reports.all({ type: 'goods_expense', startDate, endDate }),
    queryFn: () => fetchGoodsExpense(startDate, endDate),
  });

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    data: query.data ?? EMPTY_DATA,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    refresh: query.refetch,
  };
}
