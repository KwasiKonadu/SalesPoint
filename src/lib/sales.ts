/**
 * Types, filter vocabularies and receipt helpers shared by the Sales & Returns
 * screen and its sub-components (`src/components/sales/*`).
 */

// ==================== Types ====================

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
}

export interface SalePaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number;
  method: string;
  note?: string | null;
  createdAt: string;
  recordedBy?: { id: string; name: string } | null;
}

export interface Sale {
  id: string;
  transactionNumber: string;
  customerId?: string | null;
  soldById: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  /** completed | partial (part payment) | pending (unpaid) | failed */
  paymentStatus: string;
  amountReceived?: number | null;
  changeAmount: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone?: string | null } | null;
  soldBy: { id: string; name: string };
  items?: SaleItem[];
  payments?: SalePaymentRecord[];
  receipt?: { receiptNumber: string } | null;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  saleId: string;
  customerId?: string | null;
  processedById: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  sale?: { transactionNumber: string } | null;
  customer?: { name: string } | null;
  processedBy: { name: string };
  items?: ReturnItem[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Filter vocabularies ====================

export const RETURN_REASONS = [
  'Customer Changed Mind',
  'Damaged Product',
  'Incorrect Product',
  'Product Issue',
  'Other',
];

export const SALES_PAYMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit' },
];

export const SALES_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partial_refund', label: 'Partial Refund' },
];

// ==================== Return calculations ====================

/** Sum of `returnItems[i].quantity * saleItems[i].unitPrice`, matched by index. */
export function calcRefundTotal(
  saleItems: SaleItem[] | undefined,
  returnItems: ReturnItemInput[],
): number {
  if (!saleItems) return 0;
  return saleItems.reduce(
    (sum, item, i) => sum + (returnItems[i]?.quantity ?? 0) * item.unitPrice,
    0,
  );
}

// ==================== Receipt printing ====================

const RECEIPT_PRINT_STYLES = `
  body { font-family: 'Courier New', ui-monospace, Menlo, Consolas, monospace; max-width: 320px; margin: 0 auto; padding: 20px; font-size: 12px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .separator { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; }
  .text-right { text-align: right; }
  .mt-4 { margin-top: 16px; }
`;

/** Wraps rendered receipt markup in a standalone, print-styled HTML document. */
export function buildPrintableReceipt(innerHTML: string): string {
  return `
      <html>
        <head>
          <title>Receipt</title>
          <style>${RECEIPT_PRINT_STYLES}</style>
        </head>
        <body>${innerHTML}</body>
      </html>
    `;
}
