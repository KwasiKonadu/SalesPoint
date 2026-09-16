'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ProductType } from '@/lib/settings';

export function useProductTypes() {
  return useQuery({
    queryKey: queryKeys.productTypes.all,
    queryFn: () => apiClient.get<ProductType[]>('/api/product-types', 'Failed to fetch product types'),
  });
}

export interface ProductTypeSaveInput {
  name: string;
  description?: string | null;
  tracksStock: boolean;
}

export function useSaveProductType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ProductTypeSaveInput & { id?: string }) =>
      id
        ? apiClient.put<ProductType>(`/api/product-types/${id}`, body, 'Failed to save product type')
        : apiClient.post<ProductType>('/api/product-types', body, 'Failed to save product type'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.productTypes.all }),
  });
}

export function useDeleteProductType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<ProductType>(`/api/product-types/${id}`, 'Failed to delete product type'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.productTypes.all }),
  });
}
