"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ProductType } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";

/** Slide-over form for creating or editing a product type. */
export function ProductTypeFormPanel({
  open,
  onOpenChange,
  productType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType | null;
  onSaved: () => void;
}) {
  const isEditing = !!productType;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tracksStock, setTracksStock] = useState(true);
  const [saving, setSaving] = useState(false);

  // Seed the fields from the product type each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(productType?.name || "");
      setDescription(productType?.description || "");
      setTracksStock(productType?.tracksStock ?? true);
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        isEditing
          ? `/api/product-types/${productType.id}`
          : "/api/product-types",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            tracksStock,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      toast.success(isEditing ? "Product type updated" : "Product type added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product type",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Product Type" : "Add Product Type"}
      description={
        isEditing
          ? "Update the product type details."
          : "Create a new product type."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Name *"
          id="pt-name"
          placeholder="e.g., Physical Product"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Description"
          id="pt-desc"
          type="textarea"
          placeholder="Brief description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pt-stock"
            checked={tracksStock}
            onCheckedChange={(checked) => setTracksStock(checked === true)}
          />
          <Label htmlFor="pt-stock" className="cursor-pointer">
            Tracks Stock
          </Label>
        </div>
      </div>
    </FormPanel>
  );
}
