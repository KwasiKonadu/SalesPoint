'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useCategories } from '@/hooks/api/use-categories';
import { useProductTypes } from '@/hooks/api/use-product-types';
import { useUnits } from '@/hooks/api/use-units';
import type { ProductItem, ProductsResponse } from '@/lib/products';

const PAGE_SIZE = 20;

/**
 * Products list + supporting reference data (filter categories, product types,
 * units). Owns search debounce, filters and pagination.
 */
export function useProductsCatalog() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilterValue] = useState('_all');
  const [statusFilter, setStatusFilterValue] = useState('active');
  const [page, setPage] = useState(1);

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

  const filterCategories = useCategories();
  const productTypes = useProductTypes();
  const units = useUnits();

  const listParams = { page, pageSize: PAGE_SIZE, search: debouncedSearch, categoryFilter, statusFilter };
  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(listParams),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (categoryFilter !== '_all') params.set('categoryId', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      return apiClient.get<ProductsResponse>(`/api/products?${params.toString()}`, 'Failed to load products');
    },
    placeholderData: (prev) => prev,
  });

  const total = productsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    products: productsQuery.data?.data ?? [],
    total,
    loading: productsQuery.isPending,
    categories: filterCategories.data ?? [],
    productTypes: productTypes.data ?? [],
    units: units.data ?? [],
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
  };
}

export type ProductsCatalogController = ReturnType<typeof useProductsCatalog>;

/** All products, for the "existing product names" dropdown in the product form. */
export function useAllProducts(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.products.list({ pageSize: 500 }),
    queryFn: () => apiClient.get<ProductsResponse>('/api/products?pageSize=500', 'Failed to load products'),
    enabled,
    select: (data) => data.data,
  });
}

export interface ProductSaveInput {
  name: string;
  sku?: string;
  container?: string | null;
  size?: string | null;
  description?: string;
  categoryId?: string;
  productTypeId?: string;
  unitId?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  packSize?: number | null;
  taxEnabled: boolean;
  taxRate: number;
  lowStockPercent: number;
  image?: string;
  initialStock?: number;
  isActive?: boolean;
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ProductSaveInput & { id?: string }) =>
      id
        ? apiClient.put<ProductItem>(`/api/products/${id}`, body, 'Failed to save product')
        : apiClient.post<ProductItem>('/api/products', body, 'Failed to save product'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<ProductItem>(`/api/products/${id}`, 'Failed to delete product'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}
