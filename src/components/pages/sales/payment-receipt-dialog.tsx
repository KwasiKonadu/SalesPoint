"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
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
import { buildPrintableReceipt, type Sale } from "@/lib/sales";

import { PaymentReceiptContent } from "./payment-receipt-content";

/** Read-only payment-receipt preview with a Print action. */
export function PaymentReceiptDialog({
  open,
  onOpenChange,
  sale,
  paymentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  paymentId: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = ref.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print receipt");
      return;
    }
    printWindow.document.write(buildPrintableReceipt(el.innerHTML));
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-95">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>Acknowledgement of payment received</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-lg border bg-white p-6 text-neutral-900 dark:bg-zinc-950 dark:text-zinc-100">
          {sale && paymentId && (
            <div className="mx-auto max-w-75">
              <PaymentReceiptContent
                ref={ref}
                sale={sale}
                paymentId={paymentId}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
