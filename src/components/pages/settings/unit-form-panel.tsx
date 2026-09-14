"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Unit } from "@/lib/settings";
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const res = await fetch(
        isEditing ? `/api/units/${unit.id}` : "/api/units",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            shortName: shortName.trim() || null,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      toast.success(isEditing ? "Unit updated" : "Unit added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save unit");
    } finally {
      setSaving(false);
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
