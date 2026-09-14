import { CircleDot } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/** Coloured stock count: red at zero, amber at/below the low-stock threshold, else green. */
export function StockBadge({
  quantity,
  threshold,
  tracksStock = true,
}: {
  quantity: number;
  /** Absolute unit count at or below which stock counts as low (0 = no alert). */
  threshold: number;
  tracksStock?: boolean;
}) {
  if (!tracksStock) {
    return (
      <Badge variant="outline" className="font-normal">
        N/A
      </Badge>
    );
  }

  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="font-normal tabular-nums">
        {quantity}
      </Badge>
    );
  }

  if (threshold > 0 && quantity <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-700">
        <CircleDot className="size-2.5 fill-amber-500 text-amber-500" />
        {quantity}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-700">
      <CircleDot className="size-2.5 fill-emerald-500 text-emerald-500" />
      {quantity}
    </span>
  );
}
