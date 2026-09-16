'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardData } from '@/lib/dashboard';

/** Loads `/api/dashboard`. */
export function useDashboard() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.all({}),
    queryFn: () => apiClient.get<DashboardData>('/api/dashboard', 'Failed to fetch dashboard data'),
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.isError ? (query.error instanceof Error ? query.error.message : 'Something went wrong') : null,
    refetch: query.refetch,
  };
}
