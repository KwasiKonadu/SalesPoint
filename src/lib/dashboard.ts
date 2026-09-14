/**
 * Types, palette and helpers shared by the Dashboard screen and its
 * sub-components (`src/components/dashboard/*`).
 */

import {
  Package,
  PackagePlus,
  Plus,
  Receipt,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

export interface DashboardData {
  totalSales: number;
  salesChange: number;
  totalTransactions: number;
  transactionsChange: number;
  totalProfit: number;
  profitChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
  totalCustomers: number;
  customersChange: number;
  salesByCategory: { category: string; amount: number; percentage: number }[];
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    image: string | null;
  }[];
  lowStockProducts: {
    id: string;
    quantity: number;
    threshold: number;
    product: {
      name: string;
      image: string | null;
      category?: { name: string } | null;
      unit?: { name: string } | null;
    };
  }[];
  recentSales: {
    id: string;
    transactionNumber: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    customer: { id: string; name: string } | null;
  }[];
  salesChart: { date: string; amount: number }[];
}

export type RecentSale = DashboardData['recentSales'][number];
export type SalesByCategory = DashboardData['salesByCategory'][number];
export type TopProduct = DashboardData['topProducts'][number];
export type LowStockProduct = DashboardData['lowStockProducts'][number];

export const DASHBOARD_CHART_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export const DASHBOARD_PRODUCT_COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export const CHART_PERIOD_OPTIONS = [
  { value: '7d', label: 'This Week' },
  { value: '30d', label: 'This Month' },
  { value: 'thisMonth', label: 'Month to Date' },
  { value: 'thisYear', label: 'This Year' },
];

export const QUICK_ACTIONS: {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { href: '/pos', label: 'New Sale', icon: Plus, color: 'text-emerald-600' },
  { href: '/products', label: 'Add Product', icon: Package, color: 'text-blue-600' },
  { href: '/inventory', label: 'Restock', icon: PackagePlus, color: 'text-violet-600' },
  { href: '/customers', label: 'Add Customer', icon: UserPlus, color: 'text-pink-600' },
  { href: '/expenses', label: 'Add Expense', icon: Receipt, color: 'text-amber-600' },
];

/** Trailing slice of the daily sales series for the selected chart period. */
export function sliceChartData(
  chart: DashboardData['salesChart'] | undefined,
  period: string,
): DashboardData['salesChart'] {
  if (!chart) return [];
  const now = new Date();
  let days = 30;
  switch (period) {
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case 'thisMonth':
      days = now.getDate();
      break;
    case 'thisYear':
      days = Math.ceil(
        (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      break;
  }
  return chart.slice(-days);
}

/** A dashboard is "empty" when there is no activity at all yet. */
export function isDashboardEmpty(data: DashboardData): boolean {
  return (
    data.totalSales === 0 &&
    data.totalTransactions === 0 &&
    data.totalCustomers === 0
  );
}
