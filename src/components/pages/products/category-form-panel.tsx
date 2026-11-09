"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Category } from "@/lib/products";
import { useSaveCategory } from "@/hooks/api/use-categories";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { ImageUpload } from "@/components/molecules/image-upload";
import { IconPicker } from "@/components/molecules/icon-picker";

/** Slide-over form for creating or editing a product category. */
export function CategoryFormPanel({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}) {
  const isEditing = !!category;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [image, setImage] = useState("");
  const saveCategory = useSaveCategory();

  // Seed the fields from the category each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(category?.name || "");
      setDescription(category?.description || "");
      setIcon(category?.icon || "");
      setImage(category?.image || "");
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveCategory.mutateAsync({
        id: category?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon || null,
        image: image || null,
        ...(isEditing ? { isActive: category.isActive } : {}),
      });

      toast.success(isEditing ? "Category updated" : "Category created");
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
            disabled={saveCategory.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-category-form"
            disabled={saveCategory.isPending || !name.trim()}
          >
            {saveCategory.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
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
        <div className="space-y-1.5">
          <ImageUpload label="Website picture (optional)" name={name} value={image} onChange={(u) => setImage(u ?? "")} />
          <p className="text-xs text-muted-foreground">Without one, the website shows a collage of this category&apos;s products.</p>
        </div>
      </form>
    </FormPanel>
  );
}
