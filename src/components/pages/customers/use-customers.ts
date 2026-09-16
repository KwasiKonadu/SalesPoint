'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  CUSTOMERS_PAGE_SIZE,
  type Customer,
  type CustomerDetail,
  type CustomersResponse,
} from '@/lib/customers';

/** Paginated, searchable customers list. */
export function useCustomersList() {
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const query = useQuery({
    queryKey: queryKeys.customers.list({ search: searchValue, page }),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: CUSTOMERS_PAGE_SIZE.toString() });
      if (searchValue) params.set('search', searchValue);
      return apiClient.get<CustomersResponse>(`/api/customers?${params}`, 'Failed to fetch customers');
    },
    placeholderData: (prev) => prev,
  });

  return {
    customers: query.data?.data ?? [],
    loading: query.isPending,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil((query.data?.total ?? 0) / CUSTOMERS_PAGE_SIZE)),
    total: query.data?.total ?? 0,
    pageSize: CUSTOMERS_PAGE_SIZE,
    refetch: query.refetch,
  };
}

export function useCustomerDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () => apiClient.get<CustomerDetail>(`/api/customers/${id}`, 'Failed to fetch customer details'),
    enabled: !!id,
  });
}

export interface CustomerSaveInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CustomerSaveInput & { id?: string }) =>
      id
        ? apiClient.put<Customer>(`/api/customers/${id}`, body, 'Failed to update customer')
        : apiClient.post<Customer>('/api/customers', body, 'Failed to add customer'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Customer>(`/api/customers/${id}`, 'Failed to delete customer'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}
