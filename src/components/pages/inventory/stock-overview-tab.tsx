"use client";

import { useState } from "react";
import { MinusCircle, Package, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataPagination } from "@/components/molecules/data-pagination";
import { DataTable } from "@/components/organisms/data-table";
import { SearchSelect } from "@/components/molecules/search-select";
import type { Category, InventoryItem } from "@/lib/inventory";

import { AdjustStockDialog } from "./adjust-stock-dialog";
import { inventoryColumns } from "./inventory-columns";
import { SummaryCards } from "./summary-cards";
import type { useInventoryOverview } from "./use-inventory";

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low" },
  { value: "out_of_stock", label: "Out" },
];

/** Stock Overview tab: KPI tiles, filter toolbar, sortable table + Adjust Stock. */
export function StockOverviewTab({
  overview,
  categories,
  isAdmin,
  onNewRestock,
}: {
  overview: ReturnType<typeof useInventoryOverview>;
  categories: Category[];
  isAdmin: boolean;
  onNewRestock: () => void;
}) {
  const [adjustOpen, setAdjustOpen] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      <SummaryCards
        summary={overview.summary}
        loading={overview.summaryLoading}
      />

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={overview.search}
              onChange={(e) => overview.setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-40">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="All Categories"
              value={overview.category}
              onChange={overview.setCategory}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {STATUS_PILLS.map((s) => (
              <Button
                key={s.value}
                variant={overview.status === s.value ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => overview.setStatus(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustOpen(true)}
              >
                <MinusCircle className="mr-1.5 h-4 w-4" />
                Adjust Stock
              </Button>
              <Button variant="outline" size="sm" onClick={onNewRestock}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Restock
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable<InventoryItem>
        columns={inventoryColumns}
        data={overview.data}
        getRowKey={(item) => item.id}
        isLoading={overview.loading}
        sortKey={overview.sortField}
        sortDir={overview.sortDir}
        onSort={overview.handleSort}
        emptyIcon={Package}
        emptyMessage={
          overview.hasFilters
            ? "No products match your filters."
            : "No inventory data yet."
        }
        emptyAction={
          overview.hasFilters ? (
            <Button variant="outline" size="sm" onClick={overview.clearFilters}>
              Clear Filters
            </Button>
          ) : undefined
        }
      />
      <DataPagination
        page={overview.page}
        totalPages={Math.ceil(overview.total / overview.pageSize)}
        onPageChange={overview.setPage}
        total={overview.total}
        pageSize={overview.pageSize}
        noun="products"
        showNumbers
      />

      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        onSubmitted={() => {
          overview.refresh();
          overview.refreshSummary();
        }}
      />
    </div>
  );
}
