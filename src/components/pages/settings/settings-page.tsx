"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { TabBar } from "@/components/molecules/tab-bar";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { BusinessInfoTab } from "./business-info-tab";
import { ProductConfigTab } from "./product-config-tab";
import { ReceiptSettingsTab } from "./receipt-settings-tab";
import type { SettingsTab } from "@/lib/settings";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "business-info", label: "Business Info" },
  { key: "product-config", label: "Product Config" },
  { key: "receipt-settings", label: "Receipt" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("business-info");

  return (
    <div className="space-y-6">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as SettingsTab)}
          tabs={TABS}
        />
      </PageTabsSlot>

      <Card>
        <CardContent className="pt-6">
          {activeTab === "business-info" && <BusinessInfoTab />}
          {activeTab === "product-config" && <ProductConfigTab />}
          {activeTab === "receipt-settings" && <ReceiptSettingsTab />}
        </CardContent>
      </Card>
    </div>
  );
}
