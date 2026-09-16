"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/payment";
import type { Sale } from "@/lib/sales";
import { useRecordPayment } from "./use-sales";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

const METHOD_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== "credit").map(
  (m) => ({ value: m.value, label: m.label }),
);

/** Records a payment against a sale to settle (or part-settle) its balance. */
export function RecordPaymentPanel({
  open,
  onOpenChange,
  sale,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  userId: string | undefined;
  onSuccess: (updated: Sale) => void;
}) {
  const balanceDue = sale
    ? Math.round((sale.totalAmount - (sale.amountReceived ?? 0)) * 100) / 100
    : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const recordPayment = useRecordPayment();

  // Seed the amount with the full outstanding balance each time it opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAmount(balanceDue > 0 ? String(balanceDue) : "");
      setMethod("cash");
      setNote("");
    }
  }

  const amountNum = Number(amount);
  const invalid =
    !Number.isFinite(amountNum) ||
    amountNum <= 0 ||
    amountNum - balanceDue > 0.01;

  const handleSubmit = async () => {
    if (!sale || !userId || invalid) return;
    try {
      const updated = await recordPayment.mutateAsync({
        saleId: sale.id,
        amount: amountNum,
        method,
        note: note || undefined,
      });
      toast.success("Payment recorded", {
        description: `${formatCurrency(amountNum)} against ${sale.transactionNumber}`,
      });
      onOpenChange(false);
      onSuccess(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record payment",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Record Payment"
      description={sale ? `Against ${sale.transactionNumber}` : ""}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordPayment.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={recordPayment.isPending || invalid}>
            {recordPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </>
      }
    >
      {sale && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm font-medium">Balance Due</span>
            <span className="text-lg font-bold tabular-nums text-rose-600">
              {formatCurrency(balanceDue)}
            </span>
          </div>

          <CurrencyInput
            label="Amount"
            lockCurrency
            value={amount}
            onValueChange={setAmount}
            error={
              amountNum - balanceDue > 0.01
                ? "Amount exceeds the balance due"
                : undefined
            }
          />

          <SearchSelect
            label="Payment Method"
            clearable={false}
            value={method}
            onChange={setMethod}
            options={METHOD_OPTIONS}
          />

          <TextField
            label="Note"
            type="textarea"
            placeholder="Optional reference or note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>
      )}
    </FormPanel>
  );
}
