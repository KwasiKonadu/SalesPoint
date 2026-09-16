"use client";

import { useMemo } from "react";

import { DataPagination } from "@/components/molecules/data-pagination";
import type { Category, ProductItem } from "@/lib/products";

import { ProductCard } from "./product-card";
import { ProductsEmptyState } from "./products-empty-state";

export interface ProductViewProps {
  products: ProductItem[];
  hasFilters: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (product: ProductItem) => void;
}

/** Products grid view — compact cards with Edit / Archive actions. */
export function ProductGridView({
  products,
  categories,
  hasFilters,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onAdd,
  onEdit,
  onView,
  onToggleActive,
}: ProductViewProps & {
  categories: Category[];
  onView: (product: ProductItem) => void;
  onToggleActive: (product: ProductItem) => void;
}) {
  const categoryIcons = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const c of categories) map.set(c.id, c.icon);
    return map;
  }, [categories]);

  if (products.length === 0) {
    return <ProductsEmptyState filtered={hasFilters} onAdd={onAdd} />;
  }

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryIcon={
              product.categoryId ? categoryIcons.get(product.categoryId) : undefined
            }
            onOpenDetails={() => onView(product)}
            onEdit={() => onEdit(product)}
            onToggleActive={() => onToggleActive(product)}
          />
        ))}
      </div>
      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        total={total}
        pageSize={pageSize}
        noun="products"
        showNumbers
      />
    </div>
  );
}
