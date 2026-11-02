"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

interface Waiting {
  counts: { orders: number; returns: number; messages: number };
  orders: { id: string; ref: string; customerName: string; total: number; fulfilment: string }[];
  returns: { id: string; orderRef: string; reason: string }[];
  messages: { id: string; name: string; subject: string }[];
}

/** Two-note chime. Silent if the browser hasn't allowed audio yet (no click on the page so far). */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") return;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.16;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* an alert sound is a nicety; never break the app over it */
  }
}

/**
 * Watches for things from the website that need the shop: new orders, return requests and
 * messages. Every signed-in screen gets the total (sidebar badge, tab title); a toast and
 * chime fire when something new arrives.
 */
export function useNewOrderAlert(enabled: boolean) {
  const router = useRouter();
  const qc = useQueryClient();
  const known = useRef<Set<string> | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.webOrders.pending,
    queryFn: () => apiClient.get<Waiting>("/api/web-orders/pending", "Failed to check for new orders"),
    enabled,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;
    const all = [
      ...data.orders.map((o) => ({
        id: `order:${o.id}`,
        title: `New web order ${o.ref}`,
        detail: `${o.customerName} · ${formatCurrency(o.total)} · ${o.fulfilment}`,
      })),
      ...data.returns.map((r) => ({ id: `return:${r.id}`, title: `Return request for ${r.orderRef}`, detail: r.reason })),
      ...data.messages.map((m) => ({ id: `message:${m.id}`, title: `New message from ${m.name}`, detail: m.subject })),
    ];
    // First load only learns what's already waiting; it doesn't announce it.
    if (known.current) {
      const fresh = all.filter((a) => !known.current!.has(a.id));
      if (fresh.length) {
        chime();
        toast.info(fresh.length === 1 ? fresh[0].title : `${fresh.length} new things on the website`, {
          description: fresh.length === 1 ? fresh[0].detail : fresh.map((f) => f.title).slice(0, 3).join(" · "),
          duration: 12_000,
          action: { label: "View", onClick: () => router.push("/web-orders") },
        });
        qc.invalidateQueries({ predicate: (q) => ["web-orders", "web-returns", "web-messages"].includes(String(q.queryKey[0])) && q.queryKey[1] !== "pending" });
      }
    }
    known.current = new Set(all.map((a) => a.id));
  }, [data, router, qc]);

  // "(2) …" in the browser tab so it shows even when the app is in the background.
  const count = data ? data.counts.orders + data.counts.returns + data.counts.messages : 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, [count]);

  return count;
}
