"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  customerFormValues,
  type Customer,
  type CustomerFormData,
} from "@/lib/customers";
import { useSaveCustomer } from "./use-customers";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";

/** Slide-over form for adding or editing a customer. */
export function CustomerFormPanel({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}) {
  const isEditing = !!customer;
  const [form, setForm] = useState<CustomerFormData>(
    customerFormValues(customer),
  );
  const saveCustomer = useSaveCustomer();

  // Seed the form from the customer each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(customerFormValues(customer));
  }

  const patch = (fields: Partial<CustomerFormData>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      await saveCustomer.mutateAsync({ id: customer?.id, ...form });
      toast.success(
        isEditing
          ? "Customer updated successfully"
          : "Customer added successfully",
      );
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update customer" : "Failed to add customer",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Customer" : "Add Customer"}
      description={
        isEditing
          ? "Update the customer information below."
          : "Fill in the details to add a new customer."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveCustomer.isPending}>
            {saveCustomer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add"} Customer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Name"
          id="cust-name"
          placeholder="Customer name"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        <TextField
          label="Phone"
          id="cust-phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => patch({ phone: e.target.value })}
        />
        <TextField
          label="Email"
          id="cust-email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
        <TextField
          label="Address"
          id="cust-address"
          type="textarea"
          placeholder="Street address, city, region"
          value={form.address}
          onChange={(e) => patch({ address: e.target.value })}
          rows={2}
        />
        <TextField
          label="Notes"
          id="cust-notes"
          type="textarea"
          placeholder="Any additional notes"
          value={form.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          rows={2}
        />
        <div className="flex items-center justify-between">
          <label htmlFor="cust-status" className="text-sm font-medium">
            Active
          </label>
          <Switch
            id="cust-status"
            checked={form.isActive}
            onCheckedChange={(checked) => patch({ isActive: checked })}
          />
        </div>
      </div>
    </FormPanel>
  );
}
