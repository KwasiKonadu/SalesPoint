import { TypeChip, typeChipColorFor } from "@/components/atoms/type-chip";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/organisms/data-table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { lowStockThreshold } from "@/lib/stock";
import { variantLabel } from "@/lib/products";
import {
  MOVEMENT_TYPE_CONFIG,
  MOVEMENT_TYPE_FALLBACK,
  paymentStatusConfig,
  type InventoryItem,
  type Restock,
  type StockMovement,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/pages/products/product-image";

import { StockStatusBadge } from "./stock-status-badge";

const movementConfig = (type: string) =>
  MOVEMENT_TYPE_CONFIG[type] || { ...MOVEMENT_TYPE_FALLBACK, label: type };

export const inventoryColumns: Column<InventoryItem>[] = [
  {
    key: "name",
    label: "Product",
    width: "minmax(220px, 1.5fr)",
    sortable: true,
    render: (item) => (
      <div className="flex items-center gap-3">
        <ProductImage name={item.product.name} image={item.product.image} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.product.name}</p>
          <p className="text-xs text-muted-foreground">
            {variantLabel(item.product) || item.product.sku}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    width: "minmax(120px, max-content)",
    sortable: true,
    render: (item) =>
      item.product.category ? (
        <TypeChip
          label={item.product.category.name}
          color={typeChipColorFor(item.product.category.name)}
        />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "quantity",
    label: "Current Stock",
    width: "minmax(120px, max-content)",
    align: "right",
    sortable: true,
    render: (item) => (
      <span
        className={cn(
          "text-lg font-bold tabular-nums",
          item.quantity === 0
            ? "text-red-600"
            : item.stockStatus === "low_stock" && "text-amber-600",
        )}
      >
        {item.quantity}
      </span>
    ),
  },
  {
    key: "minStock",
    label: "Min Stock",
    width: "minmax(90px, max-content)",
    align: "right",
    className: "tabular-nums",
    render: (item) =>
      lowStockThreshold(item.product.targetStock, item.product.lowStockPercent) ||
      "—",
  },
  {
    key: "stockValue",
    label: "Stock Value",
    width: "minmax(110px, max-content)",
    align: "right",
    sortable: true,
    className: "tabular-nums",
    render: (item) => formatCurrency(item.quantity * item.product.costPrice),
  },
  {
    key: "status",
    label: "Status",
    width: "minmax(110px, max-content)",
    render: (item) => <StockStatusBadge status={item.stockStatus} />,
  },
  {
    key: "updatedAt",
    label: "Last Updated",
    width: "minmax(150px, max-content)",
    sortable: true,
    className: "text-sm text-muted-foreground",
    render: (item) => formatDateTime(item.updatedAt),
  },
];

export const movementColumns: Column<StockMovement>[] = [
  {
    key: "createdAt",
    label: "Date/Time",
    width: "minmax(150px, max-content)",
    className: "text-sm text-muted-foreground",
    render: (m) => formatDateTime(m.createdAt),
  },
  {
    key: "product",
    label: "Product",
    width: "minmax(200px, 1.5fr)",
    render: (m) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{m.product.name}</p>
        <p className="text-xs text-muted-foreground">
          {variantLabel(m.product) || m.product.sku}
        </p>
      </div>
    ),
  },
  {
    key: "type",
    label: "Type",
    width: "minmax(110px, max-content)",
    render: (m) => {
      const config = movementConfig(m.type);
      return <Badge className={config.color}>{config.label}</Badge>;
    },
  },
  {
    key: "quantity",
    label: "Quantity",
    width: "minmax(90px, max-content)",
    align: "right",
    render: (m) => {
      const config = movementConfig(m.type);
      return (
        <span
          className={cn(
            "font-semibold tabular-nums",
            config.addition ? "text-emerald-600" : "text-red-600",
          )}
        >
          {config.addition ? "+" : "-"}
          {m.quantity}
        </span>
      );
    },
  },
  {
    key: "reference",
    label: "Reference",
    width: "minmax(120px, max-content)",
    className: "text-sm text-muted-foreground",
    render: (m) => (m.referenceId ? m.referenceId.slice(0, 12) : "—"),
  },
  {
    key: "note",
    label: "Note",
    width: "minmax(160px, 1fr)",
    className: "truncate text-sm text-muted-foreground",
    render: (m) => m.note || "—",
  },
];

export const restockColumns: Column<Restock>[] = [
  {
    key: "reference",
    label: "Reference #",
    width: "minmax(140px, 1fr)",
    className: "text-sm font-medium",
    render: (r) => r.reference || `#${r.id.slice(0, 8)}`,
  },
  {
    key: "supplier",
    label: "Supplier",
    width: "minmax(150px, 1fr)",
    className: "text-sm",
    render: (r) => r.supplier?.businessName || "—",
  },
  {
    key: "date",
    label: "Date",
    width: "minmax(110px, max-content)",
    className: "text-sm text-muted-foreground",
    render: (r) => formatDate(r.dateReceived),
  },
  {
    key: "items",
    label: "Items",
    width: "minmax(70px, max-content)",
    align: "right",
    className: "tabular-nums",
    render: (r) => r._count?.items || r.items?.length || 0,
  },
  {
    key: "totalCost",
    label: "Total Cost",
    width: "minmax(110px, max-content)",
    align: "right",
    className: "font-medium tabular-nums",
    render: (r) => formatCurrency(r.totalCost),
  },
  {
    key: "payment",
    label: "Payment",
    width: "minmax(110px, max-content)",
    render: (r) => {
      const config = paymentStatusConfig(r.paymentStatus);
      return <Badge className={config.color}>{config.label}</Badge>;
    },
  },
];
