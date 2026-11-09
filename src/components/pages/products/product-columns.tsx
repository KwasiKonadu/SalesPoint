import { Star, Store, Tag } from "lucide-react";

import { StatusChip } from "@/components/atoms/status-chip";
import { TypeChip, typeChipColorFor } from "@/components/atoms/type-chip";
import type { Column } from "@/components/organisms/data-table";
import { formatCurrency } from "@/lib/format";
import { variantLabel, type ProductItem } from "@/lib/products";
import { channelShort, channelStyle } from "@/lib/discount-channel";
import { discountStatus, effectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
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
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            <span className="truncate">{product.name}</span>
            {product.showOnWebsite && (
              <Store className="size-3.5 shrink-0 text-muted-foreground" aria-label="On store" />
            )}
            {product.featured && (
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
            )}
          </p>
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
    width: "10rem",
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
    width: "9rem",
    className: "text-sm",
    render: (product) => product.productType?.name || "—",
  },
  {
    key: "costPrice",
    label: "Cost Price",
    width: "7rem",
    align: "right",
    className: "text-sm tabular-nums",
    render: (product) => formatCurrency(product.costPrice),
  },
  {
    key: "sellingPrice",
    label: "Selling Price",
    width: "9rem",
    align: "right",
    className: "text-sm font-medium tabular-nums",
    render: (product) => {
      const status = discountStatus(product);
      if (status === "active") {
        const channel = channelShort(product.discountChannel);
        return (
          <span
            className="inline-flex items-center justify-end gap-1.5"
            title={`Was ${formatCurrency(product.sellingPrice)}${channel ? ` · ${channel}` : ""}`}
          >
            <Tag className={cn("size-3.5 shrink-0", channelStyle(product.discountChannel).text)} aria-label="Discounted" />
            {formatCurrency(effectivePrice(product))}
          </span>
        );
      }
      return (
        <div className="leading-tight">
          {formatCurrency(product.sellingPrice)}
          {status === "scheduled" && (
            <span className="block text-xs font-normal text-amber-600">Discount scheduled</span>
          )}
        </div>
      );
    },
  },
  {
    key: "stock",
    label: "Stock",
    width: "6.5rem",
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
    width: "7rem",
    render: (product) => (
      <StatusChip
        label={product.isActive ? "Active" : "Inactive"}
        variant={product.isActive ? "success" : "neutral"}
      />
    ),
  },
];
