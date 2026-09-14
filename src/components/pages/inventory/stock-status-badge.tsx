import { StatusChip } from "@/components/atoms/status-chip";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  in_stock: { label: "In Stock", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "danger" },
};

/** In stock / low stock / out of stock pill. */
export function StockStatusBadge({ status }: { status: string }) {
  const meta = STATUS_MAP[status];
  return meta ? (
    <StatusChip label={meta.label} variant={meta.variant} />
  ) : (
    <StatusChip label={status} variant="neutral" />
  );
}
