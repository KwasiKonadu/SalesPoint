"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { WebOrderRow } from "@/lib/web-order-status";

/** Refreshes every 30s so new website orders show up without a reload. */
export function useWebOrders(status: string) {
  return useQuery({
    queryKey: queryKeys.webOrders.list(status),
    queryFn: () => apiClient.get<{ data: WebOrderRow[] }>(`/api/web-orders${status === "all" ? "" : `?status=${status}`}`, "Failed to load orders"),
    select: (r) => r.data,
    refetchInterval: 30_000,
  });
}

export function useUpdateWebOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; paymentStatus?: string; note?: string }) =>
      apiClient.patch<WebOrderRow>(`/api/web-orders/${id}`, body, "Failed to update the order"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.webOrders.all });
      // Completing or cancelling changes sales, stock and the numbers built from them.
      for (const key of [queryKeys.sales.all, queryKeys.products.all, queryKeys.pos.catalog, queryKeys.customers.all, ["dashboard"], ["reports"]]) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}
