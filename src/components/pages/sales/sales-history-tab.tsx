"use client";

import { Eye, ShoppingBag } from "lucide-react";

import { DataTable } from "@/components/organisms/data-table";
import type { Sale } from "@/lib/sales";

import { SalesFilters } from "./sales-filters";
import { salesColumns } from "./table-columns";
import type { SalesListController } from "./use-sales";

/** Sales-history tab: filterable, paginated table of sales. */
export function SalesHistoryTab({
  list,
  onView,
}: {
  list: SalesListController;
  onView: (sale: Sale) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <DataTable
        columns={salesColumns}
        data={list.sales}
        getRowKey={(s) => s.id}
        isLoading={list.loading}
        searchValue={list.filters.search}
        onSearch={list.filters.setSearch}
        searchPlaceholder="Search transaction # or customer..."
        extraFilters={
          <SalesFilters filters={list.filters} staffList={list.staffList} />
        }
        emptyIcon={ShoppingBag}
        emptyMessage="No sales found"
        rowActions={(sale) => [
          { label: "View", icon: Eye, onClick: () => onView(sale) },
        ]}
        currentPage={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        total={list.total}
        pageSize={list.pageSize}
        pageNoun="sales"
      />
    </div>
  );
}
