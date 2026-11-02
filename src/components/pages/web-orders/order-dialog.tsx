"use client";

import { useState } from "react";
import { toast } from "sonner";

import { StatusChip } from "@/components/atoms/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ACTION_LABEL, nextStatuses, PAYMENT_LABEL, STATUS_LABEL, STATUS_VARIANT, type WebOrderRow } from "@/lib/web-order-status";

import { useUpdateWebOrder } from "./use-web-orders";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
] as const;

/** One website order: what to prepare, who it's for, and the next step. */
export function OrderDialog({ order, open, onOpenChange }: { order: WebOrderRow | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const update = useUpdateWebOrder();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("cash");
  if (!order) return null;

  const run = async (body: { status?: string; paymentStatus?: string; paymentMethod?: string }, done: string) => {
    try {
      await update.mutateAsync({ id: order.id, ...body });
      toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update the order");
    }
  };

  const next = nextStatuses(order.status, order.fulfilment);
  const a = order.address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order.ref}
            <StatusChip label={STATUS_LABEL[order.status] ?? order.status} variant={STATUS_VARIANT[order.status] ?? "neutral"} />
          </DialogTitle>
          <DialogDescription>Placed {formatDateTime(order.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section className="space-y-1">
            <h4 className="font-medium">{order.fulfilment === "pickup" ? "Pickup" : "Delivery"}</h4>
            <p>{order.customerName}</p>
            <p className="text-muted-foreground">
              {order.customerPhone} · {order.customerEmail}
            </p>
            {order.fulfilment === "delivery" && a && (
              <p className="text-muted-foreground">
                {[a.line1, a.line2, a.city, a.postal].filter(Boolean).join(", ")}
                {order.areaName ? ` (${order.areaName})` : ""}
                {a.phone ? ` · ${a.phone}` : ""}
              </p>
            )}
            {order.instructions && <p className="rounded-md bg-muted px-3 py-2">“{order.instructions}”</p>}
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-medium">Items</h4>
            {order.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  {i.qty} × {i.name}
                  {i.variantLabel ? <span className="text-muted-foreground"> · {i.variantLabel}</span> : null}
                </span>
                <span className="tabular-nums">{formatCurrency(i.lineTotal)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.fulfilment === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className="tabular-nums">{order.deliveryFee ? formatCurrency(order.deliveryFee) : "Free"}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.total)}</span>
            </div>
          </section>

          <Separator />

          <section className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-medium">Payment</h4>
              <p className="text-muted-foreground">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} · {order.paymentStatus === "paid" ? "Received" : "Not received yet"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={update.isPending || order.status === "cancelled"}
              onClick={() => run({ paymentStatus: order.paymentStatus === "paid" ? "pending" : "paid" }, order.paymentStatus === "paid" ? "Marked as not paid" : "Marked as paid")}
            >
              {order.paymentStatus === "paid" ? "Undo paid" : "Mark as paid"}
            </Button>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-medium">History</h4>
            <ol className="space-y-1.5 text-muted-foreground">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{h.note}</span>
                  <span className="shrink-0 text-xs">{formatDateTime(new Date(h.at))}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {order.saleId && <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Counted in your sales, receipts and reports.</p>}

        {next.includes("completed") && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium">Customer paid with</h4>
            <div className="flex rounded-md border p-0.5 text-sm">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn("flex-1 rounded px-2 py-1 transition-colors", method === m.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Completing the order records it as a sale.</p>
          </div>
        )}

        {next.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {next.map((s) => (
              <Button
                key={s}
                type="button"
                variant={s === "cancelled" ? "outline" : "default"}
                className={s === "cancelled" ? "text-destructive hover:text-destructive" : undefined}
                disabled={update.isPending}
                onClick={() => run({ status: s, ...(s === "completed" ? { paymentMethod: method } : {}) }, s === "cancelled" ? "Order cancelled and stock returned" : s === "completed" ? "Order completed and recorded as a sale" : `${STATUS_LABEL[s]}`)}
              >
                {ACTION_LABEL[s] ?? s}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
