'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { BusinessSettings } from '@/lib/settings';

export function useBusinessSettingsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.businessSettings.all,
    queryFn: () => apiClient.get<BusinessSettings>('/api/business-settings', 'Failed to fetch business settings'),
    enabled: options.enabled ?? true,
  });
}

export function useSaveBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessSettings) =>
      apiClient.put<BusinessSettings>('/api/business-settings', payload, 'Failed to save business settings'),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.businessSettings.all, data);
    },
  });
}
