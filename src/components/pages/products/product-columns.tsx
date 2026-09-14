import { StatusChip } from "@/components/atoms/status-chip";
import { TypeChip, typeChipColorFor } from "@/components/atoms/type-chip";
import type { Column } from "@/components/organisms/data-table";
import { formatCurrency } from "@/lib/format";
import { variantLabel, type ProductItem } from "@/lib/products";
import { lowStockThreshold } from "@/lib/stock";

import { ProductImage } from "./product-image";
import { StockBadge } from "./stock-badge";

/** Column definitions for the products table view. */
export const productColumns: Column<ProductItem>[] = [
  {
    key: "product",
    label: "Product",
    width: "minmax(220px, 1.5fr)",
    render: (product) => (
      <div className="flex items-center gap-3">
        <ProductImage name={product.name} image={product.image} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {variantLabel(product) || product.sku}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    width: "minmax(120px, max-content)",
    render: (product) =>
      product.category ? (
        <TypeChip
          label={product.category.name}
          color={typeChipColorFor(product.category.name)}
        />
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "type",
    label: "Type",
    width: "minmax(100px, max-content)",
    className: "text-sm",
    render: (product) => product.productType?.name || "—",
  },
  {
    key: "costPrice",
    label: "Cost Price",
    width: "minmax(100px, max-content)",
    align: "right",
    className: "text-sm tabular-nums",
    render: (product) => formatCurrency(product.costPrice),
  },
  {
    key: "sellingPrice",
    label: "Selling Price",
    width: "minmax(100px, max-content)",
    align: "right",
    className: "text-sm font-medium tabular-nums",
    render: (product) => formatCurrency(product.sellingPrice),
  },
  {
    key: "stock",
    label: "Stock",
    width: "minmax(90px, max-content)",
    render: (product) => (
      <StockBadge
        quantity={product.inventory?.quantity ?? 0}
        threshold={lowStockThreshold(
          product.targetStock,
          product.lowStockPercent,
        )}
        tracksStock={product.productType?.tracksStock ?? true}
      />
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "minmax(100px, max-content)",
    render: (product) => (
      <StatusChip
        label={product.isActive ? "Active" : "Inactive"}
        variant={product.isActive ? "success" : "neutral"}
      />
    ),
  },
];
