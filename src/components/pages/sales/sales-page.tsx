"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { buildPrintableReceipt, type Sale } from "@/lib/sales";
import { TabBar } from "@/components/molecules/tab-bar";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { PaymentReceiptDialog } from "./payment-receipt-dialog";
import { ProcessReturnPanel } from "./process-return-panel";
import { RecordPaymentPanel } from "./record-payment-panel";
import { ReceiptContent } from "./receipt-content";
import { ReceiptViewDialog } from "./receipt-view-dialog";
import { ReturnsTab } from "./returns-tab";
import { SaleDetailDialog } from "./sale-detail-dialog";
import { SalesHistoryTab } from "./sales-history-tab";
import { useReturnsList } from "./use-returns-list";
import { useSalesList } from "./use-sales-list";

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("sales");
  const salesList = useSalesList();
  const returnsList = useReturnsList(activeTab === "returns");

  // ---- Sale detail ----
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- Receipt / return / payment ----
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentReceiptOpen, setPaymentReceiptOpen] = useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const openDetail = async (sale: Sale) => {
    setDetailSale(null);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}`);
      if (!res.ok) throw new Error("Failed to fetch sale details");
      setDetailSale(await res.json());
    } catch {
      toast.error("Failed to load sale details");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print receipt");
      return;
    }
    printWindow.document.write(buildPrintableReceipt(content.innerHTML));
    printWindow.document.close();
    printWindow.print();
  };

  const handleReturnSuccess = () => {
    setDetailOpen(false);
    salesList.refetch();
    if (activeTab === "returns") returnsList.refetch();
  };

  const handlePaymentRecorded = (updated: Sale) => {
    setDetailSale(updated);
    salesList.refetch();
    // Pop the payment receipt for the instalment just recorded (newest first).
    const newest = updated.payments?.[0];
    if (newest) {
      setPaymentReceiptId(newest.id);
      setPaymentReceiptOpen(true);
    }
  };

  const openPaymentReceipt = (paymentId: string) => {
    setPaymentReceiptId(paymentId);
    setPaymentReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { key: "sales", label: "Sales History" },
            { key: "returns", label: "Returns" },
          ]}
        />
      </PageTabsSlot>

      {activeTab === "sales" && (
        <SalesHistoryTab list={salesList} onView={openDetail} />
      )}
      {activeTab === "returns" && <ReturnsTab list={returnsList} />}

      <SaleDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        sale={detailSale}
        loading={detailLoading}
        isAdmin={isAdmin}
        onViewReceipt={() => setReceiptOpen(true)}
        onPrintReceipt={handlePrintReceipt}
        onProcessReturn={() => setReturnOpen(true)}
        onRecordPayment={() => setRecordPaymentOpen(true)}
        onViewPaymentReceipt={openPaymentReceipt}
      />

      <RecordPaymentPanel
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        sale={detailSale}
        userId={user?.id}
        onSuccess={handlePaymentRecorded}
      />

      <PaymentReceiptDialog
        open={paymentReceiptOpen}
        onOpenChange={setPaymentReceiptOpen}
        sale={detailSale}
        paymentId={paymentReceiptId}
      />

      <ReceiptViewDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={detailSale}
        onPrint={handlePrintReceipt}
      />

      <ProcessReturnPanel
        open={returnOpen}
        onOpenChange={setReturnOpen}
        sale={detailSale}
        userId={user?.id}
        onSuccess={handleReturnSuccess}
      />

      {/* Off-screen copy that backs the Print action from either dialog. */}
      {detailSale && (
        <div className="sr-only" aria-hidden>
          <ReceiptContent ref={receiptRef} sale={detailSale} />
        </div>
      )}
    </div>
  );
}
