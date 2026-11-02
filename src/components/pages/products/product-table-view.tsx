"use client";

import { Eye, ImageIcon, Power, Tag, Trash2 } from "lucide-react";

import { DataTable } from "@/components/organisms/data-table";
import { DataPagination } from "@/components/molecules/data-pagination";
import type { ProductItem } from "@/lib/products";

import { productColumns } from "./product-columns";
import { ProductsEmptyState } from "./products-empty-state";
import type { ProductViewProps } from "./product-grid-view";

/** Products table view with row actions and pagination. */
export function ProductTableView({
  products,
  hasFilters,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onAdd,
  onView,
  onDetails,
  onChangeImage,
  onToggleActive,
  onDelete,
}: ProductViewProps & {
  /** Opens the quick popup: online store, price and discount. Also what tapping a row does. */
  onView: (product: ProductItem) => void;
  /** Opens the read-only details. */
  onDetails: (product: ProductItem) => void;
  onChangeImage: (product: ProductItem) => void;
  onToggleActive: (product: ProductItem) => void;
  onDelete: (product: ProductItem) => void;
}) {
  if (products.length === 0) {
    return <ProductsEmptyState filtered={hasFilters} onAdd={onAdd} />;
  }

  return (
    <div className="space-y-3">
      <DataTable<ProductItem>
        columns={productColumns}
        data={products}
        getRowKey={(product) => product.id}
        onRowClick={onView}
        rowClassName={(product) =>
          !product.isActive ? "opacity-60" : undefined
        }
        rowActions={(product) => [
          { label: "View Details", icon: Eye, onClick: () => onDetails(product) },
          { label: "Price & discount", icon: Tag, onClick: () => onView(product) },
          { label: "Change image", icon: ImageIcon, onClick: () => onChangeImage(product) },
          {
            label: product.isActive ? "Deactivate" : "Activate",
            icon: Power,
            onClick: () => onToggleActive(product),
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => onDelete(product),
          },
        ]}
      />
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
