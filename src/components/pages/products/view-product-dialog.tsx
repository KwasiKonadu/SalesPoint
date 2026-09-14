"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { variantLabel, type ProductItem } from "@/lib/products";

import { ProductImage } from "./product-image";

/** Read-only product detail view. */
export function ViewProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ProductImage name={product.name} image={product.image} size="lg" />
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {variantLabel(product) && (
                <p className="text-sm font-medium text-muted-foreground">
                  {variantLabel(product)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{product.sku}</p>
              <div className="mt-1">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Category" value={product.category?.name || "None"} />
            <Detail label="Type" value={product.productType?.name || "None"} />
            <Detail label="Unit" value={product.unit?.name || "None"} />
            <Detail label="Stock" value={product.inventory?.quantity ?? 0} />
            <Detail
              label="Cost Price"
              value={formatCurrency(product.costPrice)}
            />
            <Detail
              label="Selling Price"
              value={formatCurrency(product.sellingPrice)}
            />
            {product.wholesalePrice != null && (
              <Detail
                label="Wholesale Price"
                value={formatCurrency(product.wholesalePrice)}
              />
            )}
            {product.packSize != null && (
              <Detail label="Pack Size" value={product.packSize} />
            )}
            {product.targetStock != null && (
              <Detail label="Low Stock Baseline" value={product.targetStock} />
            )}
            <Detail
              label="Low Stock Alert"
              value={`${product.lowStockPercent}%`}
            />
            {product.taxEnabled && (
              <Detail label="Tax Rate" value={`${product.taxRate}%`} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
