"use client";

import { useState } from "react";
import { MapPin, Plus, RotateCcw, Store, Truck } from "lucide-react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { StatusChip } from "@/components/atoms/status-chip";
import { formatCurrency } from "@/lib/format";
import { normalizePromises, type Promises } from "@/lib/website";
import { cn } from "@/lib/utils";

import { PromiseDialog, type PromiseKey } from "./promise-dialog";
import { usePromises, useSavePromises } from "./use-website";

interface CardDef {
  key: PromiseKey;
  icon: React.ElementType;
  name: string;
  does: string;
  /** Does this promise have an on/off switch? (Delivery areas are always "on" — they just list where you deliver.) */
  switchable: boolean;
  isOn: (p: Promises) => boolean;
  /** Set up enough to switch on? */
  ready: (p: Promises) => boolean;
  setOn: (p: Promises, on: boolean) => Promises;
}

const CARDS: CardDef[] = [
  {
    key: "freeDelivery",
    icon: Truck,
    name: "Free delivery",
    does: "“Free delivery over …” on the banner, product pages, cart and checkout. Also waives the fee at checkout.",
    switchable: true,
    isOn: (p) => p.freeDelivery.enabled,
    ready: (p) => p.freeDelivery.threshold > 0,
    setOn: (p, on) => ({ ...p, freeDelivery: { ...p.freeDelivery, enabled: on } }),
  },
  {
    key: "delivery",
    icon: MapPin,
    name: "Delivery areas & fees",
    does: "The areas customers can pick at checkout and what each costs.",
    switchable: false,
    isOn: (p) => p.delivery.areas.length > 0,
    ready: (p) => p.delivery.areas.length > 0,
    setOn: (p) => p,
  },
  {
    key: "returns",
    icon: RotateCcw,
    name: "Returns",
    does: "“Easy N-day returns” on the banner and product pages, and the returns policy page.",
    switchable: true,
    isOn: (p) => p.returns.enabled,
    ready: (p) => p.returns.days > 0,
    setOn: (p, on) => ({ ...p, returns: { ...p.returns, enabled: on } }),
  },
  {
    key: "pickup",
    icon: Store,
    name: "Pickup",
    does: "Customers can collect an order from your shop instead of delivery. On by default, using the address in Business info.",
    switchable: true,
    isOn: (p) => p.pickup.enabled,
    ready: () => true,
    setOn: (p, on) => ({ ...p, pickup: { ...p.pickup, enabled: on } }),
  },
];

export function PromisesTab() {
  const { data, isPending } = usePromises();
  const promises = data?.promises ?? normalizePromises(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        What the website promises customers. Only promises that are switched on appear on the website, and the delivery
        fee at checkout follows the same rules. Select a card to set it up.
      </p>
      {isPending ? (
        <div className="columns-1 gap-4 lg:columns-2">
          {[120, 170, 110, 140].map((h, i) => (
            <Skeleton key={i} className="mb-4 w-full break-inside-avoid rounded-xl" style={{ height: h }} />
          ))}
        </div>
      ) : (
        <div className="columns-1 gap-4 lg:columns-2">
          {CARDS.map((c) => (
            <div key={c.key} className="mb-4 break-inside-avoid">
              <PromiseCard def={c} promises={promises} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromiseCard({ def, promises }: { def: CardDef; promises: Promises }) {
  const { icon: Icon, name } = def;
  const [open, setOpen] = useState(false);
  const save = useSavePromises();
  const on = def.isOn(promises);
  const ready = def.ready(promises);

  const toggle = async (checked: boolean) => {
    if (checked && !ready) {
      setOpen(true); // needs details first
      return;
    }
    try {
      await save.mutateAsync(def.setOn(promises, checked));
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
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</h3>
          <StatusChip label={on ? "On" : ready ? "Off" : "Not set up"} variant={on ? "success" : "neutral"} />
          {def.switchable && (
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Switch checked={on} disabled={save.isPending} onCheckedChange={toggle} aria-label={`${name} on or off`} />
            </span>
          )}
        </header>
        <div className={cn("p-4", def.switchable && !on && ready && "opacity-50")}>
          <Preview def={def} promises={promises} ready={ready} />
        </div>
      </div>
      <PromiseDialog promiseKey={def.key} promises={promises} open={open} onOpenChange={setOpen} />
    </>
  );
}

function SetUp({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
        <Plus className="size-4 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">Set this up</p>
      <p className="max-w-[28ch] text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

/** How this promise reads on the website. */
function Preview({ def, promises: p, ready }: { def: CardDef; promises: Promises; ready: boolean }) {
  if (!ready) return <SetUp text={def.does} />;

  if (def.key === "freeDelivery") {
    return (
      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <span className="font-medium">Free delivery over {formatCurrency(p.freeDelivery.threshold)}</span>
        <p className="mt-1 text-xs text-muted-foreground">Delivery fee is waived once the order reaches this amount.</p>
      </div>
    );
  }
  if (def.key === "returns") {
    return (
      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <span className="font-medium">Easy {p.returns.days}-day returns</span>
        <p className="mt-1 text-xs text-muted-foreground">Customers can request a return within {p.returns.days} days.</p>
      </div>
    );
  }
  if (def.key === "pickup") {
    return (
      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <p className="font-medium">{p.pickup.address || "Your shop — address from Business info"}</p>
        {p.pickup.hours && <p className="text-xs text-muted-foreground">{p.pickup.hours}</p>}
        {p.pickup.note && <p className="text-xs text-muted-foreground">{p.pickup.note}</p>}
      </div>
    );
  }
  // delivery areas
  const shown = p.delivery.areas.slice(0, 5);
  return (
    <ul className="space-y-1.5 text-sm">
      {shown.map((a) => (
        <li key={a.id} className="flex items-baseline justify-between gap-3 rounded-md bg-muted/50 px-3 py-1.5">
          <span className="truncate">{a.name}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {a.fee === null ? "No delivery" : `${formatCurrency(a.fee)}${a.eta ? ` · ${a.eta}` : ""}`}
          </span>
        </li>
      ))}
      {p.delivery.areas.length > shown.length && (
        <li className="px-3 text-xs text-muted-foreground">+{p.delivery.areas.length - shown.length} more</li>
      )}
    </ul>
  );
}
