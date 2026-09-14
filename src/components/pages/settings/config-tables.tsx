import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/organisms/data-table";
import type { ProductType, Unit } from "@/lib/settings";

/** Active / Inactive pill shared by the product-type and unit tables. */
export function ConfigStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className={
        active
          ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
          : ""
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export const productTypeColumns: Column<ProductType>[] = [
  {
    key: "name",
    label: "Name",
    width: "minmax(160px, 1fr)",
    className: "font-medium",
    render: (pt) => pt.name,
  },
  {
    key: "tracksStock",
    label: "Tracks Stock",
    width: "minmax(130px, max-content)",
    render: (pt) => (
      <Badge variant={pt.tracksStock ? "default" : "outline"} className="gap-1">
        {pt.tracksStock ? (
          <>
            <CheckCircle2 className="h-3 w-3" /> Yes
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" /> No
          </>
        )}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "minmax(110px, max-content)",
    render: (pt) => <ConfigStatusBadge active={pt.isActive} />,
  },
];

export const unitColumns: Column<Unit>[] = [
  {
    key: "name",
    label: "Name",
    width: "minmax(160px, 1fr)",
    className: "font-medium",
    render: (u) => u.name,
  },
  {
    key: "shortName",
    label: "Short Name",
    width: "minmax(120px, max-content)",
    className: "text-muted-foreground",
    render: (u) => u.shortName || "—",
  },
  {
    key: "status",
    label: "Status",
    width: "minmax(110px, max-content)",
    render: (u) => <ConfigStatusBadge active={u.isActive} />,
  },
];
