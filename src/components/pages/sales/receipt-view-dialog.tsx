"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Sale } from "@/lib/sales";

import { ReceiptContent } from "./receipt-content";

/** Read-only receipt preview with a Print action. */
export function ReceiptViewDialog({
  open,
  onOpenChange,
  sale,
  onPrint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onPrint: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-95">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>Transaction receipt preview</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-lg border bg-white p-6 text-neutral-900 dark:bg-zinc-950 dark:text-zinc-100">
          {sale && (
            <div className="mx-auto max-w-75">
              <ReceiptContent sale={sale} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
