/**
 * Types, palette and date maths shared by the Reports screen and its
 * sub-components (`src/components/reports/*`).
 */

// ==================== Palette ====================

export const REPORT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

// ==================== Period ====================

export type PeriodKey =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export const PERIOD_KEYS: PeriodKey[] = [
  'today',
  'this_week',
  'this_month',
  'last_month',
  'this_year',
  'custom',
];

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Today',
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  custom: 'Custom',
};

// ==================== Report data types ====================

export interface SalesOverviewItem {
  date: string;
  amount: number;
}

export interface SalesByProductItem {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
}

export interface SalesByCategoryItem {
  category: string;
  revenue: number;
  cost: number;
  quantity: number;
  profit: number;
  percentage: number;
}

export interface SalesByStaffItem {
  staffId: string;
  staffName: string;
  totalSales: number;
  transactions: number;
}

export interface SalesByPaymentItem {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpensesByCategoryItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ProfitData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  totalTransactions: number;
  avgOrderValue: number;
}

export interface TopCustomerItem {
  customerId: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  totalSpent: number;
  transactions: number;
  lastPurchase: string;
}

export interface SupplierPurchaseItem {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  restockCount: number;
  outstandingBalance: number;
}

export interface ReportState {
  salesOverview: SalesOverviewItem[] | null;
  salesByProduct: SalesByProductItem[] | null;
  salesByCategory: SalesByCategoryItem[] | null;
  salesByStaff: SalesByStaffItem[] | null;
  salesByPayment: SalesByPaymentItem[] | null;
  expensesByCategory: ExpensesByCategoryItem[] | null;
  profit: ProfitData | null;
  topCustomers: TopCustomerItem[] | null;
  supplierPurchases: SupplierPurchaseItem[] | null;
  previousPeriodProfit: ProfitData | null;
}

export type ReportKey = Exclude<keyof ReportState, 'previousPeriodProfit'>;

export type LoadingState = Record<ReportKey, boolean>;

export const EMPTY_REPORTS: ReportState = {
  salesOverview: null,
  salesByProduct: null,
  salesByCategory: null,
  salesByStaff: null,
  salesByPayment: null,
  expensesByCategory: null,
  profit: null,
  topCustomers: null,
  supplierPurchases: null,
  previousPeriodProfit: null,
};

export const INITIAL_LOADING: LoadingState = {
  salesOverview: true,
  salesByProduct: true,
  salesByCategory: true,
  salesByStaff: true,
  salesByPayment: true,
  expensesByCategory: true,
  profit: true,
  topCustomers: true,
  supplierPurchases: true,
};

// ==================== Helpers ====================

export function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateForInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodDates(
  period: PeriodKey,
  customStart?: string,
  customEnd?: string,
) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      startDate = new Date(customStart || now);
      endDate = new Date(customEnd || now);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate),
  };
}

export function getPreviousPeriodDates(currentStart: string, currentEnd: string) {
  const start = new Date(currentStart + 'T00:00:00');
  const end = new Date(currentEnd + 'T00:00:00');
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return {
    startDate: formatDateForInput(prevStart),
    endDate: formatDateForInput(prevEnd),
  };
}

export function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  credit: 'Credit',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

export const renderPieLabel = ({
  percent,
}: {
  name: string;
  percent: number;
}) => {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
};
