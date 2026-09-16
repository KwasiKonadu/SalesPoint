"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/organisms/data-table";
import { FormPanel } from "@/components/molecules/form-panel";
import { SearchSelect } from "@/components/molecules/search-select";
import { TextField } from "@/components/atoms/text-field";
import { formatCurrency } from "@/lib/format";
import {
  calcRefundTotal,
  RETURN_REASONS,
  type ReturnItemInput,
  type Sale,
  type SaleItem,
} from "@/lib/sales";
import { useProcessReturn } from "./use-sales";

/** Side panel for processing a partial/full return against a completed sale. */
export function ProcessReturnPanel({
  open,
  onOpenChange,
  sale,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  userId: string | undefined;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ReturnItemInput[]>([]);
  const processReturn = useProcessReturn();

  // Seed one return-qty row per sale item each time the panel opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason("");
      setNotes("");
      setItems(
        sale?.items?.map((item) => ({ saleItemId: item.id, quantity: 0 })) ??
          [],
      );
    }
  }

  const updateQty = (index: number, qty: number) => {
    const maxQty = sale?.items?.[index]?.quantity ?? 0;
    const clamped = Math.max(0, Math.min(qty, maxQty));
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: clamped };
      return updated;
    });
  };

  const refundTotal = calcRefundTotal(sale?.items, items);

  const itemColumns: Column<SaleItem>[] = [
    {
      key: "product",
      label: "Product",
      render: (item) => <span className="font-medium">{item.productName}</span>,
    },
    {
      key: "soldQty",
      label: "Sold Qty",
      align: "center",
      width: "2rem",
      render: (item) => item.quantity,
    },
    {
      key: "unitPrice",
      label: "Unit Price",
      align: "right",
      width: "5rem",
      render: (item) => formatCurrency(item.unitPrice),
    },
    {
      key: "returnQty",
      label: "Return Qty",
      align: "center",
      width: "5rem",
      render: (item, idx) => (
        <Input
          type="number"
          min={0}
          max={item.quantity}
          value={items[idx]?.quantity ?? 0}
          onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)}
          className="mx-auto w-20 text-center"
        />
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!sale) return;
    const itemsToReturn = items.filter((r) => r.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    if (!reason) {
      toast.error("Please select a return reason");
      return;
    }

    try {
      await processReturn.mutateAsync({
        saleId: sale.id,
        processedById: userId,
        reason,
        notes: notes || undefined,
        items: itemsToReturn,
      });
      toast.success("Return processed successfully");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process return",
      );
    }
  };

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Process Return"
      description={`Return for ${sale?.transactionNumber ?? ""}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={processReturn.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {processReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Return
          </Button>
        </>
      }
    >
      {sale && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Sale Items</h3>
            <DataTable<SaleItem>
              dense
              columns={itemColumns}
              data={sale.items ?? []}
              getRowKey={(item) => item.id}
            />
          </div>

          <SearchSelect
            label="Return Reason *"
            placeholder="Select a reason"
            value={reason}
            onChange={setReason}
            options={RETURN_REASONS.map((r) => ({ value: r, label: r }))}
          />

          <TextField
            label="Notes"
            type="textarea"
            placeholder="Optional notes about this return..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <Card>
            <CardContent className="flex items-center justify-between px-6">
              <span className="text-sm font-medium">Refund Total</span>
              <span className="text-lg font-bold text-amber-600">
                {formatCurrency(refundTotal)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </FormPanel>
  );
}
