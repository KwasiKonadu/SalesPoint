"use client";

import { useState } from "react";

import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { TabBar } from "@/components/molecules/tab-bar";
import { DiscountsTab } from "./discounts-tab";
import { HomepageTab } from "./homepage-tab";
import { ProductsTab } from "./products-tab";
import { PromisesTab } from "./promises-tab";

type Tab = "homepage" | "products" | "discounts" | "promises";

export default function WebsitePage() {
  const [tab, setTab] = useState<Tab>("homepage");
  return (
    <div className="space-y-4">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={tab}
          onTabChange={(t) => setTab(t as Tab)}
          tabs={[
            { key: "homepage", label: "Homepage" },
            { key: "products", label: "Products" },
            { key: "discounts", label: "Discounts" },
            { key: "promises", label: "Promises" },
          ]}
        />
      </PageTabsSlot>
      {tab === "homepage" ? <HomepageTab /> : tab === "products" ? <ProductsTab /> : tab === "discounts" ? <DiscountsTab /> : <PromisesTab />}
    </div>
  );
}
