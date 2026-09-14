"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import type { Category } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { IconPicker } from "@/components/molecules/icon-picker";

/** Slide-over form for creating or editing a product category. */
export function CategoryFormPanel({
  open,
  onOpenChange,
  category,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!category;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Seed the fields from the category each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(category?.name || "");
      setDescription(category?.description || "");
      setIcon(category?.icon || "");
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { name: name.trim() };
      if (description.trim()) body.description = description.trim();
      body.icon = icon || null;
      if (isEditing) body.isActive = category.isActive;

      const res = await fetch(
        isEditing ? `/api/categories/${category.id}` : "/api/categories",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save category");
      }

      toast.success(isEditing ? "Category updated" : "Category created");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Category" : "New Category"}
      description={
        isEditing
          ? "Update category details."
          : "Create a new product category."
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
          <Button
            type="submit"
            form="product-category-form"
            disabled={submitting || !name.trim()}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <form
        id="product-category-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <TextField
          label="Name"
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Beverages"
        />
        <TextField
          label="Description"
          id="cat-desc"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
        />
        <IconPicker value={icon} onChange={setIcon} />
      </form>
    </FormPanel>
  );
}
