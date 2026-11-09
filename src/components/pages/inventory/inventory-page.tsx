"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { TabBar } from "@/components/molecules/tab-bar";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { assignTypeChipColors } from "@/components/atoms/type-chip";
import { ExpiryTab } from "./expiry-tab";
import { RestockTab } from "./restock-tab";
import { StockMovementsTab } from "./stock-movements-tab";
import { StockOverviewTab } from "./stock-overview-tab";
import { useInventoryOverview, useInventoryRefs, useRestocks, useStockMovements } from "./use-inventory";

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const refs = useInventoryRefs();
  assignTypeChipColors(refs.categories.map((c) => c.name));
  const overview = useInventoryOverview(activeTab === "overview");
  const movements = useStockMovements(activeTab === "movements");
  const restocks = useRestocks(activeTab === "restock");

  return (
    <div className="space-y-6">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { key: "overview", label: "Stock Overview" },
            { key: "movements", label: "Stock Movements" },
            { key: "restock", label: "Restock" },
            { key: "expiry", label: "Expiry" },
          ]}
        />
      </PageTabsSlot>

      {activeTab === "overview" && (
        <StockOverviewTab
          overview={overview}
          categories={refs.categories}
          isAdmin={isAdmin}
          onNewRestock={() => router.push("/inventory/restock/new")}
        />
      )}

      {activeTab === "movements" && (
        <StockMovementsTab movements={movements} products={refs.products} />
      )}

      {activeTab === "expiry" && (
        <ExpiryTab enabled isAdmin={isAdmin} />
      )}

      {activeTab === "restock" && (
        <RestockTab
          restocks={restocks}
          suppliers={refs.suppliers}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
