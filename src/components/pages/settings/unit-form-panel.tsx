"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Unit } from "@/lib/settings";
import { useSaveUnit } from "@/hooks/api/use-units";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";

/** Slide-over form for creating or editing a unit of measurement. */
export function UnitFormPanel({
  open,
  onOpenChange,
  unit,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit | null;
  onSaved: () => void;
}) {
  const isEditing = !!unit;
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const saveUnit = useSaveUnit();

  // Seed the fields from the unit each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(unit?.name || "");
      setShortName(unit?.shortName || "");
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await saveUnit.mutateAsync({
        id: unit?.id,
        name: name.trim(),
        shortName: shortName.trim() || null,
      });
      toast.success(isEditing ? "Unit updated" : "Unit added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save unit");
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Unit" : "Add Unit"}
      description={
        isEditing
          ? "Update the unit details."
          : "Create a new unit of measurement."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveUnit.isPending}>
            {saveUnit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Name *"
          id="unit-name"
          placeholder="e.g., Kilogram"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Short Name"
          id="unit-short"
          placeholder="e.g., kg"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
        />
      </div>
    </FormPanel>
  );
}
