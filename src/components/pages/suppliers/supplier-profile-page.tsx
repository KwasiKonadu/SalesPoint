"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/format";
import type { SupplierRestock } from "@/lib/suppliers";
import { useSupplierDetail } from "./use-suppliers";
import { Button } from "@/components/ui/button";
import { RestockDetailDialog } from "../inventory/restock-detail-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/organisms/data-table";
import { StatCard } from "@/components/molecules/stat-card";
import { PaymentStatusBadge } from "@/components/atoms/status-badge";

const historyColumns: Column<SupplierRestock>[] = [
  {
    key: "date",
    label: "Date",
    width: "7rem",
    render: (r) => (
      <span className="whitespace-nowrap">{formatDate(r.dateReceived)}</span>
    ),
  },
  { key: "reference", label: "Reference", render: (r) => r.reference || "—" },
  { key: "batch", label: "Batch", render: (r) => r.batchNumber || "—" },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    width: "7rem",
    render: (r) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(r.totalCost)}
      </span>
    ),
  },
  {
    key: "payment",
    label: "Payment",
    width: "8rem",
    render: (r) => <PaymentStatusBadge status={r.paymentStatus} />,
  },
  {
    key: "notes",
    label: "Notes",
    render: (r) => (
      <span className="block max-w-50 truncate text-muted-foreground">
        {r.notes || "—"}
      </span>
    ),
  },
];

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

/** Full-page supplier profile: overview KPIs + info, purchase history, products supplied. */
export default function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: supplier, isPending } = useSupplierDetail(id ?? null);
  const router = useRouter();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const back = (
    <Link
      href="/contacts?tab=suppliers"
      className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Suppliers
    </Link>
  );

  if (isPending || !supplier) {
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const history = supplier.restockHistory ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {back}
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Building2 className="size-6" />
            {supplier.businessName || "Supplier Details"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Supplier profile and purchase history
          </p>
        </div>
        <Button onClick={() => router.push(`/inventory/restock/new?supplier=${supplier.id}`)}>
          <Plus className="mr-2 size-4" /> New order
        </Button>
      </div>

      <RestockDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        restockId={detailId}
      />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
            <TabsTrigger value="products">Products Supplied</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={ShoppingBag}
                label="Total Purchases"
                value={formatCurrency(supplier.totalPurchases)}
                iconClassName="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                icon={AlertCircle}
                label="Outstanding Balance"
                value={formatCurrency(supplier.outstandingBalance)}
                iconClassName="bg-amber-50 text-amber-600"
              />
              <StatCard
                icon={FileText}
                label="Number of Orders"
                value={supplier._count?.restocks ?? history.length ?? 0}
                iconClassName="bg-violet-50 text-violet-600"
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Supplier Information
              </h4>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <InfoRow
                  icon={<Building2 className="size-4" />}
                  label="Business Name"
                  value={supplier.businessName}
                />
                <InfoRow
                  icon={<Building2 className="size-4" />}
                  label="Contact Person"
                  value={supplier.contactPerson}
                />
                <InfoRow
                  icon={<Phone className="size-4" />}
                  label="Phone"
                  value={supplier.phone}
                />
                <InfoRow
                  icon={<Mail className="size-4" />}
                  label="Email"
                  value={supplier.email}
                />
                <InfoRow
                  icon={<MapPin className="size-4" />}
                  label="Address"
                  value={supplier.address}
                />
                <InfoRow
                  icon={<Building2 className="size-4" />}
                  label="Status"
                  value={supplier.isActive ? "Active" : "Inactive"}
                />
              </div>
              {supplier.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">
                      Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm">
                      {supplier.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length > 0 ? (
              <DataTable<SupplierRestock>
                dense
                columns={historyColumns}
                data={history}
                getRowKey={(r) => r.id}
                onRowClick={(r) => {
                  setDetailId(r.id);
                  setDetailOpen(true);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No purchase history yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Product supply details will appear here once restock items are
                tracked.
              </p>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
