'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getFirstDayOfLastMonthISO,
  getFirstDayOfMonthISO,
  getLastDayOfLastMonthISO,
  getTodayISO,
  sumExpenses,
  topExpenseCategory,
  type ExpenseSummary,
  type ExpensesResponse,
} from '@/lib/expenses';

const EMPTY: ExpenseSummary = {
  thisMonth: 0,
  lastMonth: 0,
  topCategory: { name: '', amount: 0 },
  transactionCount: 0,
};

/** This-month / last-month expense totals + top category (non-critical widget). */
export function useExpenseSummary() {
  const [summary, setSummary] = useState<ExpenseSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
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
        const [thisRes, lastRes] = await Promise.all([
          fetch(`/api/expenses?${thisMonthParams}`),
          fetch(`/api/expenses?${lastMonthParams}`),
        ]);
        if (!thisRes.ok || !lastRes.ok) throw new Error();
        const thisData: ExpensesResponse = await thisRes.json();
        const lastData: ExpensesResponse = await lastRes.json();
        if (ignore) return;
        setSummary({
          thisMonth: sumExpenses(thisData.data),
          lastMonth: sumExpenses(lastData.data),
          topCategory: topExpenseCategory(thisData.data),
          transactionCount: thisData.total,
        });
      } catch {
        // silent — summary is non-critical
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  return { summary, loading, refetch };
}
