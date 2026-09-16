'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  SUPPLIERS_PAGE_SIZE,
  type Supplier,
  type SupplierDetail,
  type SuppliersResponse,
} from '@/lib/suppliers';

/** Paginated, searchable suppliers list. */
export function useSuppliersList() {
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const query = useQuery({
    queryKey: queryKeys.suppliers.list({ search: searchValue, page }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(SUPPLIERS_PAGE_SIZE) });
      if (searchValue.trim()) params.set('search', searchValue.trim());
      return apiClient.get<SuppliersResponse>(`/api/suppliers?${params}`, 'Failed to fetch suppliers');
    },
    placeholderData: (prev) => prev,
  });

  return {
    suppliers: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    loading: query.isPending,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages: Math.ceil((query.data?.total ?? 0) / SUPPLIERS_PAGE_SIZE) || 1,
    pageSize: SUPPLIERS_PAGE_SIZE,
    refetch: query.refetch,
  };
}

export function useSupplierDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id ?? ''),
    queryFn: () => apiClient.get<SupplierDetail>(`/api/suppliers/${id}`, 'Failed to load supplier details'),
    enabled: !!id,
  });
}

export interface SupplierSaveInput {
  businessName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: SupplierSaveInput & { id?: string }) =>
      id
        ? apiClient.put<Supplier>(`/api/suppliers/${id}`, body, 'Failed to save supplier')
        : apiClient.post<Supplier>('/api/suppliers', body, 'Failed to save supplier'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Supplier>(`/api/suppliers/${id}`, 'Failed to delete supplier'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}
