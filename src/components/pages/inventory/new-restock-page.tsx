"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, History, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import type { Restock } from "@/lib/inventory";
import { todayISO } from "@/lib/inventory";
import { formatCurrency, formatDate } from "@/lib/format";
import { variantLabel } from "@/lib/products";
import { PAYMENT_METHODS } from "@/lib/payment";
import {
  useCreateRestock,
  useInventoryRefs,
  useSupplierRecentRestocks,
} from "./use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { TextField } from "@/components/atoms/text-field";
import { SearchSelect } from "@/components/molecules/search-select";

type Line = { quantity: number; costPrice: number; expiryDate: string };

const METHOD_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== "credit").map(
  (m) => ({ value: m.value, label: m.label }),
);

const LINE_GRID = "md:grid-cols-[minmax(0,1fr)_6rem_9rem_9rem_7rem_2rem]";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Full-page form for recording a supplier restock. Posts to `/api/restock`. */
export default function NewRestockPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialSupplier = params.get("supplier") ?? "";

  const { suppliers, products } = useInventoryRefs();
  const createRestock = useCreateRestock();

  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [reference, setReference] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [dateReceived, setDateReceived] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [amountPaidNow, setAmountPaidNow] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [productSearch, setProductSearch] = useState("");
  // productId -> line. A product is included when its quantity > 0.
  const [lines, setLines] = useState<Record<string, Line>>({});

  const { data: recentOrders = [] } = useSupplierRecentRestocks(
    supplierId || null,
  );
  // Which supplier's last order has already been auto-applied (only done once).
  const [appliedFor, setAppliedFor] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);

  /** Replace the lines with those of a past order (inactive products are skipped). */
  const applyOrder = (order: Restock | null) => {
    setTemplateId(order?.id ?? null);
    const next: Record<string, Line> = {};
    for (const it of order?.items ?? []) {
      if (!products.some((p) => p.id === it.productId)) continue;
      next[it.productId] = {
        quantity: it.quantity,
        costPrice: it.costPrice,
        expiryDate: "",
      };
    }
    setLines(next);
  };

  // Default to the supplier's latest order so a repeat restock starts pre-filled.
  if (
    supplierId &&
    recentOrders.length > 0 &&
    products.length > 0 &&
    appliedFor !== supplierId
  ) {
    setAppliedFor(supplierId);
    if (Object.keys(lines).length === 0) applyOrder(recentOrders[0]);
  }

  const setLine = (productId: string, patch: Partial<Line>) => {
    setLines((prev) => {
      const base: Line = prev[productId] ?? {
        quantity: 0,
        costPrice: products.find((p) => p.id === productId)?.costPrice ?? 0,
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
  const balance = Math.max(0, totalCost - amountPaidValue);

  const results = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const open = products.filter((p) => !((lines[p.id]?.quantity ?? 0) > 0));
    if (!q) return open.slice(0, 30);
    return open.filter((p) =>
      `${p.name} ${p.container ?? ""} ${p.size ?? ""} ${p.sku}`
        .toLowerCase()
        .includes(q),
    );
  }, [products, productSearch, lines]);

  const nameOf = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return id;
    return variantLabel(p) ? `${p.name} · ${variantLabel(p)}` : p.name;
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    const undated = selected.find(
      ([id, l]) => !l.expiryDate && products.find((p) => p.id === id)?.perishable,
    );
    if (undated) {
      toast.error(`${nameOf(undated[0])} needs an expiry date`);
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
        expiryDate: null,
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
      router.back();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create restock",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/inventory"
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold">New Restock</h1>
        <p className="text-sm text-muted-foreground">
          Record goods received from a supplier.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Section title="Supplier & details">
            <SearchSelect
              label="Supplier"
              placeholder="Select supplier (optional)"
              value={supplierId}
              onChange={(v) => {
                setSupplierId(v);
                setAppliedFor("");
                setTemplateId(null);
                setLines({});
              }}
              options={suppliers.map((s) => ({
                value: s.id,
                label: s.businessName,
              }))}
            />

            {recentOrders.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <History className="size-4" /> Start from a previous order
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {recentOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => applyOrder(o)}
                      className={`flex items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors ${templateId === o.id ? "border-primary ring-1 ring-primary" : "hover:bg-accent"}`}
                    >
                      <span>
                        {formatDate(o.dateReceived)}
                        <span className="block text-xs text-muted-foreground">
                          {o.items?.length ?? 0} product
                          {(o.items?.length ?? 0) === 1 ? "" : "s"}
                          {o.reference ? ` · ${o.reference}` : ""}
                        </span>
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(o.totalCost)}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => applyOrder(null)}
                    className={`rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors ${templateId === null ? "border-primary ring-1 ring-primary" : "hover:bg-accent"}`}
                  >
                    Start with an empty order
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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
              <TextField
                label="Date Received *"
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
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
          </Section>

          <Section
            title={`Products in this order (${selected.length})`}
            description="Set quantity, cost price and expiry date. Each line becomes its own batch, so stock with different expiry dates is kept apart."
          >
            {selected.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No products yet. Search below to add some.
              </p>
            ) : (
              <div className="space-y-2">
                <div
                  className={`hidden gap-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid ${LINE_GRID}`}
                >
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Cost price</span>
                  <span>Expiry date</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>
                <div className="divide-y rounded-lg border">
                  {selected.map(([id, l]) => (
                    <div
                      key={id}
                      className={`grid grid-cols-2 items-center gap-3 p-3 ${LINE_GRID}`}
                    >
                      <p className="col-span-2 min-w-0 truncate text-sm font-medium md:col-span-1">
                        {nameOf(id)}
                        {products.find((p) => p.id === id)?.perishable && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-700">
                            Expiry required
                          </span>
                        )}
                      </p>
                      <Input
                        type="number"
                        min={0}
                        aria-label="Quantity"
                        value={l.quantity}
                        onChange={(e) =>
                          setLine(id, { quantity: parseInt(e.target.value) || 0 })
                        }
                        className="h-9"
                      />
                      <CurrencyInput
                        lockCurrency
                        value={l.costPrice}
                        onValueChange={(v) =>
                          setLine(id, { costPrice: parseFloat(v) || 0 })
                        }
                      />
                      <Input
                        type="date"
                        aria-label="Expiry date"
                        aria-invalid={
                          !l.expiryDate && products.find((p) => p.id === id)?.perishable
                            ? true
                            : undefined
                        }
                        value={l.expiryDate}
                        onChange={(e) =>
                          setLine(id, { expiryDate: e.target.value })
                        }
                        className="h-9"
                      />
                      <span className="text-sm font-medium tabular-nums md:text-right">
                        {formatCurrency(l.quantity * l.costPrice)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => setLine(id, { quantity: 0 })}
                        className="justify-self-end rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search a product to add, e.g. coca cola…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
                {results.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    {productSearch ? (
                      <>No products match &ldquo;{productSearch}&rdquo;.</>
                    ) : (
                      "Nothing else to add."
                    )}
                  </p>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLine(p.id, { quantity: 1 })}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-accent"
                    >
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
                      <span className="text-xs text-primary">+ Add</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Summary & payment */}
        <aside className="space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-4">
          <h2 className="text-base font-semibold">Summary</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Supplier</dt>
              <dd className="truncate pl-3 font-medium">
                {suppliers.find((s) => s.id === supplierId)?.businessName ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Products</dt>
              <dd className="font-medium">{selected.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Units</dt>
              <dd className="font-medium">
                {selected.reduce((n, [, l]) => n + l.quantity, 0)}
              </dd>
            </div>
          </dl>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Payment (optional)</p>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance owed</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={createRestock.isPending || selected.length === 0}
            >
              {createRestock.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Restock
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
