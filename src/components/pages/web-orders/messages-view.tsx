"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { StatusChip } from "@/components/atoms/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";

import { useUpdateWebMessage, type WebMessageRow } from "./use-web-inbox";

export const MESSAGE_FILTERS = [
  { key: "new", label: "New" },
  { key: "handled", label: "Handled" },
] as const;

export function MessagesView({ rows, filter }: { rows: WebMessageRow[]; filter: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const update = useUpdateWebMessage();
  const shown = rows.filter((m) => m.status === filter);
  const open = rows.find((m) => m.id === openId) ?? null;

  const mark = async (m: WebMessageRow, status: "new" | "handled") => {
    try {
      await update.mutateAsync({ id: m.id, status });
      toast.success(status === "handled" ? "Marked as handled" : "Moved back to new");
      setOpenId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update the message");
    }
  };

  if (!shown.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {filter === "new" ? "No new messages. Messages from the website contact form appear here." : "Nothing here."}
      </div>
    );
  }
  return (
    <>
      <div className="space-y-3">
        {shown.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpenId(m.id)}
            className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{m.name}</span>
                <StatusChip label={m.subject} variant="neutral" />
              </div>
              <p className="truncate text-sm text-muted-foreground">{m.message}</p>
            </div>
            <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.subject}</DialogTitle>
                <DialogDescription>
                  From {open.name} · {formatDateTime(open.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="whitespace-pre-wrap rounded-md bg-muted px-3 py-2">{open.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}>
                      <Mail className="mr-2 size-4" />
                      {open.email}
                    </a>
                  </Button>
                  {open.phone && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`tel:${open.phone}`}>
                        <Phone className="mr-2 size-4" />
                        {open.phone}
                      </a>
                    </Button>
                  )}
                </div>
                <div className="flex justify-end">
                  {open.status === "new" ? (
                    <Button type="button" disabled={update.isPending} onClick={() => mark(open, "handled")}>
                      Mark as handled
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" disabled={update.isPending} onClick={() => mark(open, "new")}>
                      Move back to new
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
