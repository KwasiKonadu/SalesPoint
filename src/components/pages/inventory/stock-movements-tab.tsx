"use client";

import { CalendarDays, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataPagination } from "@/components/molecules/data-pagination";
import { DataTable } from "@/components/organisms/data-table";
import { SearchSelect } from "@/components/molecules/search-select";
import {
  MOVEMENT_TYPE_CONFIG,
  MOVEMENT_TYPE_FILTERS,
  type InventoryProduct,
  type StockMovement,
} from "@/lib/inventory";

import { movementColumns } from "./inventory-columns";
import type { useStockMovements } from "./use-stock-movements";

/** Stock Movements tab: date-range / product / type filters + movement log table. */
export function StockMovementsTab({
  movements,
  products,
}: {
  movements: ReturnType<typeof useStockMovements>;
  products: InventoryProduct[];
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={movements.startDate}
                onChange={(e) => movements.setStartDate(e.target.value)}
                className="w-37.5 pl-9"
                placeholder="From"
              />
            </div>
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={movements.endDate}
              onChange={(e) => movements.setEndDate(e.target.value)}
              className="w-37.5"
              placeholder="To"
            />
          </div>

          <div className="w-full sm:w-52">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="All Products"
              value={movements.productId}
              onChange={movements.setProductId}
              options={[
                { value: "all", label: "All Products" },
                ...products.map((p) => ({
                  value: p.id,
                  label: p.name,
                  sublabel: p.sku,
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          {MOVEMENT_TYPE_FILTERS.map((t) => (
            <Button
              key={t}
              variant={movements.type === t ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => movements.setType(t)}
            >
              {t === "all" ? "All" : MOVEMENT_TYPE_CONFIG[t]?.label || t}
            </Button>
          ))}
        </div>
      </div>

      <DataTable<StockMovement>
        columns={movementColumns}
        data={movements.data}
        getRowKey={(m) => m.id}
        isLoading={movements.loading}
        emptyIcon={FileText}
        emptyMessage="No stock movements found."
        emptyAction={
          movements.hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={movements.clearFilters}
            >
              Clear Filters
            </Button>
          ) : undefined
        }
      />
      <DataPagination
        page={movements.page}
        totalPages={Math.ceil(movements.total / movements.pageSize)}
        onPageChange={movements.setPage}
        total={movements.total}
        pageSize={movements.pageSize}
        noun="movements"
        showNumbers
      />
    </div>
  );
}
