'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PosCategory, PosCustomer, PosProduct } from '@/lib/pos';

/**
 * Loads the POS catalog (products + categories + customers) and owns the
 * search / category-filter state, including the 300ms search debounce.
 */
export function usePosCatalog() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    async (search = '', categoryId: string | null = null) => {
      try {
        setProductsError(null);
        const params = new URLSearchParams({ status: 'active' });
        if (search) params.set('search', search);
        if (categoryId) params.set('categoryId', categoryId);
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data.data || data || []);
      } catch (err) {
        setProductsError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    },
    [],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [fetchProducts, fetchCategories, fetchCustomers]);

  const search = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setProductsLoading(true);
        fetchProducts(value, selectedCategoryId);
      }, 300);
    },
    [fetchProducts, selectedCategoryId],
  );

  const filterByCategory = useCallback(
    (categoryId: string | null) => {
      setSelectedCategoryId(categoryId);
      setProductsLoading(true);
      fetchProducts(searchQuery, categoryId);
    },
    [fetchProducts, searchQuery],
  );

  const retry = useCallback(() => {
    setProductsLoading(true);
    fetchProducts(searchQuery, selectedCategoryId);
  }, [fetchProducts, searchQuery, selectedCategoryId]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    filterByCategory(null);
  }, [filterByCategory]);

  const addCustomer = useCallback((customer: PosCustomer) => {
    setCustomers((prev) => [...prev, customer]);
  }, []);

  return {
    products,
    categories,
    customers,
    productsLoading,
    productsError,
    searchQuery,
    selectedCategoryId,
    hasFilters: Boolean(searchQuery || selectedCategoryId),
    search,
    filterByCategory,
    retry,
    clearFilters,
    addCustomer,
  };
}
