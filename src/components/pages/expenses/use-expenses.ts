'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  EXPENSES_PAGE_SIZE,
  getFirstDayOfLastMonthISO,
  getFirstDayOfMonthISO,
  getLastDayOfLastMonthISO,
  getTodayISO,
  sumExpenses,
  topExpenseCategory,
  type Expense,
  type ExpenseCategory,
  type ExpenseSummary,
  type ExpensesResponse,
} from '@/lib/expenses';

const EMPTY_SUMMARY: ExpenseSummary = {
  thisMonth: 0,
  lastMonth: 0,
  topCategory: { name: '', amount: 0 },
  transactionCount: 0,
};

/**
 * Expenses list. Category / date filters hit the API; search and payment-method
 * filtering are applied client-side to the loaded page.
 */
export function useExpensesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilterValue] = useState('_all');
  const [startDate, setStartDateValue] = useState('');
  const [endDate, setEndDateValue] = useState('');
  const [paymentFilter, setPaymentFilterValue] = useState('_all');

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

  const query = useQuery({
    queryKey: queryKeys.expenses.list({ page, categoryFilter, startDate, endDate }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(EXPENSES_PAGE_SIZE) });
      if (categoryFilter !== '_all' && categoryFilter) params.set('categoryId', categoryFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      return apiClient.get<ExpensesResponse>(`/api/expenses?${params}`, 'Failed to fetch expenses');
    },
    placeholderData: (prev) => prev,
  });

  const expenses = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

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
    loading: query.isPending,
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
      Boolean(search) || categoryFilter !== '_all' || Boolean(startDate) || Boolean(endDate),
    refetch: query.refetch,
  };
}

export type ExpensesListController = ReturnType<typeof useExpensesList>;

/** The expense-category list, shared by the table filter, form and cards tab. */
export function useExpenseCategories() {
  const query = useQuery({
    queryKey: queryKeys.expenseCategories.all,
    queryFn: () => apiClient.get<ExpenseCategory[]>('/api/expense-categories', 'Failed to fetch expense categories'),
  });
  return { categories: query.data ?? [], refetch: query.refetch };
}

/** This-month / last-month expense totals + top category (non-critical widget). */
export function useExpenseSummary() {
  const query = useQuery({
    queryKey: ['expenses', 'summary'],
    queryFn: async () => {
      const thisMonthParams = new URLSearchParams({
        startDate: getFirstDayOfMonthISO(),
        endDate: getTodayISO(),
        pageSize: '1000',
      });
      const lastMonthParams = new URLSearchParams({
        startDate: getFirstDayOfLastMonthISO(),
        endDate: getLastDayOfLastMonthISO(),
        pageSize: '1000',
      });
      const [thisData, lastData] = await Promise.all([
        apiClient.get<ExpensesResponse>(`/api/expenses?${thisMonthParams}`),
        apiClient.get<ExpensesResponse>(`/api/expenses?${lastMonthParams}`),
      ]);
      const summary: ExpenseSummary = {
        thisMonth: sumExpenses(thisData.data),
        lastMonth: sumExpenses(lastData.data),
        topCategory: topExpenseCategory(thisData.data),
        transactionCount: thisData.total,
      };
      return summary;
    },
  });
  return { summary: query.data ?? EMPTY_SUMMARY, loading: query.isPending, refetch: query.refetch };
}

function invalidateExpenses(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
}

export interface ExpenseSaveInput {
  amount: number;
  date: string;
  paymentMethod?: string;
  description?: string;
  expenseCategoryId?: string;
}

export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ExpenseSaveInput & { id?: string }) =>
      id
        ? apiClient.put<Expense>(`/api/expenses/${id}`, body, 'Failed to save expense')
        : apiClient.post<Expense>('/api/expenses', body, 'Failed to save expense'),
    onSuccess: () => invalidateExpenses(queryClient),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Expense>(`/api/expenses/${id}`, 'Failed to delete expense'),
    onSuccess: () => invalidateExpenses(queryClient),
  });
}

export interface ExpenseCategorySaveInput {
  name: string;
  description?: string;
}

export function useSaveExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ExpenseCategorySaveInput) =>
      apiClient.post<ExpenseCategory>('/api/expense-categories', body, 'Failed to save category'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories.all }),
  });
}
