"use client";

import { AlertCircle, Package, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PosProduct } from "@/lib/pos";

import { ProductCard } from "./product-card";

const GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4";

/** The scrollable product area: loading / error / empty / populated states. */
export function ProductGrid({
  products,
  loading,
  error,
  hasFilters,
  onAdd,
  onAddPack,
  onRetry,
  onClearFilters,
}: {
  products: PosProduct[];
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  onAdd: (product: PosProduct) => void;
  onAddPack: (product: PosProduct) => void;
  onRetry: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {loading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border bg-card"
            >
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Package className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No products found</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={GRID_CLASS}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              onAddPack={onAddPack}
            />
          ))}
        </div>
      )}
    </div>
  );
}
