"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { todayISO } from "@/lib/inventory";
import { formatCurrency } from "@/lib/format";
import { variantLabel } from "@/lib/products";
import { PAYMENT_METHODS } from "@/lib/payment";
import { useCreateRestock, useInventoryRefs } from "./use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

type Line = { quantity: number; costPrice: number; expiryDate: string };

const METHOD_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== "credit").map(
  (m) => ({ value: m.value, label: m.label }),
);

/** Two-step wizard for recording a supplier restock. Posts to `/api/restock`. */
export function NewRestockDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const { suppliers, products } = useInventoryRefs();
  const [step, setStep] = useState<1 | 2>(1);
  const [productSearch, setProductSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [dateReceived, setDateReceived] = useState(todayISO());
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [amountPaidNow, setAmountPaidNow] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  // productId -> line. A product is included when its quantity > 0.
  const [lines, setLines] = useState<Record<string, Line>>({});
  const createRestock = useCreateRestock();

  // Reset the wizard when it closes.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setStep(1);
      setSupplierId("");
      setReference("");
      setBatchNumber("");
      setDateReceived(todayISO());
      setExpiryDate("");
      setNotes("");
      setAmountPaidNow("");
      setPaymentMethod("cash");
      setLines({});
      setProductSearch("");
    }
  }

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products.filter((p) =>
      `${p.name} ${p.container ?? ""} ${p.size ?? ""} ${p.sku}`
        .toLowerCase()
        .includes(q),
    );
  }, [products, productSearch]);

  const setLine = (productId: string, patch: Partial<Line>) => {
    setLines((prev) => {
      const existing = prev[productId];
      const seedCost =
        products.find((p) => p.id === productId)?.costPrice ?? 0;
      const base: Line = existing ?? {
        quantity: 0,
        costPrice: seedCost,
        expiryDate: "",
      };
      return { ...prev, [productId]: { ...base, ...patch } };
    });
  };

  const selected = Object.entries(lines).filter(([, l]) => l.quantity > 0);
  const totalCost = selected.reduce(
    (sum, [, l]) => sum + l.quantity * l.costPrice,
    0,
  );

  const amountPaidValue = parseFloat(amountPaidNow) || 0;

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Set a quantity on at least one product");
      return;
    }
    if (amountPaidValue > totalCost + 0.01) {
      toast.error(
        `Amount paid can't exceed the restock total of ${formatCurrency(totalCost)}`,
      );
      return;
    }
    try {
      await createRestock.mutateAsync({
        supplierId: supplierId || null,
        reference: reference || null,
        batchNumber: batchNumber || null,
        expiryDate: expiryDate || null,
        dateReceived,
        notes: notes || null,
        initialPayment:
          amountPaidValue > 0
            ? { amount: amountPaidValue, method: paymentMethod }
            : null,
        items: selected.map(([productId, l]) => ({
          productId,
          quantity: l.quantity,
          costPrice: l.costPrice,
          expiryDate: l.expiryDate || null,
        })),
      });
      toast.success("Restock created successfully");
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create restock",
      );
    }
  };

  const nameOf = (id: string) => {
    const p = products.find((x) => x.id === id);
    return p ? (variantLabel(p) ? `${p.name} ${variantLabel(p)}` : p.name) : id;
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="New Restock"
      description={
        step === 1
          ? "Step 1: Enter restock details and select supplier."
          : "Step 2: Search a product name and set quantities."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next: Add Products
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRestock.isPending || selected.length === 0}
              >
                {createRestock.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Restock
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
        />
      </div>

      {step === 1 ? (
        <div className="space-y-4 py-2">
          <SearchSelect
            label="Supplier"
            placeholder="Select supplier (optional)"
            value={supplierId}
            onChange={setSupplierId}
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.businessName,
            }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Reference #"
              placeholder="e.g. PO-2024-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <TextField
              label="Batch Number"
              placeholder="e.g. BN-001"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Date Received *"
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
          <TextField
            label="Notes"
            type="textarea"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      ) : (
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Type a product name, e.g. coca cola…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[46vh] divide-y overflow-y-auto rounded-lg border">
            {filteredProducts.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No products match &ldquo;{productSearch}&rdquo;.
              </p>
            ) : (
              filteredProducts.map((p) => {
                const line = lines[p.id];
                const active = (line?.quantity ?? 0) > 0;
                return (
                  <div
                    key={p.id}
                    className={`space-y-2 p-3 transition-colors ${active ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.name}
                          {variantLabel(p) && (
                            <span className="font-normal text-muted-foreground">
                              {" · "}
                              {variantLabel(p)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                      <div className="w-24 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={line?.quantity ?? ""}
                          onChange={(e) =>
                            setLine(p.id, {
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-center"
                        />
                      </div>
                    </div>
                    {active && (
                      <div className="grid grid-cols-2 gap-2">
                        <CurrencyInput
                          label="Cost Price"
                          lockCurrency
                          value={line?.costPrice ?? p.costPrice}
                          onValueChange={(v) =>
                            setLine(p.id, { costPrice: parseFloat(v) || 0 })
                          }
                        />
                        <TextField
                          label="Expiry Date"
                          type="date"
                          value={line?.expiryDate ?? ""}
                          onChange={(e) =>
                            setLine(p.id, { expiryDate: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selected.length} product{selected.length === 1 ? "" : "s"}:{" "}
              {selected
                .map(([id, l]) => `${nameOf(id)} ×${l.quantity}`)
                .join(", ")}
            </p>
          )}

          <Separator />

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm font-medium">Running Total</span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Payment (optional)</p>
            <p className="text-xs text-muted-foreground">
              Paid the supplier something already? Record it here — the
              balance owed is tracked from this point on.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <CurrencyInput
                label="Amount Paid Now"
                lockCurrency
                value={amountPaidNow}
                onValueChange={setAmountPaidNow}
              />
              {amountPaidValue > 0 && (
                <SearchSelect
                  label="Payment Method"
                  clearable={false}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={METHOD_OPTIONS}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </FormPanel>
  );
}
