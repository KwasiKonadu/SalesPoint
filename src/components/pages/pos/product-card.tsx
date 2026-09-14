"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getInitials,
  getProductColor,
  getProductTextColor,
  getStockStatus,
  isOutOfStock,
  stockCeiling,
  type PosProduct,
} from "@/lib/pos";

/**
 * Compact POS product card. Tapping the card adds one unit; the Pack button
 * (only when the product has a pack size) adds a whole pack as a grouped
 * wholesale line and states how many units that is.
 */
export function ProductCard({
  product,
  onAdd,
  onAddPack,
}: {
  product: PosProduct;
  onAdd: (product: PosProduct) => void;
  onAddPack: (product: PosProduct) => void;
}) {
  const oos = isOutOfStock(product);
  const stock = getStockStatus(product);
  const packSize = product.packSize ?? 0;
  // Not enough units on hand to make up a whole pack.
  const packShort = packSize > 0 && stockCeiling(product) < packSize;
  const subLabel =
    [product.container, product.size].filter(Boolean).join(" ") || product.sku;

  return (
    <motion.div
      role="button"
      tabIndex={oos ? -1 : 0}
      aria-disabled={oos || undefined}
      whileTap={oos ? undefined : { scale: 0.97 }}
      onClick={() => !oos && onAdd(product)}
      onKeyDown={(e) => {
        if (oos) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(product);
        }
      }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card outline-none transition-all",
        oos
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-primary/50 hover:shadow-md active:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      {/* Image / icon tile */}
      <div
        className={cn(
          "relative flex h-24 items-center justify-center",
          oos ? "bg-muted grayscale" : `${getProductColor(product.name)}/10`,
        )}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "text-xl font-bold",
              oos
                ? "text-muted-foreground/40"
                : getProductTextColor(product.name),
            )}
          >
            {getInitials(product.name)}
          </span>
        )}

        {oos && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Out of stock
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3">
        <p className="truncate text-sm font-semibold leading-none">
          {product.name}
        </p>
        {subLabel && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {subLabel}
          </p>
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
                stock.variant === "destructive" && "text-destructive",
              )}
            >
              {stock.label}
            </span>
          </div>
        </div>

        {!oos && packSize > 0 && (
          <button
            type="button"
            disabled={packShort}
            title={
              packShort ? `Not enough stock for a pack of ${packSize}` : undefined
            }
            onClick={(e) => {
              e.stopPropagation();
              if (!packShort) onAddPack(product);
            }}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-semibold transition-colors",
              packShort
                ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60"
                : "border-primary/20 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground active:bg-primary/90",
            )}
          >
            <Package className="size-3.5" />
            Pack of {packSize}
          </button>
        )}
      </div>
    </motion.div>
  );
}
