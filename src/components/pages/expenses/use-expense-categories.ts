'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ExpenseCategory } from '@/lib/expenses';

/** The expense-category list, shared by the table filter, form and cards tab. */
export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/expense-categories');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!ignore) setCategories(data);
      } catch {
        // silent
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  return { categories, refetch };
}
