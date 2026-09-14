"use client";

import { DataTable, type Column } from "@/components/organisms/data-table";
import { formatCurrency } from "@/lib/format";
import type {
  SalesByProductItem,
  SalesByStaffItem,
  SupplierPurchaseItem,
  TopCustomerItem,
} from "@/lib/reports";

import { ReportCard } from "./report-primitives";
import { TableSkeleton } from "./report-skeletons";

function Initial({ name }: { name: string }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const rankColumn = {
  key: "rank",
  label: "#",
  width: "48px",
  className: "font-medium text-muted-foreground",
  render: (_row: unknown, i: number) => i + 1,
};

function ScrollTable<T>({
  columns,
  data,
  getRowKey,
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
}) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <DataTable<T> bare columns={columns} data={data} getRowKey={getRowKey} />
    </div>
  );
}

export function SalesByStaffTable({
  data,
  loading,
}: {
  data: SalesByStaffItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Sales by Staff"
      description="Top 10 staff members by revenue"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<TableSkeleton rows={5} />}
    >
      <ScrollTable<SalesByStaffItem>
        getRowKey={(s) => s.staffId}
        data={(data ?? []).slice(0, 10)}
        columns={[
          rankColumn as Column<SalesByStaffItem>,
          {
            key: "name",
            label: "Name",
            width: "minmax(180px, 1fr)",
            render: (staff) => (
              <div className="flex items-center gap-2">
                <Initial name={staff.staffName} />
                {staff.staffName}
              </div>
            ),
          },
          {
            key: "transactions",
            label: "Transactions",
            width: "minmax(110px, max-content)",
            align: "right",
            render: (staff) => staff.transactions,
          },
          {
            key: "revenue",
            label: "Revenue",
            width: "minmax(110px, max-content)",
            align: "right",
            className: "font-medium",
            render: (staff) => formatCurrency(staff.totalSales),
          },
        ]}
      />
    </ReportCard>
  );
}

export function TopProductsTable({
  data,
  loading,
}: {
  data: SalesByProductItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Top Products"
      description="Top 10 products by revenue"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<TableSkeleton rows={5} />}
    >
      <ScrollTable<SalesByProductItem>
        getRowKey={(p) => p.productId}
        data={(data ?? []).slice(0, 10)}
        columns={[
          rankColumn as Column<SalesByProductItem>,
          {
            key: "product",
            label: "Product",
            width: "minmax(200px, 1fr)",
            render: (product) => (
              <div className="flex flex-col">
                <span className="font-medium">{product.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {product.category}
                </span>
              </div>
            ),
          },
          {
            key: "qty",
            label: "Qty Sold",
            width: "minmax(90px, max-content)",
            align: "right",
            render: (product) => product.quantitySold,
          },
          {
            key: "revenue",
            label: "Revenue",
            width: "minmax(110px, max-content)",
            align: "right",
            className: "font-medium",
            render: (product) => formatCurrency(product.revenue),
          },
        ]}
      />
    </ReportCard>
  );
}

export function TopCustomersTable({
  data,
  loading,
}: {
  data: TopCustomerItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Top Customers"
      description="Customers ranked by total spending"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<TableSkeleton rows={5} />}
    >
      <ScrollTable<TopCustomerItem>
        getRowKey={(c) => c.customerId}
        data={data ?? []}
        columns={[
          rankColumn as Column<TopCustomerItem>,
          {
            key: "customer",
            label: "Customer",
            width: "minmax(200px, 1fr)",
            render: (customer) => (
              <div className="flex items-center gap-2">
                <Initial name={customer.customerName} />
                <div>
                  <span className="font-medium">{customer.customerName}</span>
                  {customer.phone && (
                    <span className="block text-xs text-muted-foreground">
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "purchases",
            label: "Purchases",
            width: "minmax(100px, max-content)",
            align: "right",
            render: (customer) => customer.transactions,
          },
          {
            key: "totalSpent",
            label: "Total Spent",
            width: "minmax(110px, max-content)",
            align: "right",
            className: "font-medium",
            render: (customer) => formatCurrency(customer.totalSpent),
          },
        ]}
      />
    </ReportCard>
  );
}

export function SupplierPurchasesTable({
  data,
  loading,
}: {
  data: SupplierPurchaseItem[] | null;
  loading: boolean;
}) {
  return (
    <ReportCard
      title="Supplier Purchases"
      description="Purchase summary by supplier for the period"
      loading={loading}
      hasData={!!data?.length}
      skeleton={<TableSkeleton rows={3} />}
    >
      <ScrollTable<SupplierPurchaseItem>
        getRowKey={(s) => s.supplierId}
        data={data ?? []}
        columns={[
          rankColumn as Column<SupplierPurchaseItem>,
          {
            key: "supplier",
            label: "Supplier",
            width: "minmax(200px, 1fr)",
            render: (supplier) => (
              <div className="flex items-center gap-2">
                <Initial name={supplier.supplierName} />
                {supplier.supplierName}
              </div>
            ),
          },
          {
            key: "orders",
            label: "Orders",
            width: "minmax(80px, max-content)",
            align: "right",
            render: (supplier) => supplier.restockCount,
          },
          {
            key: "totalPurchases",
            label: "Total Purchases",
            width: "minmax(120px, max-content)",
            align: "right",
            className: "font-medium",
            render: (supplier) => formatCurrency(supplier.totalPurchases),
          },
          {
            key: "outstanding",
            label: "Outstanding",
            width: "minmax(110px, max-content)",
            align: "right",
            render: (supplier) => (
              <span
                className={
                  supplier.outstandingBalance > 0
                    ? "font-medium text-amber-600"
                    : "text-muted-foreground"
                }
              >
                {formatCurrency(supplier.outstandingBalance)}
              </span>
            ),
          },
        ]}
      />
    </ReportCard>
  );
}
