'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useStaffDirectory } from '@/components/pages/staff/use-staff';
import type { Paginated, ReturnItemInput, ReturnRecord, Sale } from '@/lib/sales';

const PAGE_SIZE = 10;

/** Filter state whose setter also sends the table back to the first page. */
function usePagedFilter<T>(initial: T, resetPage: () => void) {
  const [value, setValue] = useState(initial);
  const set = useCallback(
    (next: T) => {
      setValue(next);
      resetPage();
    },
    [resetPage],
  );
  return [value, set] as const;
}

/**
 * Sales-history list: fetch + all server-side filters + pagination, plus the
 * staff list used by the "Sales Person" filter.
 */
export function useSalesList() {
  const [page, setPage] = useState(1);
  const resetPage = useCallback(() => setPage(1), []);
  const [search, setSearch] = usePagedFilter('', resetPage);
  const [startDate, setStartDate] = usePagedFilter('', resetPage);
  const [endDate, setEndDate] = usePagedFilter('', resetPage);
  const [paymentFilter, setPaymentFilter] = usePagedFilter('all', resetPage);
  const [statusFilter, setStatusFilter] = usePagedFilter('all', resetPage);
  const [personFilter, setPersonFilter] = usePagedFilter('all', resetPage);

  const filterParams = { page, search, startDate, endDate, paymentFilter, statusFilter, personFilter };
  const query = useQuery({
    queryKey: queryKeys.sales.list(filterParams),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: PAGE_SIZE.toString() });
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (paymentFilter !== 'all') params.set('paymentMethod', paymentFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (personFilter !== 'all') params.set('soldById', personFilter);
      return apiClient.get<Paginated<Sale>>(`/api/sales?${params}`, 'Failed to fetch sales');
    },
    placeholderData: (prev) => prev,
  });

  const { data: staffList = [] } = useStaffDirectory();

  return {
    sales: query.data?.data ?? [],
    loading: query.isPending,
    filters: {
      search,
      setSearch,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      paymentFilter,
      setPaymentFilter,
      statusFilter,
      setStatusFilter,
      personFilter,
      setPersonFilter,
    },
    staffList,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)),
    total: query.data?.total ?? 0,
    pageSize: PAGE_SIZE,
    refetch: query.refetch,
  };
}

export type SalesListController = ReturnType<typeof useSalesList>;

export function useSaleDetail(saleId: string | null) {
  return useQuery({
    queryKey: queryKeys.sales.detail(saleId ?? ''),
    queryFn: () => apiClient.get<Sale>(`/api/sales/${saleId}`, 'Failed to fetch sale details'),
    enabled: !!saleId,
  });
}

/** Returns list: fetch + pagination. Only fetches while `enabled` is true. */
export function useReturnsList(enabled: boolean) {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: queryKeys.returns.list({ page }),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: PAGE_SIZE.toString() });
      return apiClient.get<Paginated<ReturnRecord>>(`/api/returns?${params}`, 'Failed to fetch returns');
    },
    enabled,
  });

  return {
    returns: query.data?.data ?? [],
    loading: query.isPending,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)),
    total: query.data?.total ?? 0,
    pageSize: PAGE_SIZE,
    refetch: query.refetch,
  };
}

export type ReturnsListController = ReturnType<typeof useReturnsList>;

export interface ProcessReturnInput {
  saleId: string;
  processedById: string | undefined;
  reason: string;
  notes?: string;
  items: ReturnItemInput[];
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcessReturnInput) =>
      apiClient.post<ReturnRecord>('/api/returns', input, 'Failed to process return'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
    },
  });
}

export interface RecordPaymentInput {
  saleId: string;
  amount: number;
  method: string;
  note?: string;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, ...body }: RecordPaymentInput) =>
      apiClient.post<Sale>(`/api/sales/${saleId}/payments`, body, 'Failed to record payment'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.setQueryData(queryKeys.sales.detail(data.id), data);
    },
  });
}
