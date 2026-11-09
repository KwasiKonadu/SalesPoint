"use client";

import { useState } from "react";
import { toast } from "sonner";

import { StatusChip, type StatusVariant } from "@/components/atoms/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/format";

import { useUpdateWebReturn, type WebReturnRow } from "./use-web-inbox";

export const RETURN_FILTERS = [
  { key: "requested", label: "Requests" },
  { key: "approved", label: "Approved" },
  { key: "done", label: "Closed" },
] as const;

const LABEL: Record<string, string> = { requested: "Awaiting decision", approved: "Approved", rejected: "Declined", completed: "Completed" };
const VARIANT: Record<string, StatusVariant> = { requested: "warning", approved: "info", rejected: "danger", completed: "neutral" };

export const inReturnFilter = (r: WebReturnRow, key: string) => (key === "done" ? r.status === "rejected" || r.status === "completed" : r.status === key);

export function ReturnsView({ rows, filter }: { rows: WebReturnRow[]; filter: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = rows.filter((r) => inReturnFilter(r, filter));
  const open = rows.find((r) => r.id === openId) ?? null;

  if (!shown.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {filter === "requested" ? "No return requests. When a customer asks to return something, it appears here." : "Nothing here."}
      </div>
    );
  }
  return (
    <>
      <div className="space-y-3">
        {shown.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpenId(r.id)}
            className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.orderRef}</span>
                <StatusChip label={LABEL[r.status]} variant={VARIANT[r.status]} />
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {r.order?.customerName ?? "Customer"} · {r.items.reduce((s, i) => s + i.qty, 0)} item(s) · {r.reason}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
          </button>
        ))}
      </div>
      <ReturnDialog row={open} onClose={() => setOpenId(null)} />
    </>
  );
}

function ReturnDialog({ row, onClose }: { row: WebReturnRow | null; onClose: () => void }) {
  const update = useUpdateWebReturn();
  const [note, setNote] = useState<{ id: string; text: string } | null>(null);
  if (!row) return null;
  const text = note?.id === row.id ? note.text : row.staffNote;

  const run = async (status: string | undefined, done: string) => {
    try {
      await update.mutateAsync({ id: row.id, status, staffNote: text });
      toast.success(done);
      if (status) onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update the return");
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Return for {row.orderRef}
            <StatusChip label={LABEL[row.status]} variant={VARIANT[row.status]} />
          </DialogTitle>
          <DialogDescription>Requested {formatDateTime(row.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {row.order && (
            <section className="space-y-1">
              <p className="font-medium">{row.order.customerName}</p>
              <p className="text-muted-foreground">
                {row.order.customerPhone} · {row.order.customerEmail}
              </p>
              <p className="text-muted-foreground">Order total {formatCurrency(row.order.total)}</p>
            </section>
          )}

          <section className="space-y-1">
            <h4 className="font-medium">Items to return</h4>
            {row.items.map((i) => (
              <p key={i.productId}>
                {i.qty} × {i.name}
              </p>
            ))}
            <p className="text-muted-foreground">Reason: {row.reason}</p>
            {row.notes && <p className="rounded-md bg-muted px-3 py-2">“{row.notes}”</p>}
          </section>

          <section className="space-y-1.5">
            <h4 className="font-medium">Note to the customer</h4>
            <Textarea
              rows={3}
              maxLength={500}
              placeholder="e.g. Bring the item and receipt to the shop"
              value={text}
              onChange={(e) => setNote({ id: row.id, text: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Shown to the customer on their order page.</p>
          </section>

          {row.status === "approved" && (
            <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
              Refund the customer and put the items back in stock yourself, then mark this completed.
              {row.order?.saleId ? " The original sale is in Sales History." : ""}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={update.isPending || text === row.staffNote} onClick={() => run(undefined, "Note saved")}>
              Save note
            </Button>
            {(row.status === "requested" || row.status === "approved") && (
              <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={update.isPending} onClick={() => run("rejected", "Return declined")}>
                Decline
              </Button>
            )}
            {row.status === "requested" && (
              <Button type="button" disabled={update.isPending} onClick={() => run("approved", "Return approved")}>
                Approve
              </Button>
            )}
            {row.status === "approved" && (
              <Button type="button" disabled={update.isPending} onClick={() => run("completed", "Return completed")}>
                Mark completed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
