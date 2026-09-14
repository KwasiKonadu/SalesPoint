/** Payment-method + transaction-status vocabulary shared by sales, customers and POS. */

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

const PAYMENT_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
);

export function paymentMethodLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method;
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  mobile_money: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  card: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  bank_transfer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  credit: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export function paymentMethodColor(method: string): string {
  return PAYMENT_COLORS[method] ?? 'bg-muted text-muted-foreground';
}

/** Sale / return lifecycle status → { label, badge classes }. */
export const SALE_STATUS_META: Record<string, { label: string; className: string }> = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  partial_refund: {
    label: 'Partial Refund',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

/** Restock / supplier payment status → badge classes. */
export const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  partially_paid: {
    label: 'Partial',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};
