"use client";

import { ArrowLeftRight } from "lucide-react";

import { DataTable } from "@/components/organisms/data-table";

import { returnsColumns } from "./table-columns";
import type { ReturnsListController } from "./use-sales";

/** Returns tab: paginated table of processed returns. */
export function ReturnsTab({ list }: { list: ReturnsListController }) {
  return (
    <div className="mt-4 space-y-4">
      <DataTable
        columns={returnsColumns}
        data={list.returns}
        getRowKey={(r) => r.id}
        isLoading={list.loading}
        emptyIcon={ArrowLeftRight}
        emptyMessage="No returns yet"
        currentPage={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        total={list.total}
        pageSize={list.pageSize}
        pageNoun="returns"
      />
    </div>
  );
}
