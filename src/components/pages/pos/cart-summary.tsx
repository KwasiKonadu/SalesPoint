"use client";

import { ChevronRight, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SearchSelect } from "@/components/molecules/search-select";
import { formatCurrency } from "@/lib/format";
import type { CartTotals, PosCustomer } from "@/lib/pos";

/** Bottom section of the cart: customer, discount, totals and the checkout CTA. */
export function CartSummary({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  discountPercent,
  onDiscountChange,
  totals,
  onCheckout,
}: {
  customers: PosCustomer[];
  selectedCustomer: PosCustomer | null;
  onSelectCustomer: (customer: PosCustomer | null) => void;
  onAddCustomer: () => void;
  discountPercent: number;
  onDiscountChange: (value: number) => void;
  totals: CartTotals;
  onCheckout: () => void;
}) {
  const { subtotal, discountAmount, taxAmount, total } = totals;

  return (
    <div className="shrink-0 space-y-3 border-t bg-card p-4">
      {/* Customer */}
      <div className="flex items-end gap-1.5">
        <div className="flex-1">
          <SearchSelect
            size="sm"
            label="Customer"
            placeholder="Walk-in Customer"
            value={selectedCustomer?.id ?? ""}
            onChange={(val) =>
              onSelectCustomer(customers.find((c) => c.id === val) ?? null)
            }
            options={customers.map((c) => ({
              value: c.id,
              label: c.name,
              sublabel: c.phone ?? undefined,
            }))}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={onAddCustomer}
          title="Add Customer"
        >
          <UserPlus className="size-3.5" />
        </Button>
      </div>

      {/* Discount */}
      <div className="flex items-center gap-2">
        <Label className="shrink-0 text-xs text-muted-foreground">
          Discount
        </Label>
        <div className="flex flex-1 items-center gap-1">
          <Input
            type="number"
            min="0"
            max="100"
            value={discountPercent || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (isNaN(val) || val < 0) onDiscountChange(0);
              else if (val > 100) onDiscountChange(100);
              else onDiscountChange(val);
            }}
            placeholder="0"
            className="h-8 w-16 text-center text-sm"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        {discountPercent > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onDiscountChange(0)}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount ({discountPercent}%)</span>
            <span className="tabular-nums">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        className="w-full rounded-xl py-5 text-base font-semibold"
        size="lg"
        onClick={onCheckout}
      >
        Checkout • {formatCurrency(total)}
        <ChevronRight className="ml-1 size-5" />
      </Button>
    </div>
  );
}
