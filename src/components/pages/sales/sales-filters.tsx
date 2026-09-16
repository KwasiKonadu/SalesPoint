"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchSelect } from "@/components/molecules/search-select";
import {
  SALES_PAYMENT_FILTER_OPTIONS,
  SALES_STATUS_FILTER_OPTIONS,
  type StaffMember,
} from "@/lib/sales";

import type { SalesListController } from "./use-sales";

/** Date-range + payment / status / sales-person selects for the sales table. */
export function SalesFilters({
  filters,
  staffList,
}: {
  filters: SalesListController["filters"];
  staffList: StaffMember[];
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Label className="whitespace-nowrap text-sm">From:</Label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => filters.setStartDate(e.target.value)}
          className="w-37.5"
        />
        <Label className="whitespace-nowrap text-sm">To:</Label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => filters.setEndDate(e.target.value)}
          className="w-37.5"
        />
      </div>

      <div className="w-40">
        <SearchSelect
          size="sm"
          clearable={false}
          placeholder="Payment Method"
          value={filters.paymentFilter}
          onChange={filters.setPaymentFilter}
          options={SALES_PAYMENT_FILTER_OPTIONS}
        />
      </div>

      <div className="w-40">
        <SearchSelect
          size="sm"
          clearable={false}
          placeholder="Status"
          value={filters.statusFilter}
          onChange={filters.setStatusFilter}
          options={SALES_STATUS_FILTER_OPTIONS}
        />
      </div>

      <div className="w-40">
        <SearchSelect
          size="sm"
          clearable={false}
          placeholder="Sales Person"
          value={filters.personFilter}
          onChange={filters.setPersonFilter}
          options={[
            { value: "all", label: "All Staff" },
            ...staffList.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      </div>
    </>
  );
}
