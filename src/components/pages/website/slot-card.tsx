"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { StatusChip, type StatusVariant } from "@/components/atoms/status-chip";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { effectivePrice, isDiscountLive } from "@/lib/pricing";
import { productLabel, type ProductItem } from "@/lib/products";
import { windowStatus, type PromoSlotItem, type SlotType, type WindowStatus } from "@/lib/website";
import { cn } from "@/lib/utils";
import { ProductImage } from "../products/product-image";
import { useAllProducts } from "../products/use-products";

import { SlotDialog } from "./slot-dialog";
import { useSaveSlot } from "./use-website";

export type Field = "subtitle" | "image" | "twoProducts" | "button" | "oneProduct" | "manyProducts";

export interface SlotCardConfig {
  type: SlotType;
  icon: React.ElementType;
  name: string;
  /** What this block does on the website, in one line. */
  does: string;
  titleLabel: string;
  titlePlaceholder: string;
  defaultTitle?: string;
  fields: Field[];
}

const CHIP: Record<WindowStatus | "unset", { label: string; variant: StatusVariant }> = {
  live: { label: "Live", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  ended: { label: "Ended", variant: "neutral" },
  off: { label: "Off", variant: "neutral" },
  unset: { label: "Not set up", variant: "neutral" },
};

const day = (d?: string | null) => (d ? d.slice(0, 10) : "");

/** A homepage block shown as a small preview of itself. Select it to edit in a popup. */
export function SlotCard({ config, slot, position }: { config: SlotCardConfig; slot: PromoSlotItem | null; position: number }) {
  const { icon: Icon, name } = config;
  const [open, setOpen] = useState(false);
  const save = useSaveSlot();
  const { data: products = [] } = useAllProducts(true);

  const isActive = slot?.isActive ?? false;
  const status: WindowStatus | "unset" = slot ? windowStatus(slot) : "unset";
  const chip = CHIP[status];

  const onToggle = async (checked: boolean) => {
    try {
      await save.mutateAsync({ type: config.type, isActive: checked });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <header className="flex items-center gap-2.5 px-4 pt-4">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {position}
          </span>
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</h3>
          <StatusChip label={chip.label} variant={chip.variant} />
          {slot && (
            // The switch must not open the popup.
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Switch checked={isActive} disabled={save.isPending} onCheckedChange={onToggle} aria-label={`${name} on or off`} />
            </span>
          )}
        </header>

        <div className={cn("p-4", slot && !isActive && "opacity-50")}>
          {slot ? <Preview type={config.type} slot={slot} products={products} /> : <NotSetUp does={config.does} />}
        </div>

        {slot && (slot.startAt || slot.endAt) && (
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            Shows {day(slot.startAt) || "now"} → {day(slot.endAt) || "no end date"}
          </p>
        )}
      </div>

      <SlotDialog config={config} slot={slot} open={open} onOpenChange={setOpen} />
    </>
  );
}

function NotSetUp({ does }: { does: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
        <Plus className="size-4 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">Set this up</p>
      <p className="max-w-[26ch] text-xs text-muted-foreground">{does}</p>
    </div>
  );
}

function Thumbs({ items }: { items: ProductItem[] }) {
  const shown = items.slice(0, 5);
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((p) => (
        <ProductImage key={p.id} name={p.name} image={p.image} size="md" />
      ))}
      {items.length > shown.length && <span className="text-xs text-muted-foreground">+{items.length - shown.length}</span>}
    </div>
  );
}

/** A miniature of what this block looks like on the website. */
function Preview({ type, slot, products }: { type: SlotType; slot: PromoSlotItem; products: ProductItem[] }) {
  const picked = slot.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is ProductItem => !!p);

  if (type === "announcement") {
    return <div className="rounded-md bg-foreground px-3 py-2 text-center text-xs text-background">{slot.title}</div>;
  }

  if (type === "hero") {
    return (
      <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="line-clamp-2 text-base font-semibold leading-tight">{slot.title}</p>
          {slot.subtitle && <p className="line-clamp-2 text-xs text-muted-foreground">{slot.subtitle}</p>}
          {slot.linkType && slot.buttonLabel && (
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{slot.buttonLabel}</span>
          )}
        </div>
        {(slot.imageUrl || picked.length > 0) && (
          <div className="flex shrink-0 items-end gap-1">
            {slot.imageUrl && <img src={slot.imageUrl} alt="" className="h-24 w-20 rounded-md object-cover" />}
            {picked.length > 0 && <Thumbs items={picked} />}
          </div>
        )}
      </div>
    );
  }

  if (type === "product_of_week") {
    const p = picked[0];
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{slot.title}</p>
        {p ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <ProductImage name={p.name} image={p.image} size="lg" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold">{productLabel(p)}</p>
              <p className="text-sm tabular-nums">
                {isDiscountLive(p, "web") && (
                  <span className="mr-1.5 text-xs text-muted-foreground line-through">{formatCurrency(p.sellingPrice)}</span>
                )}
                {formatCurrency(effectivePrice(p, new Date(), "web"))}
              </p>
              {slot.subtitle && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{slot.subtitle}</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">The chosen product is no longer on the website.</p>
        )}
      </div>
    );
  }

  if (type === "collection") {
    return (
      <div className="space-y-2.5">
        <div>
          {slot.subtitle && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{slot.subtitle}</p>}
          <p className="text-sm font-semibold">{slot.title}</p>
        </div>
        {picked.length ? <Thumbs items={picked} /> : <p className="text-xs text-muted-foreground">No products on the website yet.</p>}
        <p className="text-xs text-muted-foreground">
          {picked.length} product{picked.length === 1 ? "" : "s"}
        </p>
      </div>
    );
  }

  return null;
}
