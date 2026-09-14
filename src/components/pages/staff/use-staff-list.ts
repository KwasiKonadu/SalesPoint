'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { STAFF_PAGE_SIZE, type StaffMember } from '@/lib/staff';

/** Paginated, searchable staff list. */
export function useStaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // A new search term also returns to page 1.
  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchValue) params.set('search', searchValue);
        params.set('page', String(page));
        params.set('pageSize', String(STAFF_PAGE_SIZE));

        const res = await fetch(`/api/staff?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch staff');
        const data = await res.json();
        if (ignore) return;

        const list: StaffMember[] = Array.isArray(data)
          ? data
          : data.staff || data.data || [];
        const totalCount = Array.isArray(data)
          ? data.length
          : data.total || list.length;
        setStaff(list);
        setTotalPages(Math.max(1, Math.ceil(totalCount / STAFF_PAGE_SIZE)));
      } catch {
        if (!ignore) toast.error('Failed to load staff members');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [searchValue, page, reloadKey]);

  return {
    staff,
    loading,
    search: searchValue,
    setSearch,
    page,
    setPage,
    totalPages,
    refetch,
  };
}
