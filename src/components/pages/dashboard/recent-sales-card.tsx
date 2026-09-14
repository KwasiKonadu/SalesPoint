import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { PaymentMethodPill } from '@/components/atoms/status-badge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RecentSale } from '@/lib/dashboard';

const columns: Column<RecentSale>[] = [
  {
    key: 'transactionNumber',
    label: 'Transaction',
    width: 'minmax(120px, 1fr)',
    className: 'font-mono text-xs',
    render: (sale) => sale.transactionNumber,
  },
  {
    key: 'customer',
    label: 'Customer',
    width: 'minmax(120px, 1fr)',
    render: (sale) => sale.customer?.name || 'Walk-in',
  },
  {
    key: 'amount',
    label: 'Amount',
    width: 'minmax(90px, max-content)',
    align: 'right',
    className: 'font-semibold',
    render: (sale) => formatCurrency(sale.totalAmount),
  },
  {
    key: 'payment',
    label: 'Payment',
    width: 'minmax(110px, max-content)',
    render: (sale) => <PaymentMethodPill method={sale.paymentMethod || 'cash'} />,
  },
  {
    key: 'status',
    label: 'Status',
    width: 'minmax(100px, max-content)',
    render: (sale) => (
      <Badge
        variant={sale.status === 'completed' ? 'default' : 'secondary'}
        className="text-xs capitalize"
      >
        {sale.status}
      </Badge>
    ),
  },
  {
    key: 'date',
    label: 'Date',
    width: 'minmax(100px, max-content)',
    align: 'right',
    className: 'whitespace-nowrap text-xs text-muted-foreground',
    render: (sale) => formatDate(sale.createdAt),
  },
];

/** Most recent transactions. */
export function RecentSalesCard({ sales }: { sales: RecentSale[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Sales</CardTitle>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm text-primary"
          >
            <Link href="/sales">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {sales.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent sales
          </p>
        ) : (
          <div className="-mx-6 px-6">
            <DataTable<RecentSale>
              bare
              columns={columns}
              data={sales}
              getRowKey={(sale) => sale.id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
