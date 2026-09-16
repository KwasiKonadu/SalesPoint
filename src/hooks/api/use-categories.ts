'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Category } from '@/lib/products';

/** Active categories (filter dropdowns) — pass `all: true` for management views. */
export function useCategories(options: { all?: boolean; enabled?: boolean } = {}) {
  const { all = false, enabled = true } = options;
  return useQuery({
    queryKey: [...queryKeys.categories.all, { all }],
    queryFn: () => apiClient.get<Category[]>(`/api/categories${all ? '?all=true' : ''}`, 'Failed to fetch categories'),
    enabled,
  });
}

export interface CategorySaveInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CategorySaveInput & { id?: string }) =>
      id
        ? apiClient.put<Category>(`/api/categories/${id}`, body, 'Failed to save category')
        : apiClient.post<Category>('/api/categories', body, 'Failed to save category'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Category>(`/api/categories/${id}`, 'Failed to delete category'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
