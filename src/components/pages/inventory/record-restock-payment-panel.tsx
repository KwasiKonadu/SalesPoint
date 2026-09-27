"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/payment";
import { restockBalance, type Restock } from "@/lib/inventory";
import { useRecordRestockPayment } from "./use-inventory";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

const METHOD_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== "credit").map(
  (m) => ({ value: m.value, label: m.label }),
);

/** Records a payment against a restock to settle (or part-settle) the balance owed to the supplier. */
export function RecordRestockPaymentPanel({
  open,
  onOpenChange,
  restock,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restock: Restock | null;
  userId: string | undefined;
  onSuccess: (updated: Restock) => void;
}) {
  const balanceDue = restock ? restockBalance(restock) : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const recordPayment = useRecordRestockPayment();

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
    if (!restock || !userId || invalid) return;
    try {
      const updated = await recordPayment.mutateAsync({
        restockId: restock.id,
        amount: amountNum,
        method,
        note: note || undefined,
      });
      toast.success("Payment recorded", {
        description: `${formatCurrency(amountNum)} against ${restock.reference || `restock #${restock.id.slice(0, 8)}`}`,
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
      description={
        restock
          ? `Against ${restock.reference || `restock #${restock.id.slice(0, 8)}`}`
          : ""
      }
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
      {restock && (
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
