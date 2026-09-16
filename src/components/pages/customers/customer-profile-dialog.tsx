"use client";

import {
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/format";
import type { CustomerSale } from "@/lib/customers";
import { useCustomerDetail } from "./use-customers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/organisms/data-table";
import { StatCard } from "@/components/molecules/stat-card";
import {
  PaymentMethodPill,
  SaleOutcomeBadge,
} from "@/components/atoms/status-badge";

const saleColumns: Column<CustomerSale>[] = [
  {
    key: "transactionNumber",
    label: "Transaction #",
    render: (s) => <span className="font-mono">{s.transactionNumber}</span>,
  },
  {
    key: "date",
    label: "Date",
    width: "8rem",
    render: (s) => formatDate(s.createdAt),
  },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    width: "7rem",
    render: (s) => (
      <span className="font-medium">{formatCurrency(s.totalAmount)}</span>
    ),
  },
  {
    key: "payment",
    label: "Payment",
    width: "9rem",
    render: (s) => <PaymentMethodPill method={s.paymentMethod} />,
  },
  {
    key: "status",
    label: "Status",
    width: "8rem",
    render: (s) => <SaleOutcomeBadge sale={s} />,
  },
];

/** Customer profile with KPI tiles, contact details and purchase history. */
export function CustomerProfileDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
}) {
  const { data: customer, isPending: loading } = useCustomerDetail(open ? customerId : null);

  const sales = customer?.sales ?? [];
  const owed = customer?.outstandingBalance ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {customer?.name ?? "Customer"}
          </DialogTitle>
          <DialogDescription>
            Customer profile &amp; purchase history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : customer ? (
          <Tabs defaultValue="purchases" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="purchases" className="flex-1">
                Purchase History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchases" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={DollarSign}
                  label="Total Spent"
                  value={formatCurrency(customer._sum?.totalAmount ?? 0)}
                  iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <StatCard
                  icon={Wallet}
                  label="Amount Owed"
                  value={formatCurrency(owed)}
                  iconClassName={
                    owed > 0
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                      : undefined
                  }
                  className={
                    owed > 0 ? "border-rose-300 dark:border-rose-500/40" : undefined
                  }
                />
                <StatCard
                  icon={ShoppingBag}
                  label="Purchases"
                  value={customer._count?.sales ?? 0}
                  iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
                <StatCard
                  icon={Calendar}
                  label="Last Purchase"
                  value={
                    sales.length > 0 ? formatDate(sales[0].createdAt) : "N/A"
                  }
                  iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {customer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.address}
                  </div>
                )}
              </div>

              <Separator />

              {sales.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No purchase history yet.
                </div>
              ) : (
                <DataTable<CustomerSale>
                  dense
                  columns={saleColumns}
                  data={sales}
                  getRowKey={(s) => s.id}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
