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
import { useReturnsList, useSaleDetail, useSalesList } from "./use-sales";

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("sales");
  const salesList = useSalesList();
  const returnsList = useReturnsList(activeTab === "returns");

  // ---- Sale detail ----
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSaleId, setDetailSaleId] = useState<string | null>(null);
  const { data: detailSaleData, isPending: detailLoading } = useSaleDetail(
    detailOpen ? detailSaleId : null,
  );
  const detailSale = detailSaleData ?? null;

  // ---- Receipt / return / payment ----
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentReceiptOpen, setPaymentReceiptOpen] = useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const openDetail = (sale: Sale) => {
    setDetailSaleId(sale.id);
    setDetailOpen(true);
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
  };

  const handlePaymentRecorded = (updated: Sale) => {
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
