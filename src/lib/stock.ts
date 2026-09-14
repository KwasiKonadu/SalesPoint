/**
 * Low-stock maths shared by the API routes and the client. A product's
 * low-stock threshold is a percentage (`lowStockPercent`) of a reference
 * `targetStock`; with no target set there is no low-stock alert (only
 * out-of-stock still applies).
 */

export type StockStatus = 'out_of_stock' | 'low_stock' | 'in_stock';

/** Absolute unit count at or below which a product counts as low on stock. */
export function lowStockThreshold(
  targetStock: number | null | undefined,
  lowStockPercent: number | null | undefined,
): number {
  const target = targetStock ?? 0;
  const pct = lowStockPercent ?? 0;
  if (target <= 0 || pct <= 0) return 0;
  return Math.ceil((target * pct) / 100);
}

export function stockStatus(
  quantity: number,
  targetStock: number | null | undefined,
  lowStockPercent: number | null | undefined,
): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  const threshold = lowStockThreshold(targetStock, lowStockPercent);
  if (threshold > 0 && quantity <= threshold) return 'low_stock';
  return 'in_stock';
}
