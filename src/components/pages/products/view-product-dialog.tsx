"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { variantLabel, type ProductItem } from "@/lib/products";

import { ProductDiscountSection } from "./product-discount-section";
import { ProductStoreToggles } from "./product-store-toggles";

/** Quick manage popup: online store switches, price and discount. */
export function ViewProductDialog({
  product,
  open,
  onOpenChange,
  onProductChange,
}: {
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the refreshed product after a price, discount or store change. */
  onProductChange?: (product: ProductItem) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {variantLabel(product) || product.sku}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ProductStoreToggles
            product={product}
            onSaved={(p) => onProductChange?.(p)}
          />
          <Separator />
          <ProductDiscountSection
            key={product.id}
            product={product}
            onSaved={(p) => onProductChange?.(p)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
