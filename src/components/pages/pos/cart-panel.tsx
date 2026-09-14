"use client";

import { AnimatePresence } from "framer-motion";
import { ShoppingBag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { lineId, type PosCustomer } from "@/lib/pos";

import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import type { CartController } from "./use-cart";

/** Right column of the POS screen: cart header, line items and summary. */
export function CartPanel({
  cart,
  customers,
  onAddCustomer,
  onCheckout,
}: {
  cart: CartController;
  customers: PosCustomer[];
  onAddCustomer: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="flex w-105 shrink-0 flex-col border-l bg-card max-md:w-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Cart</h2>
          {cart.totals.totalItems > 0 && (
            <Badge variant="default" className="ml-1">
              {cart.totals.totalItems}
            </Badge>
          )}
        </div>
        {!cart.isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cart.clear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1">
        {cart.isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No items in cart
            </p>
            <p className="text-xs text-muted-foreground/60">
              Click products to add them
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-1 px-3 py-2">
              <AnimatePresence initial={false}>
                {cart.items.map((item) => (
                  <CartLineItem
                    key={lineId(item.product.id, item.mode)}
                    item={item}
                    onChangeQuantity={cart.changeQuantity}
                    onSetQuantity={cart.setQuantity}
                    onRemove={cart.removeProduct}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Summary */}
      {!cart.isEmpty && (
        <CartSummary
          customers={customers}
          selectedCustomer={cart.customer}
          onSelectCustomer={cart.setCustomer}
          onAddCustomer={onAddCustomer}
          discountPercent={cart.discountPercent}
          onDiscountChange={cart.setDiscountPercent}
          totals={cart.totals}
          onCheckout={onCheckout}
        />
      )}
    </div>
  );
}
