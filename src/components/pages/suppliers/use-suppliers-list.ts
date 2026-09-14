'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  SUPPLIERS_PAGE_SIZE,
  type Supplier,
  type SuppliersResponse,
} from '@/lib/suppliers';

/** Paginated, searchable suppliers list. */
export function useSuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

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
          page: String(page),
          pageSize: String(SUPPLIERS_PAGE_SIZE),
        });
        if (searchValue.trim()) params.set('search', searchValue.trim());

        const res = await fetch(`/api/suppliers?${params}`);
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        const data: SuppliersResponse = await res.json();
        if (ignore) return;
        setSuppliers(data.data);
        setTotal(data.total);
      } catch {
        if (!ignore) toast.error('Failed to load suppliers');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, searchValue, reloadKey]);

  return {
    suppliers,
    total,
    loading,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages: Math.ceil(total / SUPPLIERS_PAGE_SIZE) || 1,
    pageSize: SUPPLIERS_PAGE_SIZE,
    refetch,
  };
}
