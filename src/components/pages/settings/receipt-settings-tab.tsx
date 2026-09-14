"use client";

import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TextField } from "@/components/atoms/text-field";
import { SearchSelect } from "@/components/molecules/search-select";
import { RECEIPT_FORMAT_OPTIONS } from "@/lib/settings";

import { ReceiptPreview } from "./receipt-preview";
import { SettingsFormSkeleton } from "./settings-skeletons";
import { useBusinessSettings } from "./use-business-settings";

const DEFAULT_FOOTER = "Thank you for your purchase!";
const DEFAULT_FORMAT = "standard";

/** Receipt tab: business identity shown on receipts + footer message + format. */
export function ReceiptSettingsTab() {
  const { settings, updateField, loading, saving, save } =
    useBusinessSettings("receipt settings");

  if (loading) return <SettingsFormSkeleton rows={5} labelWidth="w-32" />;

  const footer = settings.receipt_footer ?? DEFAULT_FOOTER;
  const format = settings.receipt_format ?? DEFAULT_FORMAT;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Receipt Settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure what appears on printed and digital receipts.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,32rem)_1fr]">
        <div className="grid gap-5">
          <TextField
            label="Business Name"
            id="rcpt-business-name"
            value={settings.business_name || ""}
            onChange={(e) => updateField("business_name", e.target.value)}
            hint="Pre-filled from business settings."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Business Phone"
              id="rcpt-phone"
              value={settings.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
            />
            <TextField
              label="Business Email"
              id="rcpt-email"
              value={settings.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <TextField
            label="Business Address"
            id="rcpt-address"
            type="textarea"
            value={settings.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
            rows={2}
          />

          <Separator />

          <TextField
            label="Footer Message"
            id="rcpt-footer"
            type="textarea"
            placeholder={DEFAULT_FOOTER}
            value={footer}
            onChange={(e) => updateField("receipt_footer", e.target.value)}
            rows={3}
            hint="This message appears at the bottom of every receipt."
          />

          <SearchSelect
            label="Receipt Format"
            id="rcpt-format"
            placeholder="Select format"
            clearable={false}
            value={format}
            onChange={(v) => updateField("receipt_format", v)}
            options={RECEIPT_FORMAT_OPTIONS}
          />
          <p className="-mt-3 text-xs text-muted-foreground">
            Choose how receipts are formatted when printed or sent.
          </p>

          <div className="pt-2">
            <Button
              onClick={() =>
                save(
                  { ...settings, receipt_footer: footer, receipt_format: format },
                  "Receipt settings saved",
                )
              }
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Receipt Settings
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-2 xl:self-start">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live Preview
          </p>
          <ReceiptPreview
            businessName={settings.business_name}
            phone={settings.phone}
            email={settings.email}
            address={settings.address}
            footer={footer}
            format={format}
          />
        </div>
      </div>
    </div>
  );
}
