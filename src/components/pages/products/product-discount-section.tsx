"use client";

import { useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/atoms/currency-input";
import { FieldLabel } from "@/components/atoms/field-label";
import { formatCurrency } from "@/lib/format";
import {
  discountStatus,
  effectivePrice,
  validateDiscount,
} from "@/lib/pricing";
import { CHANNELS, channelShort, channelStyle } from "@/lib/discount-channel";
import type { ProductItem } from "@/lib/products";
import { cn } from "@/lib/utils";

import { useSaveDiscount, useSaveProduct } from "./use-products";

const day = (d?: string | null) => (d ? d.slice(0, 10) : "");
const fmtDay = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "";

/**
 * "Change price" (permanent) and "Add discount" (temporary, dated) for one
 * product. The base selling price is never overwritten by a discount.
 */
export function ProductDiscountSection({
  product,
  onSaved,
}: {
  product: ProductItem;
  /** Called with the refreshed product after a successful save. */
  onSaved: (p: ProductItem) => void;
}) {
  const saveProduct = useSaveProduct();
  const saveDiscount = useSaveDiscount();

  const [price, setPrice] = useState<string>(String(product.sellingPrice));
  const [type, setType] = useState<"percent" | "fixed">(product.discountType ?? "percent");
  const [value, setValue] = useState<string>(product.discountValue ? String(product.discountValue) : "");
  const [start, setStart] = useState(day(product.discountStart));
  const [end, setEnd] = useState(day(product.discountEnd));
  const [channel, setChannel] = useState<"both" | "web" | "pos">(product.discountChannel ?? "both");

  const status = discountStatus(product);
  const hasDiscount = status !== "none";

  // Live preview of what the form below would produce, at the saved base price.
  const draft = {
    sellingPrice: product.sellingPrice,
    discountType: type,
    discountValue: Number(value) || 0,
    discountStart: start || null,
    discountEnd: end || null,
  };
  const draftError =
    value || start || end
      ? validateDiscount({ type, value: Number(value), start, end }, product.sellingPrice)
      : null;
  const previewActive = !draftError && Number(value) > 0 && start && end;
  const previewPrice = previewActive
    ? effectivePrice({ ...draft, discountStart: "1970-01-01", discountEnd: "2999-12-31" })
    : null;

  const priceChanged = Number(price) > 0 && Number(price) !== product.sellingPrice;

  const savePrice = async () => {
    try {
      const updated = await saveProduct.mutateAsync({ id: product.id, sellingPrice: Number(price) } as never);
      toast.success("Price updated");
      onSaved(updated as unknown as ProductItem);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update price");
    }
  };

  const submitDiscount = async () => {
    if (draftError || !previewActive) {
      toast.error(draftError ?? "Fill in the value and both dates");
      return;
    }
    try {
      const updated = await saveDiscount.mutateAsync({ id: product.id, type, value: Number(value), start, end, channel });
      toast.success("Discount saved");
      onSaved(updated as unknown as ProductItem);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save discount");
    }
  };

  const clearDiscount = async () => {
    try {
      const updated = await saveDiscount.mutateAsync({ id: product.id, clear: true });
      setValue("");
      setStart("");
      setEnd("");
      setChannel("both");
      toast.success("Discount removed");
      onSaved(updated as unknown as ProductItem);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove discount");
    }
  };

  const busy = saveProduct.isPending || saveDiscount.isPending;

  return (
    <div className="space-y-4">
      {/* Current price */}
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Price &amp; discount</h4>
        <div className="text-right tabular-nums">
          {status === "active" ? (
            <>
              <span className="mr-2 text-sm text-muted-foreground line-through">
                {formatCurrency(product.sellingPrice)}
              </span>
              <span className="text-lg font-semibold">{formatCurrency(effectivePrice(product))}</span>
            </>
          ) : (
            <span className="text-lg font-semibold">{formatCurrency(product.sellingPrice)}</span>
          )}
        </div>
      </div>

      {hasDiscount && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
            status === "active" && channelStyle(product.discountChannel).soft,
            status === "scheduled" && "border-amber-500/40 bg-amber-500/10",
            status === "expired" && "bg-muted text-muted-foreground",
          )}
        >
          <Tag className="size-3.5 shrink-0" />
          <span>
            {product.discountType === "percent"
              ? `${product.discountValue}% off`
              : `${formatCurrency(product.discountValue ?? 0)} off`}
            {channelShort(product.discountChannel) && ` · ${channelShort(product.discountChannel)}`}
            {" · "}
            {status === "active" && `ends ${fmtDay(product.discountEnd)}`}
            {status === "scheduled" && `starts ${fmtDay(product.discountStart)}`}
            {status === "expired" && `ended ${fmtDay(product.discountEnd)}`}
          </span>
        </div>
      )}

      {/* Change price (permanent) */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <CurrencyInput
            label="Change selling price"
            lockCurrency
            value={price}
            onValueChange={setPrice}
          />
        </div>
        <Button type="button" variant="outline" disabled={!priceChanged || busy} onClick={savePrice}>
          {saveProduct.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Update
        </Button>
      </div>

      {/* Discount (temporary) */}
      <div className="space-y-3 rounded-lg border p-3">
        <FieldLabel>{hasDiscount ? "Edit discount" : "Add discount"}</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex rounded-md border p-0.5 text-sm">
            {(["percent", "fixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded px-2 py-1 transition-colors",
                  type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {t === "percent" ? "% off" : "Amount off"}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={0}
            step="any"
            placeholder={type === "percent" ? "e.g. 15" : "e.g. 2.50"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Starts</FieldLabel>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Ends (inclusive)</FieldLabel>
            <Input type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Applies to</FieldLabel>
          <div className="flex rounded-md border p-0.5 text-sm">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannel(c.value)}
                className={cn(
                  "flex-1 rounded px-2 py-1 transition-colors",
                  channel === c.value ? c.selected : cn("hover:bg-accent", c.text),
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {draftError ? (
          <p className="text-xs text-destructive">{draftError}</p>
        ) : previewPrice !== null ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(product.sellingPrice)} → <span className="font-medium text-foreground">{formatCurrency(previewPrice)}</span>
            {type === "percent" ? ` (${value}% off)` : ""}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          {hasDiscount && (
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={busy} onClick={clearDiscount}>
              Remove
            </Button>
          )}
          <Button type="button" disabled={busy || !!draftError || !previewActive} onClick={submitDiscount}>
            {saveDiscount.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save discount
          </Button>
        </div>
      </div>
    </div>
  );
}
