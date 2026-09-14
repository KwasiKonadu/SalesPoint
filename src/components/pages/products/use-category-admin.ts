'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Category } from '@/lib/products';

/**
 * Categories management list (`/api/categories?all=true`, with product counts).
 * Only fetches while `enabled` is true — i.e. the Categories tab is open.
 */
export function useCategoryAdmin(enabled: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/categories?all=true');
        if (res.ok && !ignore) setCategories(await res.json());
      } catch {
        // silent
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled, reloadKey]);

  return { categories, loading, refresh };
}
