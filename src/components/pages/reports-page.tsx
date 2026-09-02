'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DollarSign,
  Package,
  TrendingUp,
  Wallet,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// --- Constants ---

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type PeriodKey = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

// --- Types ---

interface SalesOverviewItem {
  date: string;
  amount: number;
}

interface SalesOverview {
  data: SalesOverviewItem[];
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgOrderValue: number;
  };
}

interface SalesByProductItem {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
}

interface SalesByCategoryItem {
  category: string;
  revenue: number;
  cost: number;
  quantity: number;
  profit: number;
  percentage: number;
}

interface SalesByStaffItem {
  staffId: string;
  staffName: string;
  totalSales: number;
  transactions: number;
}

interface SalesByPaymentItem {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

interface ExpensesByCategoryItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface ExpensesByCategory {
  data: ExpensesByCategoryItem[];
  summary: { totalExpenses: number };
}

interface ProfitData {
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

interface TopCustomerItem {
  customerId: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  totalSpent: number;
  transactions: number;
  lastPurchase: string;
}

interface SupplierPurchaseItem {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  restockCount: number;
  outstandingBalance: number;
}

interface ReportState {
  salesOverview: SalesOverview | null;
  salesByProduct: SalesByProductItem[] | null;
  salesByCategory: SalesByCategoryItem[] | null;
  salesByStaff: SalesByStaffItem[] | null;
  salesByPayment: SalesByPaymentItem[] | null;
  expensesByCategory: ExpensesByCategory | null;
  profit: ProfitData | null;
  topCustomers: TopCustomerItem[] | null;
  supplierPurchases: SupplierPurchaseItem[] | null;
  previousPeriodProfit: ProfitData | null;
}

interface LoadingState {
  salesOverview: boolean;
  salesByProduct: boolean;
  salesByCategory: boolean;
  salesByStaff: boolean;
  salesByPayment: boolean;
  expensesByCategory: boolean;
  profit: boolean;
  topCustomers: boolean;
  supplierPurchases: boolean;
}

// --- Helpers ---

function formatCurrency(value: number): string {
  return `\u20A5${value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateForInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodDates(period: PeriodKey, customStart?: string, customEnd?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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

function getPreviousPeriodDates(period: PeriodKey, currentStart: string, currentEnd: string) {
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

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    mobile_money: 'Mobile Money',
    bank_transfer: 'Bank Transfer',
    credit: 'Credit',
  };
  return labels[method] || method;
}

// --- Sub Components ---

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null || change === undefined) return null;
  const isPositive = change >= 0;
  return (
    <div className="flex items-center gap-1 text-xs mt-1">
      {isPositive ? (
        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
      )}
      <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
        {Math.abs(change).toFixed(1)}%
      </span>
      <span className="text-muted-foreground">vs prev. period</span>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  change,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: number | null;
  iconBg: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <ChangeIndicator change={change} />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PieChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// --- Custom Tooltips ---

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage?: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(item.value)}
        {item.payload.percentage !== undefined ? ` (${item.payload.percentage.toFixed(1)}%)` : ''}
      </p>
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string; payload?: { percentage?: number } }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.value}</span>
          {entry.payload?.percentage !== undefined && (
            <span className="font-medium">{entry.payload.percentage.toFixed(1)}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Render Label for Donut ---

const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
};

// --- Main Component ---

export default function ReportsPage() {
  const { setCurrentPage } = useAppStore();

  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [reports, setReports] = useState<ReportState>({
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
  });

  const [loading, setLoading] = useState<LoadingState>({
    salesOverview: true,
    salesByProduct: true,
    salesByCategory: true,
    salesByStaff: true,
    salesByPayment: true,
    expensesByCategory: true,
    profit: true,
    topCustomers: true,
    supplierPurchases: true,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage('reports');
  }, [setCurrentPage]);

  const fetchReport = useCallback(async <T,>(type: string, startDate: string, endDate: string, key: keyof LoadingState): Promise<T | null> => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as T;
    } catch {
      return null;
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const fetchAllReports = useCallback(async () => {
    const { startDate, endDate } = getPeriodDates(period, customStart, customEnd);
    setRefreshing(true);
    setError(null);

    try {
      const [salesOverview, salesByProduct, salesByCategory, salesByStaff, salesByPayment, expensesByCategory, profit, topCustomers, supplierPurchases] = await Promise.all([
        fetchReport<SalesOverview>('sales_overview', startDate, endDate, 'salesOverview'),
        fetchReport<SalesByProductItem[]>('sales_by_product', startDate, endDate, 'salesByProduct'),
        fetchReport<SalesByCategoryItem[]>('sales_by_category', startDate, endDate, 'salesByCategory'),
        fetchReport<SalesByStaffItem[]>('sales_by_staff', startDate, endDate, 'salesByStaff'),
        fetchReport<SalesByPaymentItem[]>('sales_by_payment', startDate, endDate, 'salesByPayment'),
        fetchReport<ExpensesByCategory>('expenses_by_category', startDate, endDate, 'expensesByCategory'),
        fetchReport<ProfitData>('profit', startDate, endDate, 'profit'),
        fetchReport<TopCustomerItem[]>('top_customers', startDate, endDate, 'topCustomers'),
        fetchReport<SupplierPurchaseItem[]>('supplier_purchases', startDate, endDate, 'supplierPurchases'),
      ]);

      // Fetch previous period profit for change indicators
      const prevDates = getPreviousPeriodDates(period, startDate, endDate);
      const previousPeriodProfit = await fetchReport<ProfitData>('profit', prevDates.startDate, prevDates.endDate, 'profit');

      setReports({
        salesOverview,
        salesByProduct,
        salesByCategory,
        salesByStaff,
        salesByPayment,
        expensesByCategory,
        profit,
        topCustomers,
        supplierPurchases,
        previousPeriodProfit,
      });
    } catch {
      setError('Failed to load reports. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [period, customStart, customEnd, fetchReport]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  // --- Derived Values ---

  const profitData = reports.profit;
  const prevProfit = reports.previousPeriodProfit;

  const revenueChange = prevProfit ? calcChange(profitData?.revenue || 0, prevProfit.revenue) : null;
  const cogsChange = prevProfit ? calcChange(profitData?.cogs || 0, prevProfit.cogs) : null;
  const grossProfitChange = prevProfit ? calcChange(profitData?.grossProfit || 0, prevProfit.grossProfit) : null;
  const netProfitChange = prevProfit ? calcChange(profitData?.netProfit || 0, prevProfit.netProfit) : null;

  const hasAnyData =
    (profitData && profitData.revenue > 0) ||
    (reports.salesOverview && reports.salesOverview.data.length > 0);

  const periodLabels: Record<PeriodKey, string> = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_year: 'This Year',
    custom: 'Custom',
  };

  // --- Error State ---
  if (error && !hasAnyData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Analyze your business performance</p>
          </div>
        </div>
        <EmptyState message={error} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Analyze your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodKey)}
          >
            <TabsList className="flex-wrap h-auto gap-1">
              {(['today', 'this_week', 'this_month', 'last_month', 'this_year', 'custom'] as PeriodKey[]).map((p) => (
                <TabsTrigger key={p} value={p} className="text-xs px-3">
                  {periodLabels[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            onClick={fetchAllReports}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <Card className="shadow-sm">
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">From</span>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                size="sm"
                onClick={fetchAllReports}
                disabled={!customStart || !customEnd || refreshing}
              >
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === 1. Revenue Summary Cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading.profit && !profitData ? (
          Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
        ) : (
          <>
            <SummaryCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(profitData?.revenue || 0)}
              change={revenueChange}
              iconBg="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            />
            <SummaryCard
              icon={Package}
              label="Cost of Goods"
              value={formatCurrency(profitData?.cogs || 0)}
              change={cogsChange}
              iconBg="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Gross Profit"
              value={formatCurrency(profitData?.grossProfit || 0)}
              change={grossProfitChange}
              iconBg="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            />
            <SummaryCard
              icon={Wallet}
              label="Net Profit"
              value={formatCurrency(profitData?.netProfit || 0)}
              change={netProfitChange}
              iconBg="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
            />
          </>
        )}
      </div>

      {/* === 2. Sales Trend (Area Chart) === */}
      {loading.salesOverview && !reports.salesOverview ? (
        <ChartSkeleton />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.salesOverview && reports.salesOverview.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={reports.salesOverview.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    className="text-xs"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(v) => `\u20A5${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip content={<AreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Not enough data to generate this report" />
            )}
          </CardContent>
        </Card>
      )}

      {/* === 3. Sales by Category (Donut) + Sales by Payment (Horizontal Bar) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales by Category */}
        {loading.salesByCategory && !reports.salesByCategory ? (
          <PieChartSkeleton />
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sales by Category</CardTitle>
              <CardDescription>Revenue distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.salesByCategory && reports.salesByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reports.salesByCategory}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {reports.salesByCategory.map((_, index) => (
                          <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Legend content={<CustomLegend />} payload={reports.salesByCategory.map((item, i) => ({
                    value: item.category,
                    color: COLORS[i % COLORS.length],
                    payload: { percentage: item.percentage },
                  }))} />
                </>
              ) : (
                <EmptyState message="Not enough data to generate this report" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Sales by Payment Method */}
        {loading.salesByPayment && !reports.salesByPayment ? (
          <ChartSkeleton />
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sales by Payment Method</CardTitle>
              <CardDescription>Revenue by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.salesByPayment && reports.salesByPayment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={reports.salesByPayment}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `\u20A5${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="method"
                      tickFormatter={getPaymentMethodLabel}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      {reports.salesByPayment.map((_, index) => (
                        <Cell key={`pay-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Not enough data to generate this report" />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* === 4. Sales by Staff (Table) === */}
      {loading.salesByStaff && !reports.salesByStaff ? (
        <TableSkeleton rows={5} />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sales by Staff</CardTitle>
            <CardDescription>Top 10 staff members by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.salesByStaff && reports.salesByStaff.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.salesByStaff.slice(0, 10).map((staff, i) => (
                      <TableRow key={staff.staffId}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {staff.staffName.charAt(0).toUpperCase()}
                            </div>
                            {staff.staffName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{staff.transactions}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(staff.totalSales)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState message="Not enough data to generate this report" />
            )}
          </CardContent>
        </Card>
      )}

      {/* === 5. Top Products (Table) === */}
      {loading.salesByProduct && !reports.salesByProduct ? (
        <TableSkeleton rows={5} />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Top 10 products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.salesByProduct && reports.salesByProduct.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.salesByProduct.slice(0, 10).map((product, i) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                          <span className="font-medium">{product.productName}</span>
                          <span className="text-xs text-muted-foreground">{product.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{product.quantitySold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState message="Not enough data to generate this report" />
            )}
          </CardContent>
        </Card>
      )}

      {/* === 6. Expenses by Category (Donut) + Expense Trend === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expenses by Category */}
        {loading.expensesByCategory && !reports.expensesByCategory ? (
          <PieChartSkeleton />
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Expenses by Category</CardTitle>
              <CardDescription>Breakdown of operating expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.expensesByCategory && reports.expensesByCategory.data.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reports.expensesByCategory.data}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {reports.expensesByCategory.data.map((_, index) => (
                          <Cell key={`exp-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Legend content={<CustomLegend />} payload={reports.expensesByCategory.data.map((item, i) => ({
                    value: item.category,
                    color: COLORS[i % COLORS.length],
                    payload: { percentage: item.percentage },
                  }))} />
                </>
              ) : (
                <EmptyState message="Not enough data to generate this report" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Expense Summary / Total */}
        {loading.expensesByCategory && !reports.expensesByCategory ? (
          <ChartSkeleton />
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
              <CardDescription>Detailed expense amounts by category</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.expensesByCategory && reports.expensesByCategory.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={reports.expensesByCategory.data}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `\u20A5${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {reports.expensesByCategory.data.map((_, index) => (
                        <Cell key={`expbar-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Not enough data to generate this report" />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* === 7. Top Customers (Table) === */}
      {loading.topCustomers && !reports.topCustomers ? (
        <TableSkeleton rows={5} />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
            <CardDescription>Customers ranked by total spending</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.topCustomers && reports.topCustomers.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.topCustomers.map((customer, i) => (
                      <TableRow key={customer.customerId}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {customer.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium">{customer.customerName}</span>
                              {customer.phone && (
                                <span className="block text-xs text-muted-foreground">{customer.phone}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{customer.transactions}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(customer.totalSpent)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState message="Not enough data to generate this report" />
            )}
          </CardContent>
        </Card>
      )}

      {/* === 8. Supplier Purchases (Table) === */}
      {loading.supplierPurchases && !reports.supplierPurchases ? (
        <TableSkeleton rows={3} />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Supplier Purchases</CardTitle>
            <CardDescription>Purchase summary by supplier for the period</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.supplierPurchases && reports.supplierPurchases.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Purchases</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.supplierPurchases.map((supplier, i) => (
                      <TableRow key={supplier.supplierId}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {supplier.supplierName.charAt(0).toUpperCase()}
                            </div>
                            {supplier.supplierName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{supplier.restockCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(supplier.totalPurchases)}</TableCell>
                        <TableCell className="text-right">
                          <span className={supplier.outstandingBalance > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                            {formatCurrency(supplier.outstandingBalance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState message="Not enough data to generate this report" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
