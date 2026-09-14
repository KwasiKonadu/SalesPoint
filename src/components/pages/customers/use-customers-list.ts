'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  CUSTOMERS_PAGE_SIZE,
  type Customer,
  type CustomersResponse,
} from '@/lib/customers';

/** Paginated, searchable customers list. */
export function useCustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // A new search term also returns to page 1 (handled here, not in an effect).
  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: CUSTOMERS_PAGE_SIZE.toString(),
        });
        if (searchValue) params.set('search', searchValue);

        const res = await fetch(`/api/customers?${params}`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data: CustomersResponse = await res.json();
        if (ignore) return;
        setCustomers(data.data);
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / CUSTOMERS_PAGE_SIZE)));
      } catch {
        if (!ignore) toast.error('Failed to load customers');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, searchValue, reloadKey]);

  return {
    customers,
    loading,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages,
    total,
    pageSize: CUSTOMERS_PAGE_SIZE,
    refetch,
  };
}
