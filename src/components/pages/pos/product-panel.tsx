"use client";

import type { PosProduct } from "@/lib/pos";

import { CategoryFilter } from "./category-filter";
import { ProductGrid } from "./product-grid";
import { ProductSearch } from "./product-search";
import type { usePosCatalog } from "./use-pos-catalog";

/** Left column of the POS screen: search + category pills + product grid. */
export function ProductPanel({
  catalog,
  onAdd,
  onAddPack,
}: {
  catalog: ReturnType<typeof usePosCatalog>;
  onAdd: (product: PosProduct) => void;
  onAddPack: (product: PosProduct) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ProductSearch value={catalog.searchQuery} onChange={catalog.search} />
      <CategoryFilter
        categories={catalog.categories}
        selectedCategoryId={catalog.selectedCategoryId}
        onSelect={catalog.filterByCategory}
      />
      <ProductGrid
        products={catalog.products}
        loading={catalog.productsLoading}
        error={catalog.productsError}
        hasFilters={catalog.hasFilters}
        onAdd={onAdd}
        onAddPack={onAddPack}
        onRetry={catalog.retry}
        onClearFilters={catalog.clearFilters}
      />
    </div>
  );
}
