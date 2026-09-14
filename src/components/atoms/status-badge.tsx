'use client';

import { cn } from '@/lib/utils';
import { StatusChip, type StatusVariant } from '@/components/atoms/status-chip';
import {
  SALE_STATUS_META,
  PAYMENT_STATUS_META,
  paymentMethodColor,
  paymentMethodLabel,
} from '@/lib/payment';

const SALE_STATUS_VARIANT: Record<string, StatusVariant> = {
  completed: 'success',
  refunded: 'danger',
  partial_refund: 'warning',
  pending: 'warning',
};

const PAYMENT_STATUS_VARIANT: Record<string, StatusVariant> = {
  paid: 'success',
  partially_paid: 'warning',
  unpaid: 'danger',
};

const SALE_OUTCOME_META: Record<string, { label: string; variant: StatusVariant }> = {
  paid: { label: 'Paid', variant: 'success' },
  part_payment: { label: 'Part Payment', variant: 'warning' },
  unpaid: { label: 'Unpaid', variant: 'danger' },
  failed: { label: 'Failed', variant: 'danger' },
  reversed: { label: 'Reversed', variant: 'danger' },
  partial_refund: { label: 'Partial Refund', variant: 'warning' },
};

export function saleOutcome(sale: { status: string; paymentStatus: string }): string {
  if (sale.status === 'refunded') return 'reversed';
  if (sale.status === 'partial_refund') return 'partial_refund';
  if (sale.paymentStatus === 'partial') return 'part_payment';
  if (sale.paymentStatus === 'pending') return 'unpaid';
  if (sale.paymentStatus === 'failed') return 'failed';
  return 'paid';
}

/** Sale / return lifecycle status. */
export function SaleStatusBadge({ status }: { status: string }) {
  const label = SALE_STATUS_META[status]?.label ?? status.replace(/_/g, ' ');
  return <StatusChip label={label} variant={SALE_STATUS_VARIANT[status] ?? 'neutral'} />;
}

/** Restock / supplier payment status. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const label = PAYMENT_STATUS_META[status]?.label ?? PAYMENT_STATUS_META.unpaid.label;
  return <StatusChip label={label} variant={PAYMENT_STATUS_VARIANT[status] ?? 'danger'} />;
}

/** Sales "Status" column: Paid / Part Payment / Unpaid / Reversed / Partial Refund / Failed. */
export function SaleOutcomeBadge({
  sale,
}: {
  sale: { status: string; paymentStatus: string };
}) {
  const meta = SALE_OUTCOME_META[saleOutcome(sale)];
  return <StatusChip label={meta.label} variant={meta.variant} />;
}

/** Coloured pill for a payment method. */
export function PaymentMethodPill({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        paymentMethodColor(method),
      )}
    >
      {paymentMethodLabel(method)}
    </span>
  );
}

/** Active / Inactive pill used across staff, customers, suppliers, settings. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <StatusChip label={active ? 'Active' : 'Inactive'} variant={active ? 'success' : 'neutral'} />
  );
}
