"use client";

import {
  CheckCircle2,
  ChevronRight,
  Download,
  Printer,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { buildReceiptHtml, buildReceiptText, type SaleResponse } from "@/lib/pos";
import { ReceiptContent } from "@/components/pages/sales/receipt-content";

/** Post-sale success screen: the printable receipt plus export actions. */
export function ReceiptDialog({
  open,
  onOpenChange,
  sale,
  onNewSale,
  onSendReceipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleResponse | null;
  onNewSale: () => void;
  onSendReceipt: () => void;
}) {
  const handlePrint = () => {
    if (!sale) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(buildReceiptHtml(sale));
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!sale) return;
    const blob = new Blob([buildReceiptText(sale)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${sale.transactionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold">Sale Complete!</h3>
          <p className="text-sm text-muted-foreground">
            {sale?.transactionNumber}
          </p>
        </div>

        {sale && (
          <div className="max-h-[45vh] overflow-y-auto rounded-lg border bg-white p-5 text-neutral-900 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="mx-auto max-w-75">
              <ReceiptContent sale={sale} />
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="size-4" />
              Download
            </Button>
            <Button
              variant="outline"
              className="col-span-2"
              onClick={onSendReceipt}
            >
              <Send className="size-4" />
              Send Receipt
            </Button>
          </div>
          <Button
            className="w-full rounded-xl py-5 text-base font-semibold"
            size="lg"
            onClick={onNewSale}
          >
            New Sale
            <ChevronRight className="ml-1 size-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
