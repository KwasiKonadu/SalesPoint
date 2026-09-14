'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { ProductType, Unit } from '@/lib/settings';

/** Loads the product-type and unit lists for the Product Config tab. */
export function useProductConfig() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const [ptRes, uRes] = await Promise.all([
          fetch('/api/product-types'),
          fetch('/api/units'),
        ]);
        if (!ptRes.ok || !uRes.ok) throw new Error('Failed to fetch');
        const ptData = await ptRes.json();
        const uData = await uRes.json();
        if (ignore) return;
        setProductTypes(Array.isArray(ptData) ? ptData : []);
        setUnits(Array.isArray(uData) ? uData : []);
      } catch {
        if (!ignore) toast.error('Failed to load product configuration');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  return { productTypes, units, loading, refetch };
}
