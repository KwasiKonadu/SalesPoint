"use client";

import {
  Download,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/molecules/search-select";
import type { Category, ViewMode } from "@/lib/products";

/**
 * The products table toolbar: search, category / status filters, view toggle,
 * Export and "Add Product" — styled to match the DataTable toolbar so it reads
 * as part of the table below it.
 */
export function ProductsToolbar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onAddProduct,
  onExport,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddProduct: () => void;
  onExport?: () => void;
}) {
  return (
    <div className="mb-3 rounded-xl border bg-card px-4 py-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-52 sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="w-40">
          <SearchSelect
            size="sm"
            clearable={false}
            placeholder="All Categories"
            value={categoryFilter}
            onChange={onCategoryChange}
            options={[
              { value: "_all", label: "All Categories" },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
          />
        </div>

        <div className="w-32">
          <SearchSelect
            size="sm"
            clearable={false}
            value={statusFilter}
            onChange={onStatusChange}
            options={[
              { value: "active", label: "Active" },
              { value: "_all", label: "All" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onViewModeChange("table")}
            >
              <LayoutList className="size-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={!onExport}
            icon={<Download className="size-4" />}
          >
            Export
          </Button>

          <Button
            size="sm"
            onClick={onAddProduct}
            icon={<Plus className="size-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>
    </div>
  );
}
