import type { StatusVariant } from '@/components/atoms/status-chip';

export interface WebOrderRow {
  id: string;
  ref: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfilment: "delivery" | "pickup";
  areaName: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: { name?: string; phone?: string; line1?: string; line2?: string; city?: string; postal?: string } | null;
  instructions: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  history: { status: string; at: number; note: string }[];
  saleId: string | null;
  createdAt: string;
  items: { id: string; name: string; variantLabel: string | null; unitPrice: number; qty: number; lineTotal: number; image: string | null }[];
}

export const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "Awaiting confirmation",
  confirmed: "Confirmed",
  processing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_VARIANT: Record<string, StatusVariant> = {
  pending_confirmation: "warning",
  confirmed: "info",
  processing: "info",
  ready_for_pickup: "success",
  out_for_delivery: "success",
  completed: "neutral",
  cancelled: "danger",
};

/** The button label for moving an order into each status. */
export const ACTION_LABEL: Record<string, string> = {
  confirmed: "Confirm order",
  processing: "Start preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Mark completed",
  cancelled: "Cancel order",
};

export const PAYMENT_LABEL: Record<string, string> = { on_delivery: "Pay at pickup", bank_transfer: "Bank transfer" };

/** What staff can do next from a status (mirrors the server). */
export function nextStatuses(status: string, fulfilment: string): string[] {
  switch (status) {
    case "pending_confirmation":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["processing", "cancelled"];
    case "processing":
      return [fulfilment === "pickup" ? "ready_for_pickup" : "out_for_delivery", "cancelled"];
    case "ready_for_pickup":
    case "out_for_delivery":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}
