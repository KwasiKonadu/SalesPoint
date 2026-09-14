"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CURRENCIES, DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { BusinessInfoFormPanel } from "./business-info-form-panel";
import { SettingsFormSkeleton } from "./settings-skeletons";
import { useBusinessSettings } from "./use-business-settings";

/**
 * Business Info tab: a read-only summary of the saved details. "Edit" opens
 * {@link BusinessInfoFormPanel}, a side panel with the actual form fields.
 */
export function BusinessInfoTab() {
  const { settings, saving, save, loading } = useBusinessSettings(
    "business settings",
  );
  const [editOpen, setEditOpen] = useState(false);

  if (loading) return <SettingsFormSkeleton rows={6} />;

  const taxEnabled = settings.tax_enabled === "true";
  const currency =
    CURRENCIES.find((c) => c.code === settings.currency) ??
    CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY_CODE)!;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Business Information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your business details and tax configuration.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          icon={<Pencil className="size-4" />}
        >
          Edit
        </Button>
      </div>

      <div className="grid max-w-2xl gap-5">
        <Detail label="Business Name" value={settings.business_name} />
        <Detail label="Address" value={settings.address} multiline />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Phone" value={settings.phone} />
          <Detail label="Email" value={settings.email} />
        </div>

        <Detail label="Website" value={settings.website} />

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail
            label="Currency"
            value={`${currency.code} — ${currency.label} (${currency.symbol})`}
          />
          <Detail
            label="Tax Rate"
            value={settings.tax_rate ? `${settings.tax_rate}%` : undefined}
          />
        </div>

        <Detail label="Tax" value={taxEnabled ? "Enabled" : "Disabled"} />

        <Separator />

        <Detail label="Logo URL" value={settings.logo_url} />
      </div>

      <BusinessInfoFormPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        settings={settings}
        saving={saving}
        onSave={(payload) => save(payload, "Business settings saved")}
      />
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          multiline && "whitespace-pre-line",
          !value && "font-normal italic text-muted-foreground/70",
        )}
      >
        {value || "Not set"}
      </p>
    </div>
  );
}
