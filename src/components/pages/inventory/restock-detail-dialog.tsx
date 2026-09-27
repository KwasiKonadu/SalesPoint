"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { variantLabel } from "@/lib/products";
import { paymentMethodLabel } from "@/lib/payment";
import { useAuth } from "@/lib/auth-context";
import {
  paymentStatusConfig,
  restockBalance,
  type RestockItem,
  type RestockPayment,
} from "@/lib/inventory";
import { useRestockDetail } from "./use-inventory";
import { RecordRestockPaymentPanel } from "./record-restock-payment-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/organisms/data-table";

const itemColumns: Column<RestockItem>[] = [
  {
    key: "product",
    label: "Product",
    render: (item) => (
      <span className="font-medium">
        {item.product.name}
        {variantLabel(item.product) && (
          <span className="font-normal text-muted-foreground">
            {" · "}
            {variantLabel(item.product)}
          </span>
        )}
      </span>
    ),
  },
  {
    key: "qty",
    label: "Qty",
    align: "right",
    width: "4rem",
    render: (item) => <span className="tabular-nums">{item.quantity}</span>,
  },
  {
    key: "costPrice",
    label: "Cost Price",
    align: "right",
    width: "7rem",
    render: (item) => (
      <span className="tabular-nums">{formatCurrency(item.costPrice)}</span>
    ),
  },
  {
    key: "total",
    label: "Total",
    align: "right",
    width: "7rem",
    render: (item) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(item.quantity * item.costPrice)}
      </span>
    ),
  },
];

const paymentColumns: Column<RestockPayment>[] = [
  {
    key: "createdAt",
    label: "Date",
    render: (p) => <span>{formatDateTime(p.createdAt)}</span>,
  },
  {
    key: "method",
    label: "Method",
    render: (p) => <span>{paymentMethodLabel(p.method)}</span>,
  },
  {
    key: "recordedBy",
    label: "By",
    render: (p) => <span>{p.recordedBy?.name || "—"}</span>,
  },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    render: (p) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(p.amount)}
      </span>
    ),
  },
];

/** Header info + line items + payment history for one restock. */
export function RestockDetailDialog({
  open,
  onOpenChange,
  restockId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restockId: string | null;
}) {
  const { data: restock, isPending: loading } = useRestockDetail(open ? restockId : null);
  const { user } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const payConfig = paymentStatusConfig(restock?.paymentStatus);
  const balanceDue = restock ? restockBalance(restock) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Restock Details</DialogTitle>
          <DialogDescription>
            {restock?.reference || `Restock #${restockId?.slice(0, 8)}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : restock ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Info
                  label="Supplier"
                  value={restock.supplier?.businessName || "—"}
                />
                <Info
                  label="Date Received"
                  value={formatDateTime(restock.dateReceived)}
                />
                <Info label="Batch Number" value={restock.batchNumber || "—"} />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Payment Status
                  </p>
                  <Badge className={payConfig.color}>{payConfig.label}</Badge>
                </div>
                <Info
                  label="Created By"
                  value={restock.createdBy?.name || "—"}
                />
                <Info
                  label="Expiry Date"
                  value={
                    restock.expiryDate ? formatDate(restock.expiryDate) : "—"
                  }
                />
              </div>

              {restock.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{restock.notes}</p>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  Items ({restock.items?.length || 0})
                </h4>
                <DataTable<RestockItem>
                  dense
                  columns={itemColumns}
                  data={restock.items ?? []}
                  getRowKey={(item) => item.id}
                />
              </div>

              <Separator />

              <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Cost</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatCurrency(restock.totalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Paid</span>
                  <span className="tabular-nums">{formatCurrency(restock.amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Balance Due</span>
                  <span
                    className={`font-semibold tabular-nums ${balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {(restock.payments?.length ?? 0) > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Payment History</h4>
                  <DataTable<RestockPayment>
                    dense
                    columns={paymentColumns}
                    data={restock.payments ?? []}
                    getRowKey={(p) => p.id}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data available.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {restock && balanceDue > 0 && (
            <Button
              onClick={() => setPaymentOpen(true)}
              icon={<Wallet className="h-4 w-4" />}
            >
              Record Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <RecordRestockPaymentPanel
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        restock={restock ?? null}
        userId={user?.id}
        onSuccess={() => setPaymentOpen(false)}
      />
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
