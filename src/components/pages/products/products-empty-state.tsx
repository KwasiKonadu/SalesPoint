"use client";

import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shared "no products" panel for both the table and grid views. */
export function ProductsEmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="mb-3 size-12 text-muted-foreground/40" />
      <h3 className="font-medium">No products found</h3>
      <p className="mb-4 mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try adjusting your search or filters."
          : "Get started by adding your first product."}
      </p>
      {!filtered && (
        <Button onClick={onAdd} icon={<Plus className="size-4" />}>
          Add your first product
        </Button>
      )}
    </div>
  );
}
