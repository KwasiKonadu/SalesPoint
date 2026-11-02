"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface WebReturnRow {
  id: string;
  orderRef: string;
  items: { productId: string; name: string; qty: number }[];
  reason: string;
  notes: string;
  status: "requested" | "approved" | "rejected" | "completed";
  staffNote: string;
  createdAt: string;
  decidedAt: string | null;
  order: { customerName: string; customerPhone: string; customerEmail: string; total: number; saleId: string | null } | null;
}

export interface WebMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "handled";
  createdAt: string;
}

export function useWebReturns() {
  return useQuery({
    queryKey: queryKeys.webReturns.all,
    queryFn: () => apiClient.get<{ data: WebReturnRow[] }>("/api/web-returns", "Failed to load return requests"),
    select: (r) => r.data,
    refetchInterval: 30_000,
  });
}

export function useUpdateWebReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; staffNote?: string }) =>
      apiClient.patch<WebReturnRow>(`/api/web-returns/${id}`, body, "Failed to update the return"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.webReturns.all });
      qc.invalidateQueries({ queryKey: queryKeys.webOrders.pending });
    },
  });
}

export function useWebMessages() {
  return useQuery({
    queryKey: queryKeys.webMessages.all,
    queryFn: () => apiClient.get<{ data: WebMessageRow[] }>("/api/web-messages", "Failed to load messages"),
    select: (r) => r.data,
    refetchInterval: 30_000,
  });
}

export function useUpdateWebMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "handled" }) =>
      apiClient.patch<WebMessageRow>(`/api/web-messages/${id}`, { status }, "Failed to update the message"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.webMessages.all });
      qc.invalidateQueries({ queryKey: queryKeys.webOrders.pending });
    },
  });
}
