'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Unit } from '@/lib/settings';

export function useUnits() {
  return useQuery({
    queryKey: queryKeys.units.all,
    queryFn: () => apiClient.get<Unit[]>('/api/units', 'Failed to fetch units'),
  });
}

export interface UnitSaveInput {
  name: string;
  shortName?: string | null;
}

export function useSaveUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UnitSaveInput & { id?: string }) =>
      id
        ? apiClient.put<Unit>(`/api/units/${id}`, body, 'Failed to save unit')
        : apiClient.post<Unit>('/api/units', body, 'Failed to save unit'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.units.all }),
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Unit>(`/api/units/${id}`, 'Failed to delete unit'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.units.all }),
  });
}
