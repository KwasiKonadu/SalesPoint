"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getInitials,
  getProductColor,
  getProductTextColor,
  lineId,
  lineTotal,
  lineUnitPrice,
  lineUnits,
  type CartItem,
} from "@/lib/pos";

/** One row in the cart list. Single lines count units; pack lines count packs. */
export function CartLineItem({
  item,
  onChangeQuantity,
  onSetQuantity,
  onRemove,
}: {
  item: CartItem;
  onChangeQuantity: (lineId: string, delta: number) => void;
  onSetQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
}) {
  const { product, quantity, mode } = item;
  const id = lineId(product.id, mode);
  const isPack = mode === "pack";
  const packSize = product.packSize ?? 1;

  const [qtyDraft, setQtyDraft] = useState<string | null>(null);
  const commitQty = () => {
    if (qtyDraft === null) return;
    const n = parseInt(qtyDraft, 10);
    if (Number.isFinite(n) && n > 0 && n !== quantity) {
      onSetQuantity(id, n);
    }
    setQtyDraft(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, x: 20 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-1 overflow-hidden rounded-lg p-1 transition-colors hover:bg-muted/50"
    >
      {/* Row 1 — identity + line total */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
            `${getProductColor(product.name)}/15`,
            getProductTextColor(product.name),
          )}
        >
          {getInitials(product.name)}
        </div>

        <p className="flex min-w-0 flex-2 items-center gap-1 text-sm font-medium">
          <span className="truncate">
            {product.name}
            {(product.container || product.size) && (
              <span className="font-normal text-muted-foreground">
                {" · "}
                {[product.container, product.size].filter(Boolean).join(" ")}
              </span>
            )}
          </span>
          {isPack && (
            <span className="shrink-0 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold uppercase tracking-tight text-primary">
              Pack
            </span>
          )}
        </p>

        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatCurrency(lineTotal(item))}
        </span>

        <button
          onClick={() => onRemove(id)}
          aria-label="Remove item"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Row 2 — unit detail + quantity stepper */}
      <div className="flex items-center justify-between gap-2 pl-12">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {isPack ? (
            <>
              {formatCurrency(lineUnitPrice(item))} × {packSize}/pack ={" "}
              {lineUnits(item)} units
            </>
          ) : (
            <>{formatCurrency(product.sellingPrice)} each</>
          )}
        </p>

        <div className="flex h-5 shrink-0 items-stretch overflow-hidden rounded-md border transition-colors focus-within:border-ring">
          <button
            onClick={() => onChangeQuantity(id, -1)}
            aria-label="Decrease quantity"
            className="flex w-7 items-center justify-center transition-colors hover:bg-muted"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={qtyDraft ?? quantity}
            onChange={(e) => setQtyDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commitQty}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-9 border-x bg-transparent text-center text-sm font-medium tabular-nums outline-none focus:bg-muted/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => onChangeQuantity(id, 1)}
            aria-label="Increase quantity"
            className="flex w-7 items-center justify-center transition-colors hover:bg-muted"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
