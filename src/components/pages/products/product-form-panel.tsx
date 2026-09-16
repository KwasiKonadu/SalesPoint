"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useBusinessInfo } from "@/lib/business-info";
import {
  productFormDefaults,
  type Category,
  type ProductFormValues,
  type ProductItem,
  type ProductType,
  type Unit,
} from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { FieldLabel } from "@/components/atoms/field-label";
import { FormPanel } from "@/components/molecules/form-panel";
import { RegisteredField } from "@/components/molecules/registered-field";
import { SearchSelect } from "@/components/molecules/search-select";
import { useAllProducts, useSaveProduct } from "./use-products";

/** Slide-over form for creating or editing a product. Posts to `/api/products`. */
export function ProductFormPanel({
  open,
  onOpenChange,
  product,
  productTypes,
  categories,
  units,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem | null;
  productTypes: ProductType[];
  categories: Category[];
  units: Unit[];
}) {
  const { defaultLowStockPercent } = useBusinessInfo();
  const isEditing = !!product;
  const saveProduct = useSaveProduct();
  // The numeric part of "size" — composed with the selected unit into `size`
  // (e.g. "500" + "ml" -> "500ml").
  const [sizeAmount, setSizeAmount] = useState("");

  // Every product already in the system — powers the name dropdown and lets a
  // new "variant" inherit its group's classification.
  const { data: allProducts = [] } = useAllProducts(open);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: productFormDefaults(product, defaultLowStockPercent),
  });

  const values = useWatch({ control });

  const taxEnabled = values.taxEnabled ?? false;
  const isActive = values.isActive ?? true;
  const productTypeId = values.productTypeId;
  const currentName = (values.name ?? "").trim();
  const tracksStock = isEditing
    ? (productTypes.find((t) => t.id === product?.productTypeId)?.tracksStock ??
      true)
    : (productTypes.find((t) => t.id === productTypeId)?.tracksStock ?? true);

  // Distinct existing names → the dropdown's options, with a sibling count.
  const nameOptions = useMemo(() => {
    const groups = new Map<string, number>();
    for (const p of allProducts) {
      if (isEditing && p.id === product?.id) continue;
      groups.set(p.name, (groups.get(p.name) ?? 0) + 1);
    }
    const opts = [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        sublabel:
          count > 0
            ? `${count} existing ${count === 1 ? "variant" : "variants"}`
            : undefined,
      }));
    // Keep a free-typed name visible in the control.
    if (currentName && !groups.has(currentName)) {
      opts.unshift({ value: currentName, label: currentName, sublabel: "new" });
    }
    return opts;
  }, [allProducts, currentName, isEditing, product?.id]);

  const siblingCount = useMemo(
    () =>
      currentName
        ? allProducts.filter(
            (p) => p.name === currentName && p.id !== product?.id,
          ).length
        : 0,
    [allProducts, currentName, product?.id],
  );

  const currentContainer = (values.container ?? "").trim();
  const containerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) if (p.container) set.add(p.container);
    const opts = [...set].sort().map((c) => ({ value: c, label: c }));
    // Keep a just-typed container visible in the control.
    if (currentContainer && !set.has(currentContainer)) {
      opts.unshift({ value: currentContainer, label: currentContainer });
    }
    return opts;
  }, [allProducts, currentContainer]);

  const unitShortOf = (id: string | null | undefined) => {
    const u = units.find((x) => x.id === id);
    return u?.shortName || u?.name || "";
  };

  useEffect(() => {
    if (!open) return;
    reset(productFormDefaults(product, defaultLowStockPercent));
    // Split the stored "size" back into its numeric part for the amount input.
    const short = unitShortOf(product?.unitId);
    const raw = product?.size ?? "";
    setSizeAmount(short && raw.endsWith(short) ? raw.slice(0, -short.length).trim() : raw);
  }, [open, product, reset, defaultLowStockPercent]);

  // Keep `size` = amount + unit short (e.g. "500" + "ml" -> "500ml").
  const currentUnitShort = unitShortOf(values.unitId);
  useEffect(() => {
    const a = sizeAmount.trim();
    setValue("size", a ? (currentUnitShort ? `${a}${currentUnitShort}` : a) : "");
  }, [sizeAmount, currentUnitShort]);

  /** Set the name and, when creating a new variant of an existing group,
   *  inherit that group's category / type / unit / tax. */
  const pickName = (name: string) => {
    setValue("name", name, { shouldValidate: true });
    if (isEditing) return;
    const sibling = allProducts.find((p) => p.name === name);
    if (!sibling) return;
    setValue("categoryId", sibling.categoryId ?? null);
    setValue("productTypeId", sibling.productTypeId ?? null);
    setValue("unitId", sibling.unitId ?? null);
    setValue("taxEnabled", !!sibling.taxEnabled);
    setValue("taxRate", sibling.taxRate ?? 0);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        sku: data.sku || undefined,
        container: data.container?.trim() || null,
        size: data.size?.trim() || null,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        productTypeId: data.productTypeId || undefined,
        unitId: data.unitId || undefined,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        wholesalePrice: data.wholesalePrice ? Number(data.wholesalePrice) : null,
        packSize: data.packSize ? Number(data.packSize) : null,
        taxEnabled: data.taxEnabled,
        taxRate: data.taxEnabled ? Number(data.taxRate) : 0,
        lowStockPercent: Number(data.lowStockPercent),
        image: data.imageUrl || undefined,
      };
      if (!isEditing && tracksStock) {
        body.initialStock = Number(data.initialStock) || 0;
      }
      if (isEditing) body.isActive = data.isActive;

      await saveProduct.mutateAsync({ id: product?.id, ...body } as never);

      toast.success(isEditing ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Product" : "Add New Product"}
      description={
        isEditing
          ? "Update the product details below."
          : "Fill in the details to create a new product."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveProduct.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saveProduct.isPending}>
            {saveProduct.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update Product" : "Create Product"}
          </Button>
        </>
      }
    >
      <form
        id="product-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3"
      >
        {/* Basic Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Basic Information
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <SearchSelect
                label="Product Name"
                placeholder="Pick an existing name or type a new one"
                value={currentName}
                onChange={(v) => v && pickName(v)}
                onQueryChange={(q) => setValue("name", q, { shouldValidate: true })}
                options={nameOptions}
                emptyState={({ query, close }) => (
                  <button
                    type="button"
                    onClick={() => {
                      pickName(query.trim());
                      close();
                    }}
                    className="w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    Create <span className="font-medium">“{query.trim()}”</span>
                  </button>
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
              {!isEditing && siblingCount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Joins <span className="font-medium">{currentName}</span> —{" "}
                  {siblingCount} existing variant
                  {siblingCount === 1 ? "" : "s"}. Classification was pre-filled
                  from the group.
                </p>
              )}
            </div>
            <RegisteredField
              label="SKU"
              placeholder="Leave empty to auto-generate"
              registration={register("sku")}
            />
          </div>
          <RegisteredField
            label="Description"
            type="textarea"
            rows={2}
            placeholder="Optional product description..."
            registration={register("description")}
          />
        </div>

        <Separator />

        {/* Classification */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Classification
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchSelect
              label="Product Type"
              placeholder="Select type"
              value={values.productTypeId ?? ""}
              onChange={(v) => setValue("productTypeId", v || null)}
              options={productTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SearchSelect
              label="Category"
              placeholder="Select category"
              value={values.categoryId ?? ""}
              onChange={(v) => setValue("categoryId", v || null)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <SearchSelect
              label="Container"
              placeholder="Select Container"
              value={values.container ?? ""}
              onChange={(v) => setValue("container", v)}
              onQueryChange={(q) => setValue("container", q)}
              options={containerOptions}
              emptyState={({ query, close }) => (
                <button
                  type="button"
                  onClick={() => {
                    setValue("container", query.trim());
                    close();
                  }}
                  className="w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  Use <span className="font-medium">“{query.trim()}”</span>
                </button>
              )}
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Size</FieldLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="500"
                  value={sizeAmount}
                  onChange={(e) => setSizeAmount(e.target.value)}
                />
                <div className="w-30 shrink-0">
                  <SearchSelect
                    placeholder="Unit"
                    value={values.unitId ?? ""}
                    onChange={(v) => setValue("unitId", v || null)}
                    options={units.map((u) => ({
                      value: u.id,
                      label: u.shortName || u.name,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CurrencyInput
              label="Cost Price"
              lockCurrency
              value={values.costPrice ?? ""}
              onValueChange={(v) =>
                setValue("costPrice", v as unknown as number, {
                  shouldValidate: true,
                })
              }
              error={errors.costPrice?.message}
            />
            <CurrencyInput
              label="Selling Price"
              lockCurrency
              value={values.sellingPrice ?? ""}
              onValueChange={(v) =>
                setValue("sellingPrice", v as unknown as number, {
                  shouldValidate: true,
                })
              }
              error={errors.sellingPrice?.message}
            />
            <CurrencyInput
              label="Wholesale Price"
              lockCurrency
              value={values.wholesalePrice ?? ""}
              onValueChange={(v) =>
                setValue("wholesalePrice", v as unknown as number)
              }
            />
            <RegisteredField
              label="Pack Size"
              type="number"
              placeholder="e.g. 12"
              registration={register("packSize")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A full pack (this many units) is charged at the wholesale price; any
            leftover units stay at the selling price.
          </p>
        </div>

        <Separator />

        {/* Inventory & Tax */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Inventory &amp; Tax
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!isEditing && tracksStock && (
              <RegisteredField
                label="Initial Stock"
                type="number"
                placeholder="0"
                registration={register("initialStock")}
              />
            )}
            <RegisteredField
              label="Low Stock Alert (%)"
              type="number"
              registration={register("lowStockPercent")}
            />
            <label className="flex items-center gap-3 text-sm font-medium">
              <Switch
                checked={taxEnabled}
                onCheckedChange={(c) => setValue("taxEnabled", c)}
              />
              Tax Enabled
            </label>
            {taxEnabled && (
              <RegisteredField
                label="Tax Rate (%)"
                type="number"
                registration={register("taxRate")}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Image & Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Image &amp; Status
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RegisteredField
              label="Image URL"
              placeholder="https://example.com/image.jpg"
              registration={register("imageUrl")}
            />
            {isEditing && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Status</FieldLabel>
                <label className="flex items-center gap-3 text-sm font-medium">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(c) => setValue("isActive", c)}
                  />
                  Active
                </label>
              </div>
            )}
          </div>
        </div>
      </form>
    </FormPanel>
  );
}
