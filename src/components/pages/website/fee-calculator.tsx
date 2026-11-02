"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/atoms/field-label";
import { SearchSelect } from "@/components/molecules/search-select";
import { formatCurrency } from "@/lib/format";
import { deliveryCharge, type Promises } from "@/lib/website";

/** "Try an order": shows what a customer would be charged for delivery under the promises being edited. */
export function FeeCalculator({ promises }: { promises: Promises }) {
  const areas = promises.delivery.areas.filter((a) => a.name.trim());
  const [areaId, setAreaId] = useState("");
  const [amount, setAmount] = useState("100");
  const chosen = areas.find((a) => a.id === areaId) ?? areas[0];
  const subtotal = Number(amount) || 0;
  const result = chosen ? deliveryCharge(promises, chosen.id, subtotal) : null;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
      <p className="text-sm font-medium">Try an order</p>
      {areas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Add a delivery area to see what customers would pay.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Order total</FieldLabel>
              <Input type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <SearchSelect
              label="Delivery area"
              clearable={false}
              value={chosen?.id ?? ""}
              onChange={setAreaId}
              options={areas.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>
          <p className="text-sm tabular-nums">
            {result?.fee === null ? (
              <span className="text-muted-foreground">We don&apos;t deliver there.</span>
            ) : result?.free ? (
              <>
                Delivery: <b>Free</b>{" "}
                <span className="text-muted-foreground">
                  (normally {formatCurrency(chosen!.fee ?? 0)}, waived over {formatCurrency(promises.freeDelivery.threshold)})
                </span>
              </>
            ) : (
              <>
                Delivery: <b>{formatCurrency(result?.fee ?? 0)}</b>
                {promises.freeDelivery.enabled && subtotal < promises.freeDelivery.threshold && (
                  <span className="text-muted-foreground"> · {formatCurrency(promises.freeDelivery.threshold - subtotal)} more for free delivery</span>
                )}
              </>
            )}
          </p>
          {result?.fee !== null && (
            <p className="text-sm tabular-nums text-muted-foreground">
              Customer pays: <b className="text-foreground">{formatCurrency(subtotal + (result?.fee ?? 0))}</b>
            </p>
          )}
        </>
      )}
    </div>
  );
}
