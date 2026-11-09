"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/atoms/field-label";
import { ImageUpload } from "@/components/molecules/image-upload";
import { SearchSelect } from "@/components/molecules/search-select";
import { useCategories } from "@/hooks/api/use-categories";
import { productLabel } from "@/lib/products";
import { slugify, validateSlot, type LinkType, type PromoSlotItem } from "@/lib/website";
import { useAllProducts } from "../products/use-products";

import { ProductMultiPicker } from "./product-multi-picker";
import type { SlotCardConfig } from "./slot-card";
import { useSaveSlot } from "./use-website";

const LINK_TYPES: { value: LinkType | ""; label: string }[] = [
  { value: "", label: "No button" },
  { value: "product", label: "A product" },
  { value: "category", label: "A category" },
  { value: "sale", label: "The sale page" },
  { value: "url", label: "A web address" },
];

const day = (d?: string | null) => (d ? d.slice(0, 10) : "");

/** The form for one homepage block, shown in a popup when its card is selected. */
export function SlotDialog({
  config,
  slot,
  open,
  onOpenChange,
}: {
  config: SlotCardConfig;
  slot: PromoSlotItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { type, name, does, fields } = config;
  const save = useSaveSlot();
  const { data: allProducts = [] } = useAllProducts(open);
  const { data: categories = [] } = useCategories({ enabled: open });
  const onSite = allProducts.filter((p) => p.showOnWebsite && p.isActive);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [linkType, setLinkType] = useState<LinkType | "">("");
  const [linkTarget, setLinkTarget] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(slot?.title ?? config.defaultTitle ?? "");
    setSubtitle(slot?.subtitle ?? "");
    setImageUrl(slot?.imageUrl ?? "");
    setButtonLabel(slot?.buttonLabel ?? "");
    setLinkType(slot?.linkType ?? "");
    setLinkTarget(slot?.linkTarget ?? "");
    setProductIds(slot?.productIds ?? []);
    setStartAt(day(slot?.startAt));
    setEndAt(day(slot?.endAt));
  }, [open, slot, config.defaultTitle]);

  const has = (f: (typeof fields)[number]) => fields.includes(f);

  const submit = async () => {
    const body = {
      title,
      subtitle: has("subtitle") ? subtitle : null,
      imageUrl: has("image") ? imageUrl : null,
      buttonLabel: has("button") && linkType ? buttonLabel : null,
      linkType: has("button") && linkType ? linkType : null,
      linkTarget: has("button") && linkType && linkType !== "sale" ? linkTarget : null,
      productIds: has("oneProduct") || has("manyProducts") || has("twoProducts") ? productIds : [],
      startAt: startAt || null,
      endAt: endAt || null,
      isActive: slot?.isActive ?? true,
    };
    const error = validateSlot({ ...body, type });
    if (error) return toast.error(error);
    try {
      await save.mutateAsync({ type, ...body } as never);
      toast.success(`${name} saved`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  // Dropdowns render in a portal; don't treat clicks in them as "outside" the popup.
  const keepOpenForPortal = (e: Event) => {
    if ((e.target as HTMLElement | null)?.closest("[data-search-select-portal]")) e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        onPointerDownOutside={keepOpenForPortal}
        onInteractOutside={keepOpenForPortal}
      >
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{does}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{config.titleLabel}</FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={config.titlePlaceholder} />
          </div>

          {has("subtitle") && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Short line (optional)</FieldLabel>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
          )}

          {has("oneProduct") && (
            <ProductMultiPicker label="Product" products={onSite} value={productIds} onChange={setProductIds} max={1} />
          )}
          {has("manyProducts") && (
            <ProductMultiPicker label="Products" products={onSite} value={productIds} onChange={setProductIds} />
          )}

          {has("image") && (
            <ImageUpload label="Poster (optional)" value={imageUrl} onChange={(u) => setImageUrl(u ?? "")} />
          )}
          {has("twoProducts") && (
            <ProductMultiPicker label="Products shown with the poster (up to 2, optional)" products={onSite} value={productIds} onChange={setProductIds} max={2} />
          )}

          {has("button") && (
            <div className="space-y-3 rounded-lg border p-3">
              <SearchSelect
                label="Button goes to"
                clearable={false}
                value={linkType}
                onChange={(v) => {
                  setLinkType((v as LinkType | "") ?? "");
                  setLinkTarget("");
                }}
                options={LINK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
              {linkType && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Button label</FieldLabel>
                  <Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Shop now" />
                </div>
              )}
              {linkType === "product" && (
                <SearchSelect
                  label="Product"
                  value={linkTarget}
                  onChange={setLinkTarget}
                  options={onSite.map((p) => ({ value: p.slug ?? "", label: productLabel(p) })).filter((o) => o.value)}
                />
              )}
              {linkType === "category" && (
                <SearchSelect
                  label="Category"
                  value={linkTarget}
                  onChange={setLinkTarget}
                  options={categories.map((c) => ({ value: slugify(c.name), label: c.name }))}
                />
              )}
              {linkType === "url" && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Web address</FieldLabel>
                  <Input value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} placeholder="/shop?sort=newest or https://…" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Show from (optional)</FieldLabel>
              <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Until (optional)</FieldLabel>
              <Input type="date" min={startAt || undefined} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
