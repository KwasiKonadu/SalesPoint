'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { PosCategory, PosCustomer, PosProduct, SaleResponse } from '@/lib/pos';

/**
 * Loads the POS catalog (products + categories + customers) and owns the
 * search / category-filter state, including the 300ms search debounce.
 */
export function usePosCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: [...queryKeys.pos.catalog, 'products', { debouncedSearch, selectedCategoryId }],
    queryFn: () => {
      const params = new URLSearchParams({ status: 'active' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
      return apiClient.get<{ data?: PosProduct[] } | PosProduct[]>(`/api/products?${params.toString()}`, 'Failed to load products');
    },
    select: (data) => (Array.isArray(data) ? data : data.data ?? []),
  });

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.pos.catalog, 'categories'],
    queryFn: () => apiClient.get<{ data?: PosCategory[] } | PosCategory[]>('/api/categories', 'Failed to load categories'),
    select: (data) => (Array.isArray(data) ? data : data.data ?? []),
  });

  const customersQuery = useQuery({
    queryKey: [...queryKeys.pos.catalog, 'customers'],
    queryFn: () => apiClient.get<{ data?: PosCustomer[] } | PosCustomer[]>('/api/customers', 'Failed to load customers'),
    select: (data) => (Array.isArray(data) ? data : data.data ?? []),
  });

  const search = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const filterByCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategoryId(null);
  }, []);

  const addCustomer = useCallback(
    (customer: PosCustomer) => {
      queryClient.setQueryData<PosCustomer[]>(
        [...queryKeys.pos.catalog, 'customers'],
        (prev) => [...(prev ?? []), customer],
      );
    },
    [queryClient],
  );

  return {
    products: productsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    customers: customersQuery.data ?? [],
    productsLoading: productsQuery.isPending,
    productsError: productsQuery.isError ? 'Failed to load products' : null,
    searchQuery,
    selectedCategoryId,
    hasFilters: Boolean(searchQuery || selectedCategoryId),
    search,
    filterByCategory,
    retry: productsQuery.refetch,
    clearFilters,
    addCustomer,
  };
}

export type PosCatalogController = ReturnType<typeof usePosCatalog>;

export interface CheckoutInput {
  soldById: string;
  customerId: string | null;
  items: { productId: string; quantity: number; wholesale: boolean }[];
  discountAmount: number;
  taxAmount: number;
  paymentMethod: string;
  amountReceived: number;
}

function invalidatePos(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.pos.catalog });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CheckoutInput) => apiClient.post<SaleResponse>('/api/sales', body, 'Sale failed'),
    onSuccess: () => invalidatePos(queryClient),
  });
}
