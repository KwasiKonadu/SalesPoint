"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import {
  EXPENSE_PAYMENT_METHODS,
  expenseFormValues,
  type Expense,
  type ExpenseCategory,
  type ExpenseFormData,
} from "@/lib/expenses";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

/** Slide-over form for recording or editing a business expense. */
export function ExpenseFormPanel({
  open,
  onOpenChange,
  expense,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  categories: ExpenseCategory[];
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!expense;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>(expenseFormValues(expense));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Seed the form from the expense each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(expenseFormValues(expense));
      setErrors({});
    }
  }

  const updateField = (field: keyof ExpenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      next.amount = "Valid amount is required";
    }
    if (!form.date) next.date = "Date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        isEditing ? `/api/expenses/${expense.id}` : "/api/expenses",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({
            amount: Number(form.amount),
            date: form.date,
            paymentMethod: form.paymentMethod || undefined,
            description: form.description.trim() || undefined,
            expenseCategoryId: form.expenseCategoryId || undefined,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save expense");
      }

      toast.success(
        isEditing
          ? "Expense updated successfully"
          : "Expense added successfully",
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save expense",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Expense" : "Add New Expense"}
      description={
        isEditing
          ? "Update the expense details below."
          : "Record a new business expense."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="expense-form" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update Expense" : "Add Expense"}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchSelect
            label="Category"
            id="exp-category"
            placeholder="Select category"
            value={form.expenseCategoryId}
            onChange={(v) => updateField("expenseCategoryId", v)}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          />
          <CurrencyInput
            label="Amount *"
            id="exp-amount"
            lockCurrency
            value={form.amount}
            onValueChange={(v) => updateField("amount", v)}
            error={errors.amount}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Date *"
            id="exp-date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            error={errors.date}
          />
          <SearchSelect
            label="Payment Method"
            id="exp-payment"
            placeholder="Select method"
            clearable={false}
            value={form.paymentMethod}
            onChange={(v) => updateField("paymentMethod", v)}
            options={EXPENSE_PAYMENT_METHODS}
          />
        </div>

        <TextField
          label="Description"
          id="exp-description"
          type="textarea"
          placeholder="What was this expense for?"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
        />
      </form>
    </FormPanel>
  );
}
