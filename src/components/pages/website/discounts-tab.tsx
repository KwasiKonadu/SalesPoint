"use client";

import { useState } from "react";
import { Percent, Store } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip, type StatusVariant } from "@/components/atoms/status-chip";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchSelect } from "@/components/molecules/search-select";
import { channelShort } from "@/lib/discount-channel";
import { formatCurrency } from "@/lib/format";
import { discountStatus, effectivePrice, type DiscountStatus } from "@/lib/pricing";
import { productLabel, type ProductItem } from "@/lib/products";
import { ViewProductDialog } from "../products/view-product-dialog";
import { ProductImage } from "../products/product-image";
import { useAllProducts } from "../products/use-products";

const CHIP: Record<Exclude<DiscountStatus, "none">, { label: string; variant: StatusVariant }> = {
  active: { label: "Active", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  expired: { label: "Ended", variant: "neutral" },
};
const RANK = { active: 0, scheduled: 1, expired: 2 } as const;
const day = (d?: string | null) => (d ? d.slice(0, 10) : "");

/** Every product that has a discount (set from the Products page), with a quick way to edit or add one. */
export function DiscountsTab() {
  const { data: products = [], isPending } = useAllProducts(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const discounted = products
    .map((p) => ({ p, status: discountStatus(p) }))
    .filter((x): x is { p: ProductItem; status: Exclude<DiscountStatus, "none"> } => x.status !== "none")
    .sort((a, b) => RANK[a.status] - RANK[b.status] || a.p.name.localeCompare(b.p.name));

  const open = products.find((p) => p.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Products with a discount. Each one applies at the till, on the website, or both — you choose when you set it. Tap
          one to change or remove it.
        </p>
        <div className="w-full sm:w-72">
          <SearchSelect
            placeholder="Add a discount to a product…"
            value=""
            onChange={(id) => id && setOpenId(id)}
            options={products
              .filter((p) => p.isActive && discountStatus(p) === "none")
              .map((p) => ({ value: p.id, label: productLabel(p), sublabel: p.sku }))}
          />
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : discounted.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No discounts yet"
          description="Pick a product above to add one, or open any product on the Products page."
        />
      ) : (
        <ul className="space-y-2">
          {discounted.map(({ p, status }) => {
            const chip = CHIP[status];
            const pct = p.discountType === "percent" ? `${p.discountValue}% off` : `${formatCurrency(p.discountValue ?? 0)} off`;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent/40"
                >
                  <ProductImage name={p.name} image={p.image} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <span className="truncate">{productLabel(p)}</span>
                      {p.showOnWebsite && <Store className="size-3.5 shrink-0 text-muted-foreground" aria-label="On the website" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pct} · {channelShort(p.discountChannel) || "Till & website"} · {day(p.discountStart)} → {day(p.discountEnd)}
                    </p>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <span className="mr-2 text-xs text-muted-foreground line-through">{formatCurrency(p.sellingPrice)}</span>
                    <span className="font-semibold">{formatCurrency(effectivePrice(p, status === "active" ? new Date() : new Date(p.discountStart ?? Date.now())))}</span>
                  </div>
                  <StatusChip label={chip.label} variant={chip.variant} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ViewProductDialog product={open} open={!!open} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
