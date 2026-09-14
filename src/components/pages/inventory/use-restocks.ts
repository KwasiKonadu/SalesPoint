'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  INVENTORY_PAGE_SIZE,
  type Paginated,
  type Restock,
} from '@/lib/inventory';

/** Restock tab: paginated restock list with supplier / payment-status filters. */
export function useRestocks(enabled: boolean) {
  const [data, setData] = useState<Restock[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [supplierFilter, setSupplierFilterValue] = useState('all');
  const [paymentFilter, setPaymentFilterValue] = useState('all');

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const setSupplierFilter = useCallback((v: string) => {
    setSupplierFilterValue(v);
    setPage(1);
  }, []);
  const setPaymentFilter = useCallback((v: string) => {
    setPaymentFilterValue(v);
    setPage(1);
  }, []);

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
        if (supplierFilter !== 'all') params.set('supplierId', supplierFilter);
        if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);

        const res = await fetch(`/api/restock?${params.toString()}`);
        const json: Paginated<Restock> = await res.json();
        if (ignore) return;
        setData(json.data || []);
        setTotal(json.total || 0);
      } catch {
        if (!ignore) toast.error('Failed to load restocks');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, page, supplierFilter, paymentFilter, reloadKey]);

  return {
    data,
    total,
    page,
    setPage,
    loading,
    pageSize: INVENTORY_PAGE_SIZE,
    supplierFilter,
    setSupplierFilter,
    paymentFilter,
    setPaymentFilter,
    hasFilters: supplierFilter !== 'all' || paymentFilter !== 'all',
    refresh,
  };
}
