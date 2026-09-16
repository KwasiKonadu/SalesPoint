"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAdjustStock, useInventoryRefs } from "./use-inventory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/atoms/field-label";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

const ADJUSTMENT_TYPES = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "lost", label: "Lost" },
  { value: "adjustment", label: "Adjustment" },
];

/** Deduct stock for damaged / expired / lost items or a general adjustment. */
export function AdjustStockDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const { products } = useInventoryRefs();
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("damaged");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const adjustStock = useAdjustStock();

  // Clear the form when the panel closes.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSelectedProductId("");
      setAdjustmentType("damaged");
      setQuantity("");
      setNote("");
      setProductSearch("");
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await adjustStock.mutateAsync({
        productId: selectedProductId,
        quantity: parseInt(quantity),
        type: adjustmentType,
        note: note || undefined,
      });
      toast.success("Stock adjusted successfully");
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to adjust stock",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Adjust Stock"
      description="Deduct stock for damaged, expired, lost items, or general adjustment."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={adjustStock.isPending || !selectedProductId || !quantity}
          >
            {adjustStock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SearchSelect
          label="Product *"
          placeholder="Search and select a product…"
          value={selectedProductId}
          onChange={setSelectedProductId}
          onQueryChange={setProductSearch}
          options={filteredProducts.map((p) => ({
            value: p.id,
            label: p.name,
            sublabel: p.sku,
          }))}
        />

        <div className="space-y-2">
          <FieldLabel>Adjustment Type *</FieldLabel>
          <RadioGroup
            value={adjustmentType}
            onValueChange={setAdjustmentType}
            className="grid grid-cols-2 gap-2"
          >
            {ADJUSTMENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center space-x-2">
                <RadioGroupItem value={t.value} id={t.value} />
                <Label htmlFor={t.value} className="cursor-pointer font-normal">
                  {t.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <TextField
          label="Quantity *"
          type="number"
          min="1"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <TextField
          label="Note"
          type="textarea"
          placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>
    </FormPanel>
  );
}
