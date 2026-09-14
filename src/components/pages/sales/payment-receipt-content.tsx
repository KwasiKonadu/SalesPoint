"use client";

import { forwardRef } from "react";

import { useBusinessInfo, type BusinessInfo } from "@/lib/business-info";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment";
import type { Sale } from "@/lib/sales";

const round = (n: number) => Math.round(n * 100) / 100;

interface PaymentReceiptContentProps {
  sale: Sale;
  paymentId: string;
  /** Override the stored business identity — used by the Settings preview. */
  business?: BusinessInfo;
}

/**
 * Printable acknowledgement for one payment recorded against a sale. Mirrors
 * {@link ReceiptContent}'s till-roll styling and prints via
 * `buildPrintableReceipt`. The sale receipt stays the record of the sale; this
 * is the record of a payment against it, with the balance carried forward.
 */
export const PaymentReceiptContent = forwardRef<
  HTMLDivElement,
  PaymentReceiptContentProps
>(function PaymentReceiptContent({ sale, paymentId, business: override }, ref) {
  const stored = useBusinessInfo();
  const business = override ?? stored;

  const ordered = [...(sale.payments ?? [])].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );
  const payment = ordered.find((p) => p.id === paymentId);

  // Cumulative amount paid through (and including) this payment.
  let paidThrough = 0;
  for (const p of ordered) {
    paidThrough += p.amount;
    if (p.id === paymentId) break;
  }
  const previouslyPaid = round(paidThrough - (payment?.amount ?? 0));
  const balanceRemaining = Math.max(0, round(sale.totalAmount - paidThrough));

  if (!payment) return null;

  return (
    <div ref={ref} className="receipt space-y-1 font-mono text-sm">
      {/* Business Info */}
      <div className="center bold text-base">{business.name}</div>
      {business.address && <div className="center">{business.address}</div>}
      {business.phone && <div className="center">Tel: {business.phone}</div>}
      {business.email && <div className="center">{business.email}</div>}
      <div className="separator" />
      <div className="center bold">PAYMENT RECEIPT</div>
      <div className="separator" />

      {/* Receipt Info */}
      <div className="flex justify-between">
        <span>Receipt #:</span>
        <span className="bold">{payment.receiptNumber}</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{formatDateTime(payment.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span>For Sale:</span>
        <span>{sale.transactionNumber}</span>
      </div>
      {sale.customer && (
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{sale.customer.name}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Received By:</span>
        <span>{payment.recordedBy?.name ?? "—"}</span>
      </div>
      <div className="flex justify-between">
        <span>Method:</span>
        <span>{paymentMethodLabel(payment.method)}</span>
      </div>
      {payment.note && (
        <div className="flex justify-between">
          <span>Note:</span>
          <span>{payment.note}</span>
        </div>
      )}
      <div className="separator" />

      {/* Amounts */}
      <div className="flex justify-between">
        <span>Sale Total:</span>
        <span>{formatCurrency(sale.totalAmount)}</span>
      </div>
      {previouslyPaid > 0 && (
        <div className="flex justify-between">
          <span>Previously Paid:</span>
          <span>{formatCurrency(previouslyPaid)}</span>
        </div>
      )}
      <div className="separator" />
      <div className="flex justify-between bold text-base">
        <span>AMOUNT PAID:</span>
        <span>{formatCurrency(payment.amount)}</span>
      </div>
      <div className="separator" />
      <div className="flex justify-between bold">
        <span>Balance Remaining:</span>
        <span>{formatCurrency(balanceRemaining)}</span>
      </div>

      <div className="separator mt-4" />
      <div className="center text-xs mt-2">{business.receiptFooter}</div>
    </div>
  );
});
