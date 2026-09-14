"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  staffFormValues,
  STAFF_ROLE_OPTIONS,
  validateStaffForm,
  type StaffFormData,
  type StaffMember,
} from "@/lib/staff";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/atoms/password-field";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

/** Slide-over form for adding or editing a staff member. */
export function StaffFormPanel({
  open,
  onOpenChange,
  staff,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  onSaved: () => void;
}) {
  const isEditing = !!staff;
  const [form, setForm] = useState<StaffFormData>(staffFormValues(staff));
  const [saving, setSaving] = useState(false);

  // Seed the form from the staff member each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(staffFormValues(staff));
  }

  const patch = (fields: Partial<StaffFormData>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const handleSave = async () => {
    const error = validateStaffForm(form, isEditing);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(
        isEditing ? `/api/staff/${staff.id}` : "/api/staff",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save staff");
      }

      toast.success(isEditing ? "Staff member updated" : "Staff member added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save staff member",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Staff Member" : "Add Staff Member"}
      description={
        isEditing
          ? "Update staff member information. Leave password blank to keep current."
          : "Create a new staff account with login credentials."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add"} Staff
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Name"
          id="staff-name"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        <TextField
          label="Email"
          id="staff-email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
        <TextField
          label="Phone"
          id="staff-phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => patch({ phone: e.target.value })}
        />
        <SearchSelect
          label="Role"
          id="staff-role"
          placeholder="Select role"
          clearable={false}
          value={form.role}
          onChange={(val) => patch({ role: val })}
          options={STAFF_ROLE_OPTIONS}
        />
        <PasswordField
          label={
            isEditing ? "Password (leave blank to keep current)" : "Password"
          }
          id="staff-password"
          placeholder={isEditing ? "Enter new password" : "Password"}
          value={form.password}
          onChange={(e) => patch({ password: e.target.value })}
        />
        {(!isEditing || form.password) && (
          <PasswordField
            label="Confirm Password"
            id="staff-confirm-password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => patch({ confirmPassword: e.target.value })}
          />
        )}
      </div>
    </FormPanel>
  );
}
