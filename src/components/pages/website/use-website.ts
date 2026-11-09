'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { PromoSlotItem, Promises, SlotType, StoreDetails } from '@/lib/website';

export function useSlots() {
  return useQuery({
    queryKey: queryKeys.website.slots,
    queryFn: () => apiClient.get<{ data: PromoSlotItem[] }>('/api/website/slots', 'Failed to load homepage slots'),
    select: (r) => r.data,
  });
}

export type SlotInput = Partial<Omit<PromoSlotItem, 'id' | 'type'>>;

/** Create or update the one slot of a given type. */
export function useSaveSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, ...body }: SlotInput & { type: SlotType }) =>
      apiClient.put<PromoSlotItem>(`/api/website/slots/${type}`, body, 'Failed to save slot'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.website.slots }),
  });
}

export function usePromises() {
  return useQuery({
    queryKey: queryKeys.website.promises,
    queryFn: () => apiClient.get<{ configured: boolean; promises: Promises }>('/api/website/promises', 'Failed to load promises'),
  });
}

/** Saves the whole promises object (each popup edits its part and sends the merged result). */
export function useSavePromises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promises: Promises) => apiClient.put<{ configured: boolean; promises: Promises }>('/api/website/promises', promises, 'Failed to save'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.website.promises }),
  });
}

export interface BusinessContacts { name: string; email: string; phone: string; address: string }

export function useStoreDetails() {
  return useQuery({
    queryKey: queryKeys.website.store,
    queryFn: () => apiClient.get<{ details: StoreDetails; business: BusinessContacts }>('/api/website/store', 'Failed to load store details'),
  });
}

export function useSaveStoreDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (details: StoreDetails) => apiClient.put<{ details: StoreDetails }>('/api/website/store', details, 'Failed to save'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.website.store }),
  });
}
