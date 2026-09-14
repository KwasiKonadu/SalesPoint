import { AlertTriangle, Boxes, DollarSign, PackageX } from "lucide-react";

import { StatCard } from "@/components/molecules/stat-card";
import { formatCurrency } from "@/lib/format";
import type { InventorySummary } from "@/lib/inventory";

/** The four inventory KPI tiles above the Stock Overview table. */
export function SummaryCards({
  summary,
  loading,
}: {
  summary: InventorySummary | null;
  loading: boolean;
}) {
  const cards = [
    {
      label: "Total Inventory Value",
      value: summary ? formatCurrency(summary.totalValue) : "—",
      icon: DollarSign,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Products",
      value: summary ? summary.totalProducts.toString() : "—",
      icon: Boxes,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Low Stock Items",
      value: summary ? summary.lowStockCount.toString() : "—",
      icon: AlertTriangle,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      label: "Out of Stock Items",
      value: summary ? summary.outOfStockCount.toString() : "—",
      icon: PackageX,
      iconClassName: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <StatCard
          key={c.label}
          icon={c.icon}
          label={c.label}
          value={c.value}
          iconClassName={c.iconClassName}
          isLoading={loading}
        />
      ))}
    </div>
  );
}
