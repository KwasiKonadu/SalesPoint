"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Loader2, PackageX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/organisms/data-table";
import { StatCard } from "@/components/molecules/stat-card";
import { TabBar } from "@/components/molecules/tab-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import { variantLabel } from "@/lib/products";
import type { StockBatchRow } from "@/lib/inventory";
import { useAdjustStock, useStockBatches } from "./use-inventory";

const DAY = 86_400_000;

/** Whole days from today until `iso` (negative once passed), or null when undated. */
function daysLeft(iso?: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - today.getTime()) / DAY);
}

function ExpiryChip({ iso }: { iso?: string | null }) {
  const d = daysLeft(iso);
  if (d === null) return <span className="text-muted-foreground">No expiry</span>;
  const cls =
    d < 0
      ? "bg-red-100 text-red-700"
      : d <= 30
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";
  const text = d < 0 ? `Expired ${-d}d ago` : d === 0 ? "Expires today" : `${d}d left`;
  return (
    <div className="space-y-0.5">
      <p className="text-sm">{formatDate(iso!)}</p>
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{text}</span>
    </div>
  );
}

/** Expiry tab: every batch still in stock, earliest expiry first, with write-off for expired ones. */
export function ExpiryTab({ enabled, isAdmin }: { enabled: boolean; isAdmin: boolean }) {
  const [filter, setFilter] = useState("dated");
  const { data, isPending } = useStockBatches(filter, enabled);
  const adjust = useAdjustStock();
  const [writingOff, setWritingOff] = useState<string | null>(null);

  const writeOff = async (b: StockBatchRow) => {
    setWritingOff(b.id);
    try {
      await adjust.mutateAsync({
        productId: b.productId,
        quantity: b.remaining,
        type: "expired",
        batchId: b.id,
        note: `Batch expired ${formatDate(b.expiryDate!)}`,
      });
      toast.success(`Wrote off ${b.remaining} × ${b.product.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to write off");
    } finally {
      setWritingOff(null);
    }
  };

  const columns: Column<StockBatchRow>[] = [
    {
      key: "product",
      label: "Product",
      width: "minmax(200px, 1.5fr)",
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {b.product.name}
            {variantLabel(b.product) && (
              <span className="font-normal text-muted-foreground"> · {variantLabel(b.product)}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{b.product.sku}</p>
        </div>
      ),
    },
    {
      key: "batch",
      label: "Batch",
      width: "11rem",
      render: (b) => (
        <span className="text-sm text-muted-foreground">
          {b.label ?? `Received ${formatDate(b.createdAt)}`}
        </span>
      ),
    },
    { key: "expiry", label: "Expiry", width: "11rem", render: (b) => <ExpiryChip iso={b.expiryDate} /> },
    {
      key: "remaining",
      label: "Remaining",
      width: "8rem",
      align: "right",
      className: "text-sm tabular-nums",
      render: (b) => (
        <span>
          {b.remaining}
          <span className="text-muted-foreground"> / {b.received}</span>
        </span>
      ),
    },
    {
      key: "value",
      label: "Cost value",
      width: "8rem",
      align: "right",
      className: "text-sm tabular-nums",
      render: (b) => formatCurrency(b.remaining * b.product.costPrice),
    },
    {
      key: "action",
      label: "",
      width: "8rem",
      align: "right",
      render: (b) => {
        const d = daysLeft(b.expiryDate);
        if (!isAdmin || d === null || d >= 0) return null;
        return (
          <Button size="sm" variant="outline" disabled={writingOff === b.id} onClick={() => writeOff(b)}>
            {writingOff === b.id && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Write off
          </Button>
        );
      },
    },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={PackageX}
          label="Expired (still in stock)"
          value={data?.expired ?? 0}
          iconClassName="bg-red-100 text-red-600"
        />
        <StatCard
          icon={CalendarClock}
          label="Expiring in 30 days"
          value={data?.expiringSoon ?? 0}
          iconClassName="bg-amber-100 text-amber-600"
        />
      </div>

      <TabBar
        bare
        activeTab={filter}
        onTabChange={setFilter}
        tabs={[
          { key: "dated", label: "With expiry" },
          { key: "expired", label: "Expired" },
          { key: "soon", label: "Expiring soon" },
          { key: "all", label: "All batches" },
        ]}
      />

      <DataTable<StockBatchRow>
        columns={columns}
        data={data?.data ?? []}
        getRowKey={(b) => b.id}
        isLoading={isPending}
        emptyIcon={AlertTriangle}
        emptyMessage="No batches match this filter."
      />
    </div>
  );
}
