'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Paginated, ReturnRecord } from '@/lib/sales';

const PAGE_SIZE = 10;

/** Returns list: fetch + pagination. Only fetches while `enabled` is true. */
export function useReturnsList(enabled: boolean) {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bumping this key forces a refetch without touching the page.
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
        });
        const res = await fetch(`/api/returns?${params}`);
        if (!res.ok) throw new Error('Failed to fetch returns');
        const data: Paginated<ReturnRecord> = await res.json();
        if (ignore) return;
        setReturns(data.data);
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
      } catch {
        if (!ignore) toast.error('Failed to load returns');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, page, reloadKey]);

  return {
    returns,
    loading,
    page,
    setPage,
    totalPages,
    total,
    pageSize: PAGE_SIZE,
    refetch,
  };
}

export type ReturnsListController = ReturnType<typeof useReturnsList>;
