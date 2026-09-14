"use client";

import { type MouseEvent } from "react";
import { Package, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { variantLabel, type ProductItem } from "@/lib/products";
import { lowStockThreshold } from "@/lib/stock";
import { cn } from "@/lib/utils";

/**
 * Compact product card for the grid view. Falls back to the product's category
 * icon (an emoji) when no image is uploaded, then to a generic package glyph.
 */
export function ProductCard({
  product,
  categoryIcon,
  onOpenDetails,
  onEdit,
  onToggleActive,
}: {
  product: ProductItem;
  /** Emoji stored on the product's category, if any. */
  categoryIcon?: string | null;
  /** Fires when the card body (not an action button) is clicked. */
  onOpenDetails: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const stop = (e: MouseEvent) => e.stopPropagation();
  const tracksStock = product.productType?.tracksStock ?? true;
  const stock = product.inventory?.quantity ?? 0;
  const threshold = lowStockThreshold(product.targetStock, product.lowStockPercent);
  const isOut = product.isActive && tracksStock && stock === 0;
  const isLow =
    product.isActive && tracksStock && !isOut && threshold > 0 && stock <= threshold;
  const isBestSeller = product.isActive && !!product.isBestSeller;
  const subLabel = variantLabel(product) || product.sku;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {/* Image / icon tile */}
      <div
        className={cn(
          "relative flex h-24 items-center justify-center bg-muted",
          !product.isActive && "grayscale",
        )}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : categoryIcon ? (
          <span className="text-3xl leading-none" aria-hidden>
            {categoryIcon}
          </span>
        ) : (
          <Package className="h-8 w-8 text-muted-foreground" />
        )}

        {!product.isActive ? (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Inactive
          </span>
        ) : isBestSeller || isOut || isLow ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
            {isBestSeller && (
              <>
                <Star className="h-2.5 w-2.5 fill-current" />
                Best seller
              </>
            )}
            {isBestSeller && (isOut || isLow) && (
              <span className="text-muted-foreground">·</span>
            )}
            {(isOut || isLow) && (
              <span className="text-destructive">
                {isOut ? "Out of stock" : "Low stock"}
              </span>
            )}
          </span>
        ) : null}
      </div>

      {/* Details */}
      <div className={cn("p-3", !product.isActive && "opacity-70")}>
        <p className="truncate text-sm font-semibold leading-none">{product.name}</p>
        {subLabel && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{subLabel}</p>
        )}

        <div className="mt-2.5 space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Category</span>
            <span className="truncate font-medium">
              {product.category?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(product.sellingPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">In stock</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                (isOut || isLow) && "font-semibold text-destructive",
              )}
            >
              {tracksStock ? `${stock} units` : "N/A"}
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              stop(e);
              onEdit();
            }}
          >
            Edit
          </Button>
          {product.isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={(e) => {
                stop(e);
                onToggleActive();
              }}
            >
              Archive
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                stop(e);
                onToggleActive();
              }}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
