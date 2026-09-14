"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Building2,
  ChevronRight,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/atoms/field-label";
import { currencySymbol, useCurrencyCode } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  lineId,
  lineTotal,
  lineUnitPrice,
  lineUnits,
  type CartItem,
  type CartTotals,
  type PaymentMethod,
} from "@/lib/pos";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="size-4" /> },
  {
    value: "mobile_money",
    label: "Mobile Money",
    icon: <Smartphone className="size-4" />,
  },
  { value: "card", label: "Card", icon: <CreditCard className="size-4" /> },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    icon: <Building2 className="size-4" />,
  },
  { value: "credit", label: "Credit", icon: <Wallet className="size-4" /> },
];

export interface CheckoutPayload {
  paymentMethod: PaymentMethod;
  amountReceived: number;
}

/** Confirm-sale dialog: order summary, payment method and cash tendered. */
export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  totals,
  customerName,
  hasCustomer,
  isProcessing,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  totals: CartTotals;
  customerName: string;
  /** Whether a real (non-walk-in) customer is attached to the sale. */
  hasCustomer: boolean;
  isProcessing: boolean;
  onConfirm: (payload: CheckoutPayload) => void;
}) {
  const { subtotal, discountAmount, taxAmount, total } = totals;
  const symbol = currencySymbol(useCurrencyCode());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState("");

  // Credit is only offered when a real customer is selected — you can't run a
  // tab for a walk-in.
  const availableMethods = hasCustomer
    ? PAYMENT_METHODS
    : PAYMENT_METHODS.filter((pm) => pm.value !== "credit");

  // Reset the form each time the dialog transitions to open (render-phase
  // adjustment, per the React "you might not need an effect" guidance).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPaymentMethod("cash");
      setAmountReceived("");
    }
  }

  // If the customer is cleared while the dialog is open with Credit selected,
  // fall back to cash (render-phase adjustment, same pattern as above).
  if (!hasCustomer && paymentMethod === "credit") {
    setPaymentMethod("cash");
  }

  const received = parseFloat(amountReceived);
  const changeAmount =
    paymentMethod === "cash" && amountReceived
      ? Math.max(0, received - total)
      : 0;
  const cashShort =
    paymentMethod === "cash" && (!amountReceived || received < total);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isProcessing && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
          <DialogDescription>
            Review and confirm the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Order Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Order Summary
            </h4>
            <div className="rounded-lg border">
              <div className="space-y-2 p-3">
                {items.map((item) => (
                  <div
                    key={lineId(item.product.id, item.mode)}
                    className="flex justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.product.name}
                      {item.mode === "pack" ? " · pack" : ""} · {lineUnits(item)}{" "}
                      × {formatCurrency(lineUnitPrice(item))}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(lineTotal(item))}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1.5 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="tabular-nums">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Customer
            </h4>
            <p className="text-sm">{customerName || "Walk-in Customer"}</p>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Payment Method
            </h4>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {availableMethods.map((pm) => (
                <label
                  key={pm.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                    paymentMethod === pm.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={pm.value} className="sr-only" />
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md",
                      paymentMethod === pm.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {pm.icon}
                  </div>
                  <span className="text-sm font-medium">{pm.label}</span>
                </label>
              ))}
            </RadioGroup>
            {!hasCustomer && (
              <p className="text-xs text-muted-foreground">
                Select a customer to pay on credit.
              </p>
            )}
          </div>

          {/* Cash tendered */}
          {paymentMethod === "cash" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="space-y-2">
                <FieldLabel
                  htmlFor="amount-received"
                  className="font-semibold text-muted-foreground"
                >
                  Amount Received
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                    {symbol}
                  </span>
                  <Input
                    id="amount-received"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-11 pl-7 text-lg font-semibold tabular-nums"
                    autoFocus
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    total,
                    Math.ceil(total / 5) * 5,
                    Math.ceil(total / 10) * 10,
                    Math.ceil(total / 20) * 20,
                    50,
                    100,
                  ]
                    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                    .slice(0, 4)
                    .map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmountReceived(val.toFixed(2))}
                        className="rounded-md bg-muted px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/80"
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                </div>
              </div>
              {amountReceived && received >= total && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">
                      Change
                    </span>
                    <span className="text-lg font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                paymentMethod,
                amountReceived: paymentMethod === "cash" ? received : total,
              })
            }
            disabled={isProcessing || cashShort}
            className="min-w-35"
          >
            {isProcessing ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                Confirm • {formatCurrency(total)}
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
