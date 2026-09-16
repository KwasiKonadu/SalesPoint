"use client";

import { useState } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/lib/expenses";
import { TabBar } from "@/components/molecules/tab-bar";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { assignTypeChipColors } from "@/components/atoms/type-chip";
import { ExpenseSummaryCards } from "./expense-summary-cards";
import { ExpenseFormPanel } from "./expense-form-panel";
import { ExpenseCategoryFormPanel } from "./expense-category-form-panel";
import { ExpenseCategoriesTab } from "./expense-categories-tab";
import { ExpensesTab } from "./expenses-tab";
import {
  useDeleteExpense,
  useExpenseCategories,
  useExpenseSummary,
  useExpensesList,
} from "./use-expenses";

export default function ExpensesPage() {
  const [tab, setTab] = useState<"expenses" | "categories">("expenses");

  const list = useExpensesList();
  const { categories } = useExpenseCategories();
  assignTypeChipColors(categories.map((c) => c.name));
  const { summary, loading: summaryLoading } = useExpenseSummary();

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const deleteExpense = useDeleteExpense();

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormOpen(true);
  };
  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseFormOpen(true);
  };
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatFormOpen(true);
  };
  const openEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setCatFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      toast.success("Expense deleted");
      setDeletingExpense(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete expense",
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={tab}
          onTabChange={(t) => setTab(t as "expenses" | "categories")}
          tabs={[
            { key: "expenses", label: "Expenses" },
            { key: "categories", label: "Categories" },
          ]}
        />
      </PageTabsSlot>

      <ExpenseSummaryCards summary={summary} loading={summaryLoading} />

      {tab === "expenses" && (
        <ExpensesTab
          list={list}
          categories={categories}
          onAdd={openAddExpense}
          onEdit={openEditExpense}
          onDelete={setDeletingExpense}
        />
      )}

      {tab === "categories" && (
        <ExpenseCategoriesTab
          categories={categories}
          onAdd={openAddCategory}
          onEdit={openEditCategory}
        />
      )}

      <ExpenseFormPanel
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        expense={editingExpense}
        categories={categories}
      />

      <ExpenseCategoryFormPanel
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        category={editingCategory}
      />

      <ConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(o) => !o && setDeletingExpense(null)}
        title="Delete Expense"
        description={
          <>
            Are you sure you want to delete this expense of{" "}
            <span className="font-medium">
              {deletingExpense ? formatCurrency(deletingExpense.amount) : ""}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleteExpense.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
