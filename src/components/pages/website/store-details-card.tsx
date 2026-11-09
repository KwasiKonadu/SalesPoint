"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/atoms/field-label";
import { EMPTY_STORE_DETAILS, resolveStoreDetails, validateStoreDetails, type StoreDetails } from "@/lib/website";

import { useSaveStoreDetails, useStoreDetails, type BusinessContacts } from "./use-website";

/** Footer and contact-page details: a preview of the footer block, edited in a popup. */
export function StoreDetailsCard() {
  const { data } = useStoreDetails();
  const [open, setOpen] = useState(false);
  const details = data?.details ?? EMPTY_STORE_DETAILS;
  const business = data?.business ?? { name: "", email: "", phone: "", address: "" };
  const shown = resolveStoreDetails(details, business);
  const rows = [shown.email, shown.phone, shown.address, shown.hours].filter(Boolean);

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
          <Store className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">Store details</h3>
          <span className="text-xs text-muted-foreground">Footer &amp; contact page</span>
        </header>
        <div className="space-y-2 p-4">
          {business.name && <p className="text-sm font-semibold">{business.name}</p>}
          {shown.about ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">{shown.about}</p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Plus className="size-3.5" /> Add a short description
            </p>
          )}
          {rows.length > 0 && (
            <ul className="space-y-0.5 border-t pt-2 text-xs">
              {rows.map((r) => (
                <li key={r} className="truncate">{r}</li>
              ))}
            </ul>
          )}
          {shown.socials.length > 0 && <p className="text-xs text-muted-foreground">{shown.socials.map((s) => s.label).join(" · ")}</p>}
        </div>
      </div>
      <StoreDetailsDialog details={details} business={business} open={open} onOpenChange={setOpen} />
    </>
  );
}

function StoreDetailsDialog({
  details,
  business,
  open,
  onOpenChange,
}: {
  details: StoreDetails;
  business: BusinessContacts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveStoreDetails();
  const [draft, setDraft] = useState<StoreDetails>(details);

  useEffect(() => {
    if (open) setDraft(structuredClone(details));
  }, [open, details]);

  const set = (patch: Partial<StoreDetails>) => setDraft({ ...draft, ...patch });

  const submit = async () => {
    const error = validateStoreDetails(draft);
    if (error) return toast.error(error);
    try {
      await save.mutateAsync(draft);
      toast.success("Store details saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const follow = (v: string) => (v ? `Follows Business info: ${v}` : "Not set in Business info");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Store details</DialogTitle>
          <DialogDescription>
            Shown in the website footer and on the contact page. Email, phone and address follow Business info; fill them in here only
            if the website should show something different.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Short description</FieldLabel>
            <Textarea rows={3} maxLength={400} value={draft.about} onChange={(e) => set({ about: e.target.value })} placeholder="What you sell and what makes you different" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Tagline</FieldLabel>
            <Input value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Fresh groceries, delivered" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Opening hours</FieldLabel>
            <Input value={draft.hours} onChange={(e) => set({ hours: e.target.value })} placeholder="Mon–Sat · 8:00–18:00" />
          </div>

          {(
            [
              ["email", "Email", "Email", business.email],
              ["phone", "Phone", "Phone", business.phone],
              ["address", "Address", "Address", business.address],
            ] as const
          ).map(([key, label, , fallback]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <FieldLabel>{label}</FieldLabel>
              <Input value={draft[key]} onChange={(e) => set({ [key]: e.target.value })} placeholder={fallback || `Website ${label.toLowerCase()}`} />
              <p className="text-xs text-muted-foreground">{draft[key] ? "Website override. Clear it to follow Business info." : follow(fallback)}</p>
            </div>
          ))}

          <div className="space-y-2">
            <FieldLabel>Social links</FieldLabel>
            {draft.socials.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-32 shrink-0"
                  value={s.label}
                  onChange={(e) => set({ socials: draft.socials.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)) })}
                  placeholder="Instagram"
                />
                <Input
                  value={s.url}
                  onChange={(e) => set({ socials: draft.socials.map((x, n) => (n === i ? { ...x, url: e.target.value } : x)) })}
                  placeholder="https://instagram.com/yourshop"
                />
                <Button type="button" variant="outline" size="sm" aria-label="Remove link" className="text-destructive hover:text-destructive" onClick={() => set({ socials: draft.socials.filter((_, n) => n !== i) })}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" icon={<Plus className="size-3.5" />} onClick={() => set({ socials: [...draft.socials, { label: "", url: "" }] })}>
              Add link
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={save.isPending} onClick={submit}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
