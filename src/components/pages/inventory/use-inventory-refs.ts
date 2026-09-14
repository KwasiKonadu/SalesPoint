'use client';

import { useEffect, useState } from 'react';

import type { Category, InventoryProduct, Supplier } from '@/lib/inventory';

/** Categories, suppliers and the active-product list shared by all three tabs. */
export function useInventoryRefs() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [catRes, supRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/suppliers?pageSize=100'),
          fetch('/api/products?status=active&pageSize=200'),
        ]);
        const [catJson, supJson, prodJson] = await Promise.all([
          catRes.json(),
          supRes.json(),
          prodRes.json(),
        ]);
        if (ignore) return;
        setCategories(catJson.data || []);
        setSuppliers(supJson.data || []);
        setProducts(prodJson.data || []);
      } catch {
        // Non-critical
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return { categories, suppliers, products };
}
