"use client";

import { forwardRef } from "react";

import { useBusinessInfo, type BusinessInfo } from "@/lib/business-info";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment";

/**
 * The minimal sale shape the receipt needs. Both `Sale` (sales screen) and
 * `SaleResponse` (POS) satisfy it structurally.
 */
export interface ReceiptSale {
  transactionNumber: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived?: number | null;
  changeAmount: number;
  customer?: { name: string } | null;
  soldBy: { name: string };
  items?: {
    id?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  receipt?: { receiptNumber: string } | null;
}

interface ReceiptContentProps {
  sale: ReceiptSale;
  /** Override the stored business identity — used by the Settings preview. */
  business?: BusinessInfo;
}

/**
 * The receipt markup for a sale, styled to look like a printed till roll on
 * screen (see the `.receipt` rules in `globals.css`) and printing identically
 * via `buildPrintableReceipt`, which injects matching styles. Forward a ref to
 * read `.innerHTML` for printing. Business identity, footer and the
 * standard/compact layout come from Settings → Receipt (`useBusinessInfo`),
 * unless a `business` prop overrides it.
 */
export const ReceiptContent = forwardRef<HTMLDivElement, ReceiptContentProps>(
  function ReceiptContent({ sale, business: businessOverride }, ref) {
    const stored = useBusinessInfo();
    const business = businessOverride ?? stored;
    const compact = business.receiptFormat === "compact";

    return (
      <div
        ref={ref}
        className={
          "receipt space-y-1 font-mono " + (compact ? "text-xs" : "text-sm")
        }
      >
        {/* Business Info */}
        <div className="center bold text-base">{business.name}</div>
        {business.address && <div className="center">{business.address}</div>}
        {business.phone && <div className="center">Tel: {business.phone}</div>}
        {business.email && <div className="center">{business.email}</div>}
        <div className="separator" />

        {/* Receipt Info */}
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="bold">
            {sale.receipt?.receiptNumber || sale.transactionNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDateTime(sale.createdAt)}</span>
        </div>
        {!compact && (
          <div className="flex justify-between">
            <span>Sales Person:</span>
            <span>{sale.soldBy.name}</span>
          </div>
        )}
        {!compact && sale.customer && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
        <div className="separator" />

        {/* Items */}
        <table>
          <thead>
            <tr className="bold">
              <td>Item</td>
              <td className="text-right">Qty</td>
              {!compact && <td className="text-right">Price</td>}
              <td className="text-right">Total</td>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={item.id ?? i}>
                <td className="max-w-25 truncate" title={item.productName}>
                  {item.productName}
                </td>
                <td className="text-right">{item.quantity}</td>
                {!compact && (
                  <td className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                )}
                <td className="text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="separator" />

        {/* Totals */}
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discountAmount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
        )}
        <div className="separator" />
        <div className="flex justify-between bold text-base">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
        <div className="separator" />

        {/* Payment */}
        <div className="flex justify-between">
          <span>Payment:</span>
          <span>{paymentMethodLabel(sale.paymentMethod)}</span>
        </div>
        {sale.amountReceived != null && (
          <div className="flex justify-between">
            <span>Amount Received:</span>
            <span>{formatCurrency(sale.amountReceived)}</span>
          </div>
        )}
        {sale.changeAmount > 0 && (
          <div className="flex justify-between">
            <span>Change:</span>
            <span>{formatCurrency(sale.changeAmount)}</span>
          </div>
        )}

        <div className="separator mt-4" />
        <div className="center text-xs mt-2">{business.receiptFooter}</div>
      </div>
    );
  },
);
