"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import {
  EMAIL_RE,
  supplierFormValues,
  type Supplier,
  type SupplierFormData,
} from "@/lib/suppliers";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";

/** Slide-over form for adding or editing a supplier. */
export function SupplierFormPanel({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!supplier;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SupplierFormData>(
    supplierFormValues(supplier),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Seed the form from the supplier each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(supplierFormValues(supplier));
      setErrors({});
    }
  }

  const updateField = (
    field: keyof SupplierFormData,
    value: string | boolean,
  ) => {
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
    if (!form.businessName.trim())
      next.businessName = "Business name is required";
    if (form.email && !EMAIL_RE.test(form.email))
      next.email = "Invalid email format";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        businessName: form.businessName.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (isEditing) body.isActive = form.isActive;

      const res = await fetch(
        isEditing ? `/api/suppliers/${supplier.id}` : "/api/suppliers",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save supplier");
      }

      toast.success(
        isEditing
          ? "Supplier updated successfully"
          : "Supplier created successfully",
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save supplier",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Supplier" : "Add New Supplier"}
      description={
        isEditing
          ? "Update the supplier details below."
          : "Fill in the details to add a new supplier."
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
          <Button type="submit" form="supplier-form" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update Supplier" : "Add Supplier"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Business Name"
          id="businessName"
          placeholder="e.g., Accra Wholesale Ltd"
          value={form.businessName}
          onChange={(e) => updateField("businessName", e.target.value)}
          error={errors.businessName}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Contact Person"
            id="contactPerson"
            placeholder="John Doe"
            value={form.contactPerson}
            onChange={(e) => updateField("contactPerson", e.target.value)}
          />
          <TextField
            label="Phone"
            id="phone"
            placeholder="+233 24 000 0000"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Email"
            id="email"
            type="email"
            placeholder="supplier@example.com"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Address"
            id="address"
            placeholder="123 Business Street"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>

        <TextField
          label="Notes"
          id="notes"
          type="textarea"
          placeholder="Additional notes..."
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
        />

        {isEditing && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {form.isActive ? "Active supplier" : "Inactive supplier"}
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        )}
      </form>
    </FormPanel>
  );
}
