"use client";

import { DEFAULT_BUSINESS_INFO, type BusinessInfo } from "@/lib/business-info";
import {
  ReceiptContent,
  type ReceiptSale,
} from "@/components/pages/sales/receipt-content";

const SAMPLE_SALE: ReceiptSale = {
  transactionNumber: "SALE-000123",
  createdAt: "2026-01-15T14:32:00",
  subtotal: 148.5,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 148.5,
  paymentMethod: "cash",
  amountReceived: 150,
  changeAmount: 1.5,
  customer: { name: "Walk-in" },
  soldBy: { name: "Ama Mensah" },
  items: [
    { productName: "Rice 5kg", quantity: 2, unitPrice: 45, subtotal: 90 },
    { productName: "Cooking Oil 1L", quantity: 1, unitPrice: 22.5, subtotal: 22.5 },
    { productName: "Sugar 1kg", quantity: 3, unitPrice: 12, subtotal: 36 },
  ],
};

/**
 * Live thermal-receipt preview for the Receipt Settings form. It renders the
 * real {@link ReceiptContent} with placeholder line items, driven by the
 * unsaved form values rather than the saved settings.
 */
export function ReceiptPreview({
  businessName,
  phone,
  email,
  address,
  footer,
  format,
}: {
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  footer?: string;
  format?: string;
}) {
  const business: BusinessInfo = {
    ...DEFAULT_BUSINESS_INFO,
    name: businessName?.trim() || DEFAULT_BUSINESS_INFO.name,
    address: address?.trim() ?? "",
    phone: phone?.trim() ?? "",
    email: email?.trim() ?? "",
    receiptFooter: footer?.trim() || DEFAULT_BUSINESS_INFO.receiptFooter,
    receiptFormat: format === "compact" ? "compact" : "standard",
  };

  return (
    <div className="mx-auto w-75 max-w-full rounded-lg border bg-white p-5 text-neutral-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
      <ReceiptContent sale={SAMPLE_SALE} business={business} />
    </div>
  );
}
