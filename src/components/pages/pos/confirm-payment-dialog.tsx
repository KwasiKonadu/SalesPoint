"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { SearchSelect } from "@/components/molecules/search-select";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHODS, paymentMethodLabel } from "@/lib/payment";
import type { SaleResponse } from "@/lib/pos";

const METHOD_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== "credit").map(
  (m) => ({ value: m.value, label: m.label }),
);

/**
 * After a non-cash sale, confirm the money actually came in — or defer it and
 * settle later from Sales History. The sale itself is already recorded (pending).
 */
export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  sale,
  userId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleResponse | null;
  userId: string | undefined;
  onDone: (received?: number) => void;
}) {
  const total = sale?.totalAmount ?? 0;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  // Seed each time it opens: default amount = total, method = the sale's method
  // (credit → cash, since you can't settle credit with credit).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && sale) {
      setAmount(String(total));
      setMethod(sale.paymentMethod === "credit" ? "cash" : sale.paymentMethod);
    }
  }

  const amountNum = Number(amount);
  const invalid = !Number.isFinite(amountNum) || amountNum <= 0;

  const confirm = async () => {
    if (!sale || !userId || invalid) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ amount: amountNum, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm payment");
      toast.success("Payment confirmed", {
        description: `${formatCurrency(amountNum)} · ${paymentMethodLabel(method)}`,
      });
      onDone(amountNum);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm payment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            {sale?.transactionNumber} ·{" "}
            {sale ? paymentMethodLabel(sale.paymentMethod) : ""} ·{" "}
            {formatCurrency(total)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            This sale is recorded as{" "}
            <span className="font-semibold text-rose-600">pending</span>. Confirm
            the amount received, or choose <span className="font-medium">Later</span>{" "}
            and settle it from Sales History.
          </div>
          <CurrencyInput
            label="Amount Received"
            lockCurrency
            value={amount}
            onValueChange={setAmount}
          />
          <SearchSelect
            label="Received Via"
            clearable={false}
            value={method}
            onChange={setMethod}
            options={METHOD_OPTIONS}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onDone()}
            disabled={submitting}
          >
            Later
          </Button>
          <Button onClick={confirm} disabled={submitting || invalid}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
