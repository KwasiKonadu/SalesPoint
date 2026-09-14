"use client";

import { HandCoins, Printer, Receipt, RotateCcw } from "lucide-react";

import {
  PaymentMethodPill,
  SaleOutcomeBadge,
} from "@/components/atoms/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/organisms/data-table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment";
import type { Sale, SaleItem, SalePaymentRecord } from "@/lib/sales";

const itemColumns: Column<SaleItem>[] = [
  {
    key: "product",
    label: "Product",
    render: (item) => <span className="font-medium">{item.productName}</span>,
  },
  {
    key: "qty",
    label: "Qty",
    align: "center",
    width: "2.5rem",
    render: (item) => item.quantity,
  },
  {
    key: "unitPrice",
    label: "Unit Price",
    align: "right",
    width: "5rem",
    render: (item) => formatCurrency(item.unitPrice),
  },
  {
    key: "costPrice",
    label: "Cost Price",
    align: "right",
    width: "5rem",
    render: (item) => formatCurrency(item.costPrice),
  },
  {
    key: "subtotal",
    label: "Subtotal",
    align: "right",
    width: "5rem",
    render: (item) => formatCurrency(item.subtotal),
  },
];

const paymentColumns: Column<SalePaymentRecord>[] = [
  {
    key: "amount",
    label: "Amount",
    width: "3rem",
    render: (p) => (
      <div className="font-medium tabular-nums">
        {formatCurrency(p.amount)}
        {p.note && (
          <p className="truncate text-xs font-normal text-muted-foreground">
            {p.note}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "method",
    label: "Method",
    width: "5rem",
    render: (p) => paymentMethodLabel(p.method),
  },
  {
    key: "recordedBy",
    label: "Recorded By",
    width: "15rem",
    render: (p) => (
      <span className="text-muted-foreground">{p.recordedBy?.name ?? "—"}</span>
    ),
  },
  {
    key: "date",
    label: "Date",
    align: "right",
    width: "7rem",
    render: (p) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(p.createdAt)}
      </span>
    ),
  },
];

/** Full sale breakdown: parties, line items, totals, payment and actions. */
export function SaleDetailDialog({
  open,
  onOpenChange,
  sale,
  loading,
  isAdmin,
  onViewReceipt,
  onPrintReceipt,
  onProcessReturn,
  onRecordPayment,
  onViewPaymentReceipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  loading: boolean;
  isAdmin: boolean;
  onViewReceipt: () => void;
  onPrintReceipt: () => void;
  onProcessReturn: () => void;
  onRecordPayment: () => void;
  onViewPaymentReceipt: (paymentId: string) => void;
}) {
  const balanceDue = sale
    ? Math.round((sale.totalAmount - (sale.amountReceived ?? 0)) * 100) / 100
    : 0;
  const hasBalance = !!sale && sale.status !== "refunded" && balanceDue > 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-170">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle className="font-mono text-lg">
              {sale?.transactionNumber}
            </DialogTitle>
            {sale && <SaleOutcomeBadge sale={sale} />}
          </div>
          <DialogDescription>
            {sale ? formatDateTime(sale.createdAt) : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : sale ? (
          <div className="space-y-2">
            {/* Customer & Sales Person */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {sale.customer?.name || "Walk-in"}
                </p>
                {sale.customer?.phone && (
                  <p className="text-xs text-muted-foreground">
                    {sale.customer.phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sales Person</p>
                <p className="font-medium">{sale.soldBy.name}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Items</h3>
              <DataTable<SaleItem>
                dense
                columns={itemColumns}
                data={sale.items ?? []}
                getRowKey={(item) => item.id}
              />
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-65 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                {sale.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(sale.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(sale.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <PaymentMethodPill method={sale.paymentMethod} />
              </div>
              {sale.amountReceived != null && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Amount Received
                  </p>
                  <p className="font-medium">
                    {formatCurrency(sale.amountReceived)}
                  </p>
                </div>
              )}
              {sale.changeAmount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p className="font-medium">
                    {formatCurrency(sale.changeAmount)}
                  </p>
                </div>
              )}
              {hasBalance && (
                <div>
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className="font-semibold text-rose-600">
                    {formatCurrency(balanceDue)}
                  </p>
                </div>
              )}
            </div>

            {/* Payment history */}
            {sale.payments && sale.payments.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Payments Recorded</h3>
                <DataTable<SalePaymentRecord>
                  dense
                  columns={paymentColumns}
                  data={sale.payments}
                  getRowKey={(p) => p.id}
                  rowActions={(p) => [
                    {
                      label: "Receipt",
                      icon: Receipt,
                      onClick: () => onViewPaymentReceipt(p.id),
                    },
                  ]}
                />
              </div>
            )}

            {/* Notes */}
            {sale.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{sale.notes}</p>
              </div>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              {hasBalance && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={onRecordPayment}
                >
                  <HandCoins className="mr-1.5 h-4 w-4" />
                  Record Payment
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onViewReceipt}>
                <Receipt className="mr-1.5 h-4 w-4" />
                Receipt
              </Button>
              <Button size="sm" variant="outline" onClick={onPrintReceipt}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print
              </Button>
              {isAdmin && sale.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-600 hover:bg-amber-50"
                  onClick={onProcessReturn}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Return
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
