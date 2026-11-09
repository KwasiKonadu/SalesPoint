"use client";

import { Star, Store } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import type { ProductItem } from "@/lib/products";

import { useSaveProduct } from "./use-products";

/** "Show on store" and "Featured" switches; each change saves immediately. */
export function ProductStoreToggles({
  product,
  onSaved,
}: {
  product: ProductItem;
  onSaved: (p: ProductItem) => void;
}) {
  const saveProduct = useSaveProduct();
  const shown = !!product.showOnWebsite;
  const featured = !!product.featured;

  const save = async (patch: { showOnWebsite?: boolean; featured?: boolean }, message: string) => {
    try {
      const updated = await saveProduct.mutateAsync({ id: product.id, ...patch } as never);
      toast.success(message);
      onSaved(updated as unknown as ProductItem);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update product");
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Online store</h4>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" />
          Show on store
        </span>
        <Switch
          checked={shown}
          disabled={saveProduct.isPending}
          onCheckedChange={(c) =>
            // Hiding a product also un-features it so it can't linger on the homepage.
            save(c ? { showOnWebsite: true } : { showOnWebsite: false, featured: false }, c ? "Shown on store" : "Hidden from store")
          }
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Star className="size-4 text-muted-foreground" />
          Featured on homepage
          {!shown && <span className="text-xs font-normal text-muted-foreground">(show on store first)</span>}
        </span>
        <Switch
          checked={featured}
          disabled={!shown || saveProduct.isPending}
          onCheckedChange={(c) => save({ featured: c }, c ? "Marked as featured" : "Removed from featured")}
        />
      </label>
    </div>
  );
}
