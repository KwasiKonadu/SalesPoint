"use client";

import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/organisms/data-table";
import { SearchSelect } from "@/components/molecules/search-select";
import {
  EXPENSE_PAYMENT_METHODS,
  type Expense,
  type ExpenseCategory,
} from "@/lib/expenses";

import { expenseColumns } from "./expense-columns";
import type { ExpensesListController } from "./use-expenses";

/** Expenses tab: filter toolbar + paginated table with row actions. */
export function ExpensesTab({
  list,
  categories,
  onAdd,
  onEdit,
  onDelete,
}: {
  list: ExpensesListController;
  categories: ExpenseCategory[];
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <DataTable
      columns={expenseColumns}
      data={list.expenses}
      getRowKey={(e) => e.id}
      isLoading={list.loading}
      searchValue={list.search}
      onSearch={list.setSearch}
      searchPlaceholder="Search expenses..."
      extraFilters={
        <>
          <div className="w-40">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="All Categories"
              value={list.categoryFilter}
              onChange={list.setCategoryFilter}
              options={[
                { value: "_all", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
            />
          </div>

          <Input
            type="date"
            value={list.startDate}
            onChange={(e) => list.setStartDate(e.target.value)}
            className="w-35"
            placeholder="From"
          />
          <Input
            type="date"
            value={list.endDate}
            onChange={(e) => list.setEndDate(e.target.value)}
            className="w-35"
            placeholder="To"
          />

          <div className="w-36">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="Payment"
              value={list.paymentFilter}
              onChange={list.setPaymentFilter}
              options={[
                { value: "_all", label: "All Methods" },
                ...EXPENSE_PAYMENT_METHODS,
              ]}
            />
          </div>
        </>
      }
      actionButton={{ label: "Add Expense", icon: Plus, onClick: onAdd }}
      emptyIcon={Receipt}
      emptyMessage="No expenses found"
      emptyDescription={
        list.hasFilters
          ? "Try adjusting your search or filters."
          : "Record your first expense to start tracking spending."
      }
      emptyAction={
        list.hasFilters ? undefined : (
          <Button onClick={onAdd} icon={<Plus className="size-4" />}>
            Add Expense
          </Button>
        )
      }
      rowActions={(exp) => [
        { label: "Edit", icon: Pencil, onClick: () => onEdit(exp) },
        {
          label: "Delete",
          icon: Trash2,
          danger: true,
          onClick: () => onDelete(exp),
        },
      ]}
      currentPage={list.page}
      totalPages={list.totalPages}
      onPageChange={list.setPage}
      total={list.total}
      pageSize={list.pageSize}
      pageNoun="expenses"
      showPageNumbers
    />
  );
}
