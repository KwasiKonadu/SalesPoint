"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/format";
import { lineUnits, type SaleResponse } from "@/lib/pos";

import { AddCustomerDialog } from "./add-customer-dialog";
import { CartPanel } from "./cart-panel";
import {
  CheckoutDialog,
  type CheckoutPayload,
} from "./checkout-dialog";
import { ConfirmPaymentDialog } from "./confirm-payment-dialog";
import { ProductPanel } from "./product-panel";
import { ReceiptDialog } from "./receipt-dialog";
import { SendReceiptDialog } from "./send-receipt-dialog";
import { useCart } from "./use-cart";
import { usePosCatalog } from "./use-pos-catalog";

export default function POSPage() {
  const { user } = useAuth();
  const catalog = usePosCatalog();
  const cart = useCart();

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [sendReceiptOpen, setSendReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const openCheckout = () => {
    if (!cart.isEmpty) setCheckoutOpen(true);
  };

  const handleCheckout = async ({
    paymentMethod,
    amountReceived,
  }: CheckoutPayload) => {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { total, discountAmount, taxAmount } = cart.totals;
    if (
      paymentMethod === "cash" &&
      (isNaN(amountReceived) || amountReceived < total)
    ) {
      toast.error("Invalid amount", {
        description:
          "Amount received must be at least " + formatCurrency(total),
      });
      return;
    }

    if (paymentMethod === "credit" && !cart.customer) {
      toast.error("Credit sales require a customer", {
        description: "Select a customer before paying on credit.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          soldById: user.id,
          customerId: cart.customer?.id || null,
          items: cart.items.map((item) => ({
            productId: item.product.id,
            quantity: lineUnits(item),
            wholesale: item.mode === "pack",
          })),
          discountAmount: Math.round(discountAmount * 100) / 100,
          taxAmount: Math.round(taxAmount * 100) / 100,
          paymentMethod,
          amountReceived: paymentMethod === "cash" ? amountReceived : total,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sale failed");
      }

      const sale: SaleResponse = await res.json();
      setLastSale(sale);
      setCheckoutOpen(false);
      if (paymentMethod === "cash") {
        setReceiptOpen(true);
        toast.success("Sale completed!", {
          description: sale.transactionNumber,
        });
      } else {
        // Non-cash: sale is pending until the payment is confirmed.
        setConfirmPaymentOpen(true);
        toast.success("Sale recorded — confirm the payment", {
          description: sale.transactionNumber,
        });
      }
    } catch (err) {
      toast.error("Sale failed", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setReceiptOpen(false);
    setLastSale(null);
    cart.clear();
  };

  const handlePaymentDone = (received?: number) => {
    setConfirmPaymentOpen(false);
    if (received != null) {
      setLastSale((prev) =>
        prev ? { ...prev, amountReceived: received } : prev,
      );
    }
    setReceiptOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-8.75rem)] overflow-hidden lg:h-[calc(100vh-10.75rem)]">
      <ProductPanel
        catalog={catalog}
        onAdd={cart.addProduct}
        onAddPack={cart.addPack}
      />

      <CartPanel
        cart={cart}
        customers={catalog.customers}
        onAddCustomer={() => setAddCustomerOpen(true)}
        onCheckout={openCheckout}
      />

      <AddCustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        userId={user?.id}
        onCreated={(customer) => {
          catalog.addCustomer(customer);
          cart.setCustomer(customer);
        }}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart.items}
        totals={cart.totals}
        customerName={cart.customer?.name ?? ""}
        hasCustomer={!!cart.customer}
        isProcessing={isProcessing}
        onConfirm={handleCheckout}
      />

      <ConfirmPaymentDialog
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
        sale={lastSale}
        userId={user?.id}
        onDone={handlePaymentDone}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={lastSale}
        onNewSale={handleNewSale}
        onSendReceipt={() => setSendReceiptOpen(true)}
      />

      <SendReceiptDialog
        open={sendReceiptOpen}
        onOpenChange={setSendReceiptOpen}
        defaultTo={cart.customer?.phone || lastSale?.customer?.phone || ""}
      />
    </div>
  );
}
