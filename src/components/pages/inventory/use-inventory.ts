'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  computeInventorySummary,
  INVENTORY_PAGE_SIZE,
  sortInventory,
  type Category,
  type InventoryItem,
  type InventoryProduct,
  type Paginated,
  type Restock,
  type StockMovement,
  type Supplier,
} from '@/lib/inventory';

/** Stock Overview tab: paginated inventory list, filters, sort and summary tiles. */
export function useInventoryOverview(enabled: boolean) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategoryValue] = useState('all');
  const [status, setStatusValue] = useState('all');

  const [sortField, setSortField] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const setCategory = useCallback((value: string) => {
    setCategoryValue(value);
    setPage(1);
  }, []);
  const setStatus = useCallback((value: string) => {
    setStatusValue(value);
    setPage(1);
  }, []);
  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryValue('all');
    setStatusValue('all');
    setPage(1);
  }, []);

  // Debounce the search box; a new committed query also resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: queryKeys.inventory.overview({ page, debouncedSearch, category, status }),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: String(INVENTORY_PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== 'all') params.set('categoryId', category);
      if (status !== 'all') params.set('status', status);
      return apiClient.get<Paginated<InventoryItem>>(`/api/inventory?${params.toString()}`, 'Failed to load inventory');
    },
    enabled,
    placeholderData: (prev) => prev,
  });

  const summaryQuery = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const json = await apiClient.get<Paginated<InventoryItem>>('/api/inventory?pageSize=500', 'Failed to load inventory summary');
      return computeInventorySummary(json.data || [], json.total || 0);
    },
    enabled,
  });

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const sortedData = useMemo(
    () => sortInventory(query.data?.data ?? [], sortField, sortDir),
    [query.data, sortField, sortDir],
  );

  return {
    data: sortedData,
    total: query.data?.total ?? 0,
    page,
    setPage,
    loading: query.isPending,
    pageSize: INVENTORY_PAGE_SIZE,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    hasFilters: Boolean(search) || category !== 'all' || status !== 'all',
    clearFilters,
    sortField,
    sortDir,
    handleSort,
    summary: summaryQuery.data ?? null,
    summaryLoading: summaryQuery.isPending,
    refresh: query.refetch,
    refreshSummary: summaryQuery.refetch,
  };
}

/** Categories, suppliers and the active-product list shared by all three tabs. */
export function useInventoryRefs() {
  const query = useQuery({
    queryKey: queryKeys.inventory.refs,
    queryFn: async () => {
      const [catJson, supJson, prodJson] = await Promise.all([
        apiClient.get<{ data?: Category[] } | Category[]>('/api/categories', 'Failed to load categories'),
        apiClient.get<{ data?: Supplier[] }>('/api/suppliers?pageSize=100', 'Failed to load suppliers'),
        apiClient.get<{ data?: InventoryProduct[] }>('/api/products?status=active&pageSize=500', 'Failed to load products'),
      ]);
      return {
        categories: Array.isArray(catJson) ? catJson : catJson.data || [],
        suppliers: supJson.data || [],
        products: prodJson.data || [],
      };
    },
  });

  return {
    categories: query.data?.categories ?? [],
    suppliers: query.data?.suppliers ?? [],
    products: query.data?.products ?? [],
  };
}

/** Stock Movements tab: paginated movement log with type / product / date filters. */
export function useStockMovements(enabled: boolean) {
  const [page, setPage] = useState(1);
  const [type, setTypeValue] = useState('all');
  const [productId, setProductIdValue] = useState('all');
  const [startDate, setStartDateValue] = useState('');
  const [endDate, setEndDateValue] = useState('');

  const setType = useCallback((v: string) => {
    setTypeValue(v);
    setPage(1);
  }, []);
  const setProductId = useCallback((v: string) => {
    setProductIdValue(v);
    setPage(1);
  }, []);
  const setStartDate = useCallback((v: string) => {
    setStartDateValue(v);
    setPage(1);
  }, []);
  const setEndDate = useCallback((v: string) => {
    setEndDateValue(v);
    setPage(1);
  }, []);
  const clearFilters = useCallback(() => {
    setTypeValue('all');
    setProductIdValue('all');
    setStartDateValue('');
    setEndDateValue('');
    setPage(1);
  }, []);

  const query = useQuery({
    queryKey: queryKeys.inventory.stockMovements({ page, type, productId, startDate, endDate }),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: String(INVENTORY_PAGE_SIZE) });
      if (type !== 'all') params.set('type', type);
      if (productId !== 'all') params.set('variantId', productId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      return apiClient.get<Paginated<StockMovement>>(`/api/stock-movements?${params.toString()}`, 'Failed to load stock movements');
    },
    enabled,
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page,
    setPage,
    loading: query.isPending,
    pageSize: INVENTORY_PAGE_SIZE,
    type,
    setType,
    productId,
    setProductId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hasFilters: type !== 'all' || productId !== 'all' || Boolean(startDate) || Boolean(endDate),
    clearFilters,
  };
}

/** Restock tab: paginated restock list with supplier / payment-status filters. */
export function useRestocks(enabled: boolean) {
  const [page, setPage] = useState(1);
  const [supplierFilter, setSupplierFilterValue] = useState('all');
  const [paymentFilter, setPaymentFilterValue] = useState('all');

  const setSupplierFilter = useCallback((v: string) => {
    setSupplierFilterValue(v);
    setPage(1);
  }, []);
  const setPaymentFilter = useCallback((v: string) => {
    setPaymentFilterValue(v);
    setPage(1);
  }, []);

  const query = useQuery({
    queryKey: queryKeys.restocks.list({ page, supplierFilter, paymentFilter }),
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: String(INVENTORY_PAGE_SIZE) });
      if (supplierFilter !== 'all') params.set('supplierId', supplierFilter);
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
      return apiClient.get<Paginated<Restock>>(`/api/restock?${params.toString()}`, 'Failed to load restocks');
    },
    enabled,
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page,
    setPage,
    loading: query.isPending,
    pageSize: INVENTORY_PAGE_SIZE,
    supplierFilter,
    setSupplierFilter,
    paymentFilter,
    setPaymentFilter,
    hasFilters: supplierFilter !== 'all' || paymentFilter !== 'all',
    refresh: query.refetch,
  };
}

export function useRestockDetail(restockId: string | null) {
  return useQuery({
    queryKey: queryKeys.restocks.detail(restockId ?? ''),
    queryFn: () => apiClient.get<Restock>(`/api/restock/${restockId}`, 'Failed to fetch restock details'),
    enabled: !!restockId,
  });
}

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
}

export interface AdjustStockInput {
  productId: string;
  quantity: number;
  type: string;
  note?: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdjustStockInput) =>
      apiClient.post('/api/inventory/adjust', body, 'Failed to adjust stock'),
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export interface RestockLineInput {
  productId: string;
  quantity: number;
  costPrice: number;
  expiryDate: string | null;
}

export interface RestockSaveInput {
  supplierId: string | null;
  reference: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  dateReceived: string;
  notes: string | null;
  items: RestockLineInput[];
  /** Optional payment made at the time of restock (e.g. paid on delivery). */
  initialPayment?: { amount: number; method: string } | null;
}

export function useCreateRestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RestockSaveInput) => apiClient.post<Restock>('/api/restock', body, 'Failed to create restock'),
    onSuccess: () => {
      invalidateInventory(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.restocks.all });
    },
  });
}

export interface RecordRestockPaymentInput {
  restockId: string;
  amount: number;
  method: string;
  note?: string;
}

export function useRecordRestockPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restockId, ...body }: RecordRestockPaymentInput) =>
      apiClient.post<Restock>(`/api/restock/${restockId}/payments`, body, 'Failed to record payment'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restocks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      queryClient.setQueryData(queryKeys.restocks.detail(data.id), data);
    },
  });
}
