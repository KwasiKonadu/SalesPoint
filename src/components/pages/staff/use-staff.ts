'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { STAFF_PAGE_SIZE, type StaffMember } from '@/lib/staff';

interface StaffListResponse {
  staff: StaffMember[];
  total: number;
}

async function fetchStaff(search: string, page: number): Promise<StaffListResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('pageSize', String(STAFF_PAGE_SIZE));

  const data = await apiClient.get<StaffMember[] | { staff?: StaffMember[]; data?: StaffMember[]; total?: number }>(
    `/api/staff?${params.toString()}`,
    'Failed to fetch staff',
  );

  const list: StaffMember[] = Array.isArray(data) ? data : data.staff || data.data || [];
  const total = Array.isArray(data) ? data.length : data.total || list.length;
  return { staff: list, total };
}

/** Full staff list, unpaginated — powers the "Sales Person" filter dropdown. */
export function useStaffDirectory() {
  return useQuery({
    queryKey: queryKeys.staff.list({}),
    queryFn: () => fetchStaff('', 1),
    select: (data) => data.staff,
  });
}

/** Paginated, searchable staff list. */
export function useStaffList() {
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const query = useQuery({
    queryKey: queryKeys.staff.list({ search: searchValue, page }),
    queryFn: () => fetchStaff(searchValue, page),
    placeholderData: (prev) => prev,
  });

  return {
    staff: query.data?.staff ?? [],
    loading: query.isPending,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil((query.data?.total ?? 0) / STAFF_PAGE_SIZE)),
    refetch: query.refetch,
  };
}

export interface StaffSaveInput {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  password?: string;
}

/** Create or update a staff member — pass `id` to update. */
export function useSaveStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: StaffSaveInput & { id?: string }) =>
      id
        ? apiClient.put<StaffMember>(`/api/staff/${id}`, body, 'Failed to save staff')
        : apiClient.post<StaffMember>('/api/staff', body, 'Failed to save staff'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<StaffMember>(`/api/staff/${id}`, 'Failed to deactivate staff'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
