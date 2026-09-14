'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  computeInventorySummary,
  INVENTORY_PAGE_SIZE,
  sortInventory,
  type InventoryItem,
  type InventorySummary,
  type Paginated,
} from '@/lib/inventory';

/** Stock Overview tab: paginated inventory list, filters, sort and summary tiles. */
export function useInventoryOverview(enabled: boolean) {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategoryValue] = useState('all');
  const [status, setStatusValue] = useState('all');

  const [sortField, setSortField] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryKey, setSummaryKey] = useState(0);
  const summaryLoadedRef = useRef(false);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const refreshSummary = useCallback(() => {
    summaryLoadedRef.current = false;
    setSummaryKey((k) => k + 1);
  }, []);

  const setCategory = useCallback((value: string) => {
    setCategoryValue(value);
    setPage(1);
  }, []);
  const setStatus = useCallback((value: string) => {
    setStatusValue(value);
    setPage(1);
  }, []);
  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryValue('all');
    setStatusValue('all');
    setPage(1);
  }, []);

  // Debounce the search box; a new committed query also resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: String(INVENTORY_PAGE_SIZE),
        });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (category !== 'all') params.set('categoryId', category);
        if (status !== 'all') params.set('status', status);

        const res = await fetch(`/api/inventory?${params.toString()}`);
        const json: Paginated<InventoryItem> = await res.json();
        if (ignore) return;
        setData(json.data || []);
        setTotal(json.total || 0);
      } catch {
        if (!ignore) toast.error('Failed to load inventory');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, page, debouncedSearch, category, status, reloadKey]);

  // Summary is loaded once when the tab first opens, then only on refreshSummary().
  useEffect(() => {
    if (!enabled || summaryLoadedRef.current) return;
    summaryLoadedRef.current = true;
    let ignore = false;
    (async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch('/api/inventory?pageSize=500');
        const json: Paginated<InventoryItem> = await res.json();
        if (!ignore) setSummary(computeInventorySummary(json.data || [], json.total || 0));
      } catch {
        // Non-critical
      } finally {
        if (!ignore) setSummaryLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, summaryKey]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const sortedData = useMemo(
    () => sortInventory(data, sortField, sortDir),
    [data, sortField, sortDir],
  );

  return {
    data: sortedData,
    total,
    page,
    setPage,
    loading,
    pageSize: INVENTORY_PAGE_SIZE,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    hasFilters: Boolean(search) || category !== 'all' || status !== 'all',
    clearFilters,
    sortField,
    sortDir,
    handleSort,
    summary,
    summaryLoading,
    refresh,
    refreshSummary,
  };
}
