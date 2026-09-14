"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

import { CURRENCIES } from "@/lib/currency";
import type { BusinessSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { FieldLabel } from "@/components/atoms/field-label";
import { TextField } from "@/components/atoms/text-field";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";

/** Slide-over form for editing business details and tax configuration. */
export function BusinessInfoFormPanel({
  open,
  onOpenChange,
  settings,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BusinessSettings;
  saving: boolean;
  onSave: (settings: BusinessSettings) => Promise<boolean>;
}) {
  const [form, setForm] = useState<BusinessSettings>(settings);

  // Re-seed the form from the current settings each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(settings);
  }

  const patch = (fields: Record<string, string>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const taxEnabled = form.tax_enabled === "true";

  const handleSave = async () => {
    const ok = await onSave(form);
    if (ok) onOpenChange(false);
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Business Information"
      description="Update your business details and tax configuration."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Business Name"
          id="business_name"
          value={form.business_name || ""}
          onChange={(e) => patch({ business_name: e.target.value })}
        />
        <TextField
          label="Address"
          id="address"
          type="textarea"
          value={form.address || ""}
          onChange={(e) => patch({ address: e.target.value })}
          rows={3}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Phone"
            id="phone"
            value={form.phone || ""}
            onChange={(e) => patch({ phone: e.target.value })}
          />
          <TextField
            label="Email"
            id="email"
            type="email"
            value={form.email || ""}
            onChange={(e) => patch({ email: e.target.value })}
          />
        </div>
        <TextField
          label="Website"
          id="website"
          value={form.website || ""}
          onChange={(e) => patch({ website: e.target.value })}
          placeholder="https://example.com"
        />

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchSelect
            label="Currency"
            id="currency"
            clearable={false}
            value={form.currency || "GHS"}
            onChange={(value) => patch({ currency: value })}
            options={CURRENCIES.map((c) => ({
              value: c.code,
              label: `${c.code} — ${c.label}`,
              sublabel: c.symbol,
            }))}
          />
          <TextField
            label="Tax Rate (%)"
            id="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.tax_rate || ""}
            onChange={(e) => patch({ tax_rate: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FieldLabel htmlFor="tax_enabled">Tax Enabled</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Apply tax to sales transactions.
            </p>
          </div>
          <Switch
            id="tax_enabled"
            checked={taxEnabled}
            onCheckedChange={(checked) =>
              patch({ tax_enabled: String(checked) })
            }
          />
        </div>

        <Separator />

        <TextField
          label="Logo URL"
          id="logo_url"
          value={form.logo_url || ""}
          onChange={(e) => patch({ logo_url: e.target.value })}
          placeholder="https://example.com/logo.png"
        />
      </div>
    </FormPanel>
  );
}
