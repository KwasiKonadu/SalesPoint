import { TypeChip, typeChipColorFor } from "@/components/atoms/type-chip";
import type { Column } from "@/components/organisms/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { expensePaymentLabel, type Expense } from "@/lib/expenses";

/** Column definitions for the expenses table. */
export const expenseColumns: Column<Expense>[] = [
  {
    key: "date",
    label: "Date",
    width: "minmax(110px, max-content)",
    className: "whitespace-nowrap",
    render: (e) => formatDate(e.date),
  },
  {
    key: "category",
    label: "Category",
    width: "minmax(120px, max-content)",
    render: (e) =>
      e.category ? (
        <TypeChip
          label={e.category.name}
          color={typeChipColorFor(e.category.name)}
        />
      ) : (
        <span className="text-sm text-muted-foreground">Uncategorized</span>
      ),
  },
  {
    key: "description",
    label: "Description",
    width: "minmax(160px, 1.5fr)",
    className: "truncate",
    render: (e) => e.description || "—",
  },
  {
    key: "amount",
    label: "Amount",
    width: "minmax(100px, max-content)",
    align: "right",
    className: "font-medium tabular-nums",
    render: (e) => formatCurrency(e.amount),
  },
  {
    key: "paymentMethod",
    label: "Payment Method",
    width: "minmax(120px, max-content)",
    render: (e) => expensePaymentLabel(e.paymentMethod),
  },
  {
    key: "createdBy",
    label: "Created By",
    width: "minmax(120px, max-content)",
    render: (e) => e.createdBy?.name || "—",
  },
];
