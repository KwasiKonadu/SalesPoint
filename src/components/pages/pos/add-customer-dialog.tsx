"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/atoms/text-field";
import type { PosCustomer } from "@/lib/pos";
import { useSaveCustomer } from "@/components/pages/customers/use-customers";

/** Quick "add a customer mid-sale" dialog. Posts to `/api/customers`. */
export function AddCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: PosCustomer) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const saveCustomer = useSaveCustomer();

  const reset = () => {
    setName("");
    setPhone("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      const customer = await saveCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      onCreated(customer as PosCustomer);
      onOpenChange(false);
      reset();
      toast.success("Customer added");
    } catch (err) {
      toast.error("Failed to add customer", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Quickly add a new customer for this sale
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <TextField
            label="Name *"
            id="cust-name"
            placeholder="Customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <TextField
            label="Phone"
            id="cust-phone"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saveCustomer.isPending || !name.trim()}>
            {saveCustomer.isPending ? "Adding..." : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
