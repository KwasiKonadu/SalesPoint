'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  INVENTORY_PAGE_SIZE,
  type Paginated,
  type StockMovement,
} from '@/lib/inventory';

/** Stock Movements tab: paginated movement log with type / product / date filters. */
export function useStockMovements(enabled: boolean) {
  const [data, setData] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [type, setTypeValue] = useState('all');
  const [productId, setProductIdValue] = useState('all');
  const [startDate, setStartDateValue] = useState('');
  const [endDate, setEndDateValue] = useState('');

  // Every filter change also returns to page 1 (done in the setter, not an effect).
  const setType = useCallback((v: string) => {
    setTypeValue(v);
    setPage(1);
  }, []);
  const setProductId = useCallback((v: string) => {
    setProductIdValue(v);
    setPage(1);
  }, []);
  const setStartDate = useCallback((v: string) => {
    setStartDateValue(v);
    setPage(1);
  }, []);
  const setEndDate = useCallback((v: string) => {
    setEndDateValue(v);
    setPage(1);
  }, []);
  const clearFilters = useCallback(() => {
    setTypeValue('all');
    setProductIdValue('all');
    setStartDateValue('');
    setEndDateValue('');
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
        if (type !== 'all') params.set('type', type);
        if (productId !== 'all') params.set('variantId', productId);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const res = await fetch(`/api/stock-movements?${params.toString()}`);
        const json: Paginated<StockMovement> = await res.json();
        if (ignore) return;
        setData(json.data || []);
        setTotal(json.total || 0);
      } catch {
        if (!ignore) toast.error('Failed to load stock movements');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, page, type, productId, startDate, endDate]);

  return {
    data,
    total,
    page,
    setPage,
    loading,
    pageSize: INVENTORY_PAGE_SIZE,
    type,
    setType,
    productId,
    setProductId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hasFilters:
      type !== 'all' || productId !== 'all' || Boolean(startDate) || Boolean(endDate),
    clearFilters,
  };
}
