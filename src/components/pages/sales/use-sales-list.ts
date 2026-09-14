'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Paginated, Sale, StaffMember } from '@/lib/sales';

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
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Bumping this key forces a refetch without touching the filters.
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  const resetPage = useCallback(() => setPage(1), []);
  const [search, setSearch] = usePagedFilter('', resetPage);
  const [startDate, setStartDate] = usePagedFilter('', resetPage);
  const [endDate, setEndDate] = usePagedFilter('', resetPage);
  const [paymentFilter, setPaymentFilter] = usePagedFilter('all', resetPage);
  const [statusFilter, setStatusFilter] = usePagedFilter('all', resetPage);
  const [personFilter, setPersonFilter] = usePagedFilter('all', resetPage);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
        });
        if (search) params.set('search', search);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (paymentFilter !== 'all') params.set('paymentMethod', paymentFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (personFilter !== 'all') params.set('soldById', personFilter);

        const res = await fetch(`/api/sales?${params}`);
        if (!res.ok) throw new Error('Failed to fetch sales');
        const data: Paginated<Sale> = await res.json();
        if (ignore) return;
        setSales(data.data);
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
      } catch {
        if (!ignore) toast.error('Failed to load sales');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [
    page,
    search,
    startDate,
    endDate,
    paymentFilter,
    statusFilter,
    personFilter,
    reloadKey,
  ]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/staff');
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setStaffList(Array.isArray(data) ? data : (data.data ?? []));
      } catch {
        // silently fail
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return {
    sales,
    loading,
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
    totalPages,
    total,
    pageSize: PAGE_SIZE,
    refetch,
  };
}

export type SalesListController = ReturnType<typeof useSalesList>;
