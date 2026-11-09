"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/atoms/field-label";
import { slugify, validatePromises, type Promises } from "@/lib/website";

import { FeeCalculator } from "./fee-calculator";
import { useSavePromises } from "./use-website";

export type PromiseKey = "freeDelivery" | "delivery" | "returns" | "pickup";

const COPY: Record<PromiseKey, { title: string; description: string }> = {
  freeDelivery: {
    title: "Free delivery",
    description: "Orders at or above this amount get the delivery fee waived. Switch the card off to stop promising it.",
  },
  delivery: {
    title: "Delivery areas & fees",
    description: "Where you deliver and what each area costs. Tick “No delivery” for areas you don’t cover.",
  },
  returns: {
    title: "Returns",
    description: "How many days after delivery a customer can ask to return an order.",
  },
  pickup: {
    title: "Pickup",
    description: "Customers buy online and collect from your shop. It is on by default and uses the address in Business info. Fill these in only to show something different.",
  },
};

/** Popup editor for one promise. Edits a copy and saves the whole promises object. */
export function PromiseDialog({
  promiseKey,
  promises,
  open,
  onOpenChange,
}: {
  promiseKey: PromiseKey;
  promises: Promises;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSavePromises();
  const [draft, setDraft] = useState<Promises>(promises);

  useEffect(() => {
    if (open) setDraft(structuredClone(promises));
  }, [open, promises]);

  const submit = async () => {
    // Give new areas a stable id from their name before saving.
    const withIds: Promises = {
      ...draft,
      delivery: {
        areas: draft.delivery.areas.map((a, i) => ({ ...a, id: a.id || `${slugify(a.name)}-${i}` })),
      },
    };
    const error = validatePromises(withIds);
    if (error) return toast.error(error);
    try {
      await save.mutateAsync(withIds);
      toast.success(`${COPY[promiseKey].title} saved`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const keepOpenForPortal = (e: Event) => {
    if ((e.target as HTMLElement | null)?.closest("[data-search-select-portal]")) e.preventDefault();
  };

  const setArea = (i: number, patch: Partial<Promises["delivery"]["areas"][number]>) =>
    setDraft({ ...draft, delivery: { areas: draft.delivery.areas.map((a, n) => (n === i ? { ...a, ...patch } : a)) } });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={keepOpenForPortal}
        onInteractOutside={keepOpenForPortal}
      >
        <DialogHeader>
          <DialogTitle>{COPY[promiseKey].title}</DialogTitle>
          <DialogDescription>{COPY[promiseKey].description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {promiseKey === "freeDelivery" && (
            <>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Free delivery on orders of</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={draft.freeDelivery.threshold || ""}
                  onChange={(e) => setDraft({ ...draft, freeDelivery: { enabled: true, threshold: Number(e.target.value) } })}
                  placeholder="e.g. 120"
                />
              </div>
              <FeeCalculator promises={{ ...draft, freeDelivery: { ...draft.freeDelivery, enabled: draft.freeDelivery.threshold > 0 } }} />
            </>
          )}

          {promiseKey === "delivery" && (
            <>
              <div className="space-y-2">
                {draft.delivery.areas.length === 0 && <p className="text-sm text-muted-foreground">No areas yet. Add the first one below.</p>}
                {draft.delivery.areas.map((a, i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Input value={a.name} onChange={(e) => setArea(i, { name: e.target.value })} placeholder="Area name, e.g. Accra Central" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Remove area"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDraft({ ...draft, delivery: { areas: draft.delivery.areas.filter((_, n) => n !== i) } })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        disabled={a.fee === null}
                        value={a.fee === null ? "" : a.fee}
                        onChange={(e) => setArea(i, { fee: e.target.value === "" ? 0 : Number(e.target.value) })}
                        placeholder="Fee"
                      />
                      <Input value={a.eta} disabled={a.fee === null} onChange={(e) => setArea(i, { eta: e.target.value })} placeholder="Arrives in, e.g. 1–2 days" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox checked={a.fee === null} onCheckedChange={(c) => setArea(i, { fee: c ? null : 0, eta: c ? "" : a.eta })} />
                      No delivery to this area
                    </label>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus className="size-3.5" />}
                  onClick={() => setDraft({ ...draft, delivery: { areas: [...draft.delivery.areas, { id: "", name: "", fee: 0, eta: "" }] } })}
                >
                  Add area
                </Button>
              </div>
              <FeeCalculator promises={{ ...draft, delivery: { areas: draft.delivery.areas.map((a, i) => ({ ...a, id: a.id || `${slugify(a.name)}-${i}` })) } }} />
            </>
          )}

          {promiseKey === "returns" && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Days to request a return</FieldLabel>
              <Input
                type="number"
                min={1}
                max={365}
                value={draft.returns.days || ""}
                onChange={(e) => setDraft({ ...draft, returns: { enabled: true, days: Math.round(Number(e.target.value)) } })}
              />
            </div>
          )}

          {promiseKey === "pickup" && (
            <>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Pickup address</FieldLabel>
                <Input value={draft.pickup.address} onChange={(e) => setDraft({ ...draft, pickup: { ...draft.pickup, enabled: true, address: e.target.value } })} placeholder="Leave blank to use the address in Business info" />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Opening hours</FieldLabel>
                <Input value={draft.pickup.hours} onChange={(e) => setDraft({ ...draft, pickup: { ...draft.pickup, hours: e.target.value } })} placeholder="Mon–Sat · 8:00–18:00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Note (optional)</FieldLabel>
                <Input value={draft.pickup.note} onChange={(e) => setDraft({ ...draft, pickup: { ...draft.pickup, note: e.target.value } })} placeholder="Bring your order reference" />
              </div>
            </>
          )}
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
