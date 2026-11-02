"use client";

import { useState } from "react";
import { Store, Truck } from "lucide-react";

import { StatusChip } from "@/components/atoms/status-chip";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { TabBar } from "@/components/molecules/tab-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_LABEL, STATUS_VARIANT, type WebOrderRow } from "@/lib/web-order-status";

import { cn } from "@/lib/utils";

import { MESSAGE_FILTERS, MessagesView } from "./messages-view";
import { OrderDialog } from "./order-dialog";
import { inReturnFilter, RETURN_FILTERS, ReturnsView } from "./returns-view";
import { useWebMessages, useWebReturns } from "./use-web-inbox";
import { useWebOrders } from "./use-web-orders";

const TABS = [
  { key: "pending_confirmation", label: "New" },
  { key: "active", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

const SECTION_TABS = ["returns", "messages"];

const IN_PROGRESS = ["confirmed", "processing", "ready_for_pickup", "out_for_delivery"];

export default function WebOrdersPage() {
  const [tab, setTab] = useState("pending_confirmation");
  const [openId, setOpenId] = useState<string | null>(null);
  // One list for every tab, filtered here, so counts and tabs always agree.
  const { data: all = [], isPending } = useWebOrders("all");
  const { data: returns = [] } = useWebReturns();
  const { data: messages = [] } = useWebMessages();
  const [returnFilter, setReturnFilter] = useState<string>("requested");
  const [messageFilter, setMessageFilter] = useState<string>("new");

  const rows = all.filter((o) => (tab === "all" ? true : tab === "active" ? IN_PROGRESS.includes(o.status) : o.status === tab));
  const count = (key: string) => all.filter((o) => (key === "all" ? true : key === "active" ? IN_PROGRESS.includes(o.status) : o.status === key)).length;
  const open = all.find((o) => o.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <PageTabsSlot>
        <TabBar bare activeTab={tab} onTabChange={setTab} tabs={[
            ...TABS.map((t) => ({ key: t.key, label: `${t.label}${isPending ? "" : ` (${count(t.key)})`}` })),
            { key: "returns", label: `Returns (${returns.filter((r) => r.status === "requested").length})` },
            { key: "messages", label: `Messages (${messages.filter((m) => m.status === "new").length})` },
          ]}
        />
      </PageTabsSlot>

      {tab === "returns" ? (
        <>
          <FilterPills
            value={returnFilter}
            onChange={setReturnFilter}
            options={RETURN_FILTERS.map((f) => ({ ...f, count: returns.filter((r) => inReturnFilter(r, f.key)).length }))}
          />
          <ReturnsView rows={returns} filter={returnFilter} />
        </>
      ) : tab === "messages" ? (
        <>
          <FilterPills
            value={messageFilter}
            onChange={setMessageFilter}
            options={MESSAGE_FILTERS.map((f) => ({ ...f, count: messages.filter((m) => m.status === f.key).length }))}
          />
          <MessagesView rows={messages} filter={messageFilter} />
        </>
      ) : isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {tab === "pending_confirmation" ? "No new orders. Orders placed on the website will appear here." : "Nothing here."}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={() => setOpenId(o.id)} />
          ))}
        </div>
      )}

      <OrderDialog order={open} open={!!open && !SECTION_TABS.includes(tab)} onOpenChange={(v) => !v && setOpenId(null)} />
    </div>
  );
}

function FilterPills({ value, onChange, options }: { value: string; onChange: (key: string) => void; options: { key: string; label: string; count: number }[] }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            value === o.key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {o.label} ({o.count})
        </button>
      ))}
    </div>
  );
}

function OrderRow({ order: o, onOpen }: { order: WebOrderRow; onOpen: () => void }) {
  const Icon = o.fulfilment === "pickup" ? Store : Truck;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{o.ref}</span>
          <StatusChip label={STATUS_LABEL[o.status] ?? o.status} variant={STATUS_VARIANT[o.status] ?? "neutral"} />
          {o.paymentStatus === "paid" && <StatusChip label="Paid" variant="success" />}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {o.customerName} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {o.fulfilment === "pickup" ? "Pickup" : `Delivery${o.areaName ? ` to ${o.areaName}` : ""}`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">{formatCurrency(o.total)}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
      </div>
    </button>
  );
}
