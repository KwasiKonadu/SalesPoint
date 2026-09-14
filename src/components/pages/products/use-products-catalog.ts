'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type {
  Category,
  ProductItem,
  ProductType,
  ProductsResponse,
  Unit,
} from '@/lib/products';

const PAGE_SIZE = 20;

/**
 * Products list + supporting reference data (filter categories, product types,
 * units). Owns search debounce, filters and pagination.
 */
export function useProductsCatalog() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilterValue] = useState('_all');
  const [statusFilter, setStatusFilterValue] = useState('active');
  const [page, setPage] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Filter changes go back to page 1 (done in the setter, not an effect).
  const setCategoryFilter = useCallback((value: string) => {
    setCategoryFilterValue(value);
    setPage(1);
  }, []);
  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterValue(value);
    setPage(1);
  }, []);

  // Debounce the search box; committing a new query also resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const reloadFilterCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch {
      // silent
    }
  }, []);

  const loadMetaData = useCallback(async () => {
    try {
      const [typesRes, unitsRes] = await Promise.all([
        fetch('/api/product-types'),
        fetch('/api/units'),
      ]);
      if (typesRes.ok) setProductTypes(await typesRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      await reloadFilterCategories();
      if (!ignore) await loadMetaData();
    })();
    return () => {
      ignore = true;
    };
  }, [reloadFilterCategories, loadMetaData]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (categoryFilter !== '_all') params.set('categoryId', categoryFilter);
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data: ProductsResponse = await res.json();
          if (ignore) return;
          setProducts(data.data);
          setTotal(data.total);
        }
      } catch {
        if (!ignore) toast.error('Failed to load products');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, debouncedSearch, categoryFilter, statusFilter, reloadKey]);

  const refreshAll = useCallback(() => {
    refresh();
    void reloadFilterCategories();
  }, [refresh, reloadFilterCategories]);

  return {
    products,
    total,
    loading,
    categories,
    productTypes,
    units,
    search,
    setSearch,
    debouncedSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages,
    hasFilters: Boolean(debouncedSearch) || categoryFilter !== '_all',
    refresh,
    refreshAll,
    reloadFilterCategories,
  };
}

export type ProductsCatalogController = ReturnType<typeof useProductsCatalog>;
