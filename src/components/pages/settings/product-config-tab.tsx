"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/organisms/data-table";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { TextField } from "@/components/atoms/text-field";
import type { ProductType, Unit } from "@/lib/settings";
import { useDeleteProductType } from "@/hooks/api/use-product-types";
import { useDeleteUnit } from "@/hooks/api/use-units";

import { productTypeColumns, unitColumns } from "./config-tables";
import { ConfigTableSkeleton } from "./settings-skeletons";
import { ProductTypeFormPanel } from "./product-type-form-panel";
import { UnitFormPanel } from "./unit-form-panel";
import { useBusinessSettings } from "./use-business-settings";
import { useProductConfig } from "./use-product-config";

const DEFAULT_LOW_STOCK_PERCENT = "20";

/** Product Config tab: product types, units of measurement, default min stock. */
export function ProductConfigTab() {
  const { productTypes, units, loading } = useProductConfig();
  const deleteProductType = useDeleteProductType();
  const deleteUnit = useDeleteUnit();
  const {
    settings,
    updateField,
    loading: settingsLoading,
    saving,
    save,
  } = useBusinessSettings("product configuration");

  const minStockPercent =
    settings.default_low_stock_percent ?? DEFAULT_LOW_STOCK_PERCENT;

  const [ptFormOpen, setPtFormOpen] = useState(false);
  const [ptEditing, setPtEditing] = useState<ProductType | null>(null);
  const [ptDeleteTarget, setPtDeleteTarget] = useState<ProductType | null>(
    null,
  );

  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [unitEditing, setUnitEditing] = useState<Unit | null>(null);
  const [unitDeleteTarget, setUnitDeleteTarget] = useState<Unit | null>(null);

  if (loading || settingsLoading) return <ConfigTableSkeleton />;

  return (
    <div className="space-y-8">
      {/* Product Types */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Product Types</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Define the types of products you sell.
            </p>
          </div>
          <Button
            onClick={() => {
              setPtEditing(null);
              setPtFormOpen(true);
            }}
            size="sm"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Type
          </Button>
        </div>

        <DataTable<ProductType>
          columns={productTypeColumns}
          data={productTypes}
          getRowKey={(pt) => pt.id}
          emptyMessage="No product types yet"
          emptyDescription="Add a product type to get started."
          rowActions={(pt) => [
            {
              label: "Edit",
              icon: Pencil,
              onClick: () => {
                setPtEditing(pt);
                setPtFormOpen(true);
              },
            },
            {
              label: "Delete",
              icon: Trash2,
              danger: true,
              onClick: () => setPtDeleteTarget(pt),
            },
          ]}
        />
      </div>

      <Separator />

      {/* Units */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Units of Measurement</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Define units for measuring products.
            </p>
          </div>
          <Button
            onClick={() => {
              setUnitEditing(null);
              setUnitFormOpen(true);
            }}
            size="sm"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Unit
          </Button>
        </div>

        <DataTable<Unit>
          columns={unitColumns}
          data={units}
          getRowKey={(u) => u.id}
          emptyMessage="No units yet"
          emptyDescription="Add a unit of measurement to get started."
          rowActions={(u) => [
            {
              label: "Edit",
              icon: Pencil,
              onClick: () => {
                setUnitEditing(u);
                setUnitFormOpen(true);
              },
            },
            {
              label: "Delete",
              icon: Trash2,
              danger: true,
              onClick: () => setUnitDeleteTarget(u),
            },
          ]}
        />
      </div>

      <Separator />

      {/* Default Minimum Stock Level */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Default Minimum Stock Level</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Default low-stock alert threshold, as a percentage of stock.
          </p>
        </div>
        <div className="flex max-w-md items-end gap-3">
          <div className="flex-1">
            <TextField
              label="Minimum Stock Level (%)"
              id="min-stock"
              type="number"
              min="0"
              max="100"
              step="1"
              value={minStockPercent}
              onChange={(e) =>
                updateField("default_low_stock_percent", e.target.value)
              }
              hint="Pre-fills the Low Stock Alert on new products."
            />
          </div>
          <Button
            onClick={() =>
              save(
                { ...settings, default_low_stock_percent: minStockPercent },
                "Default minimum stock saved",
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
            Save
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ProductTypeFormPanel
        open={ptFormOpen}
        onOpenChange={setPtFormOpen}
        productType={ptEditing}
        onSaved={() => {}}
      />
      <ConfirmDialog
        open={!!ptDeleteTarget}
        onOpenChange={(o) => !o && setPtDeleteTarget(null)}
        title={`Delete "${ptDeleteTarget?.name ?? ""}"?`}
        description="This will deactivate the product type. Existing products using this type will not be affected."
        confirmLabel="Delete"
        loading={deleteProductType.isPending}
        onConfirm={async () => {
          if (!ptDeleteTarget) return;
          try {
            await deleteProductType.mutateAsync(ptDeleteTarget.id);
            toast.success("Product type deleted");
            setPtDeleteTarget(null);
          } catch {
            toast.error("Failed to delete product type");
          }
        }}
      />

      <UnitFormPanel
        open={unitFormOpen}
        onOpenChange={setUnitFormOpen}
        unit={unitEditing}
        onSaved={() => {}}
      />
      <ConfirmDialog
        open={!!unitDeleteTarget}
        onOpenChange={(o) => !o && setUnitDeleteTarget(null)}
        title={`Delete "${unitDeleteTarget?.name ?? ""}"?`}
        description="This will deactivate the unit. Existing products using this unit will not be affected."
        confirmLabel="Delete"
        loading={deleteUnit.isPending}
        onConfirm={async () => {
          if (!unitDeleteTarget) return;
          try {
            await deleteUnit.mutateAsync(unitDeleteTarget.id);
            toast.success("Unit deleted");
            setUnitDeleteTarget(null);
          } catch {
            toast.error("Failed to delete unit");
          }
        }}
      />
    </div>
  );
}
