'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  EXPENSES_PAGE_SIZE,
  type Expense,
  type ExpensesResponse,
} from '@/lib/expenses';

/**
 * Expenses list. Category / date filters hit the API; search and payment-method
 * filtering are applied client-side to the loaded page.
 */
export function useExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilterValue] = useState('_all');
  const [startDate, setStartDateValue] = useState('');
  const [endDate, setEndDateValue] = useState('');
  const [paymentFilter, setPaymentFilterValue] = useState('_all');

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // Every filter change returns to page 1 (done in the setter, not an effect).
  const setCategoryFilter = useCallback((v: string) => {
    setCategoryFilterValue(v);
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
  const setPaymentFilter = useCallback((v: string) => {
    setPaymentFilterValue(v);
    setPage(1);
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(EXPENSES_PAGE_SIZE),
        });
        if (categoryFilter !== '_all' && categoryFilter) {
          params.set('categoryId', categoryFilter);
        }
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const res = await fetch(`/api/expenses?${params}`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const data: ExpensesResponse = await res.json();
        if (ignore) return;
        setExpenses(data.data);
        setTotal(data.total);
      } catch {
        if (!ignore) toast.error('Failed to load expenses');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, categoryFilter, startDate, endDate, reloadKey]);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          e.createdBy?.name.toLowerCase().includes(q),
      );
    }
    if (paymentFilter !== '_all') {
      result = result.filter((e) => e.paymentMethod === paymentFilter);
    }
    return result;
  }, [expenses, search, paymentFilter]);

  return {
    expenses: filteredExpenses,
    total,
    loading,
    page,
    setPage,
    totalPages: Math.ceil(total / EXPENSES_PAGE_SIZE) || 1,
    pageSize: EXPENSES_PAGE_SIZE,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    paymentFilter,
    setPaymentFilter,
    hasFilters:
      Boolean(search) ||
      categoryFilter !== '_all' ||
      Boolean(startDate) ||
      Boolean(endDate),
    refetch,
  };
}

export type ExpensesListController = ReturnType<typeof useExpensesList>;
