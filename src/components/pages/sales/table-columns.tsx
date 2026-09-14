import {
  PaymentMethodPill,
  SaleOutcomeBadge,
  SaleStatusBadge,
} from '@/components/atoms/status-badge';
import type { Column } from '@/components/organisms/data-table';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ReturnRecord, Sale } from '@/lib/sales';

export const statusBadge = (status: string) => <SaleStatusBadge status={status} />;

export const salesColumns: Column<Sale>[] = [
  {
    key: 'transactionNumber',
    label: 'Transaction #',
    width: '150px',
    render: (s) => (
      <span className="font-mono text-sm font-medium">{s.transactionNumber}</span>
    ),
  },
  {
    key: 'customer',
    label: 'Customer',
    width: 'minmax(150px, 1fr)',
    render: (s) => s.customer?.name || 'Walk-in',
  },
  {
    key: 'soldBy',
    label: 'Sales Person',
    width: '150px',
    render: (s) => s.soldBy.name,
  },
  {
    key: 'items',
    label: 'Items',
    width: '50px',
    align: 'center',
    render: (s) => s.items?.length ?? 0,
  },
  {
    key: 'amount',
    label: 'Amount',
    width: 'minmax(100px, 1fr)',
    align: 'right',
    render: (s) => (
      <span className="font-medium">{formatCurrency(s.totalAmount)}</span>
    ),
  },
  {
    key: 'payment',
    label: 'Payment',
    width: '100px',
    render: (s) => <PaymentMethodPill method={s.paymentMethod} />,
  },
  {
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (s) => <SaleOutcomeBadge sale={s} />,
  },
  {
    key: 'date',
    label: 'Date',
    width: '100px',
    className: 'text-sm text-muted-foreground',
    render: (s) => formatDate(s.createdAt),
  },
];

export const returnsColumns: Column<ReturnRecord>[] = [
  {
    key: 'returnNumber',
    label: 'Return #',
    width: '150px',
    render: (r) => (
      <span className="font-mono text-sm font-medium">{r.returnNumber}</span>
    ),
  },
  {
    key: 'saleTxn',
    label: 'Transaction',
    width: 'minmax(150px, 1.2fr)',
    render: (r) => (
      <span className="font-mono text-sm">{r.sale?.transactionNumber || '—'}</span>
    ),
  },
  {
    key: 'customer',
    label: 'Customer',
    width: '100px',
    render: (r) => r.customer?.name || 'Walk-in',
  },
  {
    key: 'items',
    label: 'Items',
    width: '50px',
    align: 'center',
    render: (r) => r.items?.length ?? 0,
  },
  {
    key: 'refundAmount',
    label: 'Refund Amount',
    width: 'minmax(120px, 1fr)',
    align: 'right',
    render: (r) => (
      <span className="font-medium">{formatCurrency(r.refundAmount)}</span>
    ),
  },
  {
    key: 'reason',
    label: 'Reason',
    width: '160px',
    className: 'truncate',
    render: (r) => <span title={r.reason}>{r.reason}</span>,
  },
  {
    key: 'date',
    label: 'Date',
    width: '100px',
    className: 'text-sm text-muted-foreground',
    render: (r) => formatDate(r.createdAt),
  },
  {
    key: 'processedBy',
    label: 'Processed By',
    width: '120px',
    render: (r) => r.processedBy.name,
  },
  {
    key: 'status',
    label: 'Status',
    width: '80px',
    render: (r) => statusBadge(r.status),
  },
];
