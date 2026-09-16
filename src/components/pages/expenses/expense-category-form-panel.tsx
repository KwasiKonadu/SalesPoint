"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { CategoryFormData, ExpenseCategory } from "@/lib/expenses";
import { useSaveExpenseCategory } from "./use-expenses";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";

/** Slide-over form for creating or editing an expense category. */
export function ExpenseCategoryFormPanel({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategory | null;
}) {
  const isEditing = !!category;
  const saveCategory = useSaveExpenseCategory();
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Seed the form from the category each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        name: category?.name || "",
        description: category?.description || "",
      });
      setErrors({});
    }
  }

  const updateField = (field: keyof CategoryFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Category name is required" });
      return;
    }

    try {
      await saveCategory.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });

      toast.success(
        isEditing
          ? "Category updated successfully"
          : "Category created successfully",
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Category" : "Add New Category"}
      description={
        isEditing
          ? "Update the category name and description."
          : "Create a new expense category."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveCategory.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="expense-category-form"
            disabled={saveCategory.isPending}
          >
            {saveCategory.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <form
        id="expense-category-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <TextField
          label="Name *"
          id="cat-name"
          placeholder="e.g., Rent"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          error={errors.name}
        />
        <TextField
          label="Description"
          id="cat-description"
          type="textarea"
          placeholder="Optional description..."
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
        />
      </form>
    </FormPanel>
  );
}
