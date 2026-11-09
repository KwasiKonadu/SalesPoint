"use client";

import { useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomersPage from "@/components/pages/customers/customers-page";
import SuppliersPage from "@/components/pages/suppliers/suppliers-page";

type Tab = "customers" | "suppliers";

export default function ContactsPage({ initialTab }: { initialTab: Tab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>(initialTab);
  const active: Tab = tab === "suppliers" && !isAdmin ? "customers" : tab;

  const onTabChange = (value: string) => {
    const next = value as Tab;
    setTab(next);
    window.history.replaceState(null, "", `/contacts?tab=${next}`);
  };

  return (
    <Tabs value={active} onValueChange={onTabChange} className="gap-6">
      <TabsList>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        {isAdmin && <TabsTrigger value="suppliers">Suppliers</TabsTrigger>}
      </TabsList>
      <TabsContent value="customers">
        <CustomersPage />
      </TabsContent>
      {isAdmin && (
        <TabsContent value="suppliers">
          <SuppliersPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
