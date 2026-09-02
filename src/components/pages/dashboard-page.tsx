'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calculator,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  Plus,
  PackagePlus,
  Package,
  UserPlus,
  Receipt,
  ChevronRight,
  Store,
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
} from 'recharts';

// --- Types ---

interface DashboardData {
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
    product: {
      name: string;
      minStockLevel: number;
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
    customer: {
      id: string;
      name: string;
    } | null;
  }[];
  salesChart: { date: string; amount: number }[];
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PRODUCT_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

// --- Helpers ---

function formatCurrency(value: number): string {
  return `\u20A5${value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- Sub Components ---

function ChangeIndicator({ change, label }: { change: number; label: string }) {
  const isPositive = change >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {isPositive ? (
        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
      )}
      <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
        {Math.abs(change).toFixed(1)}%
      </span>
      <span className="text-muted-foreground">vs last month</span>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
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

function KPICard({
  icon: Icon,
  label,
  value,
  change,
  format = 'number',
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  change: number;
  format?: 'currency' | 'number' | 'decimal';
  iconBg: string;
}) {
  const displayValue =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'decimal'
        ? value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toLocaleString();

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
        <p className="text-2xl font-bold tracking-tight">{displayValue}</p>
        <div className="mt-1">
          <ChangeIndicator change={change} label={label} />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Custom Chart Tooltip ---

function SalesChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(item.value)} ({item.payload.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

// --- Main Component ---

export default function DashboardPage() {
  const { setCurrentPage } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState('30d');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Filter chart data based on period
  const getFilteredChartData = useCallback(() => {
    if (!data?.salesChart) return [];
    const now = new Date();
    let daysToSlice = 30;

    switch (chartPeriod) {
      case '7d':
        daysToSlice = 7;
        break;
      case '30d':
        daysToSlice = 30;
        break;
      case 'thisMonth': {
        daysToSlice = now.getDate();
        break;
      }
      case 'thisYear': {
        daysToSlice = Math.ceil(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)
        );
        break;
      }
    }
    return data.salesChart.slice(-daysToSlice);
  }, [data, chartPeriod]);

  // Empty state check
  const isEmpty =
    data &&
    data.totalSales === 0 &&
    data.totalTransactions === 0 &&
    data.totalCustomers === 0;

  // --- Error State ---
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchDashboard}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Empty State ---
  if (isEmpty) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Welcome to StorePOS!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Your dashboard is ready. Start by adding products, processing your first sale, or setting up your inventory.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setCurrentPage('pos')}>
                <Plus className="w-4 h-4 mr-2" />
                New Sale
              </Button>
              <Button variant="outline" onClick={() => setCurrentPage('products')}>
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" onClick={() => setCurrentPage('customers')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
              <Button variant="outline" onClick={() => setCurrentPage('inventory')}>
                <PackagePlus className="w-4 h-4 mr-2" />
                Restock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Loading State ---
  if (loading || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-12 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredChartData = getFilteredChartData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={DollarSign}
          label="Total Sales"
          value={data.totalSales}
          change={data.salesChange}
          format="currency"
          iconBg="bg-emerald-100 text-emerald-700"
        />
        <KPICard
          icon={ShoppingCart}
          label="Transactions"
          value={data.totalTransactions}
          change={data.transactionsChange}
          iconBg="bg-blue-100 text-blue-700"
        />
        <KPICard
          icon={TrendingUp}
          label="Total Profit"
          value={data.totalProfit}
          change={data.profitChange}
          format="currency"
          iconBg="bg-violet-100 text-violet-700"
        />
        <KPICard
          icon={Calculator}
          label="Avg Order Value"
          value={data.avgOrderValue}
          change={data.avgOrderValueChange}
          format="decimal"
          iconBg="bg-amber-100 text-amber-700"
        />
        <KPICard
          icon={Users}
          label="Customers"
          value={data.totalCustomers}
          change={data.customersChange}
          iconBg="bg-pink-100 text-pink-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Overview Area Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sales Overview</CardTitle>
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">This Week</SelectItem>
                  <SelectItem value="30d">This Month</SelectItem>
                  <SelectItem value="thisMonth">Month to Date</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `\u20A5${(v / 1000).toFixed(0)}k` : `\u20A5${v}`}
                  />
                  <Tooltip content={<SalesChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.salesByCategory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No sales data available
              </div>
            ) : (
              <div className="flex items-center gap-4 h-64">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {data.salesByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-40 space-y-2 max-h-64 overflow-y-auto">
                  {data.salesByCategory.map((cat, index) => (
                    <div key={cat.category} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-foreground font-medium">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Selling Products */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Top Selling Products</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-sm"
                  onClick={() => setCurrentPage('products')}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No sales data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length] }}
                      >
                        {product.productName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantitySold} sold
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Sales</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-sm"
                  onClick={() => setCurrentPage('sales')}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent sales
                </p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-medium text-muted-foreground pb-2 pr-4">
                          Transaction
                        </th>
                        <th className="text-left font-medium text-muted-foreground pb-2 pr-4 hidden sm:table-cell">
                          Customer
                        </th>
                        <th className="text-right font-medium text-muted-foreground pb-2 pr-4">
                          Amount
                        </th>
                        <th className="text-left font-medium text-muted-foreground pb-2 pr-4 hidden md:table-cell">
                          Payment
                        </th>
                        <th className="text-left font-medium text-muted-foreground pb-2 pr-4 hidden lg:table-cell">
                          Status
                        </th>
                        <th className="text-right font-medium text-muted-foreground pb-2">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 font-mono text-xs">
                            {sale.transactionNumber}
                          </td>
                          <td className="py-2.5 pr-4 hidden sm:table-cell">
                            {sale.customer?.name || 'Walk-in'}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-semibold">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="py-2.5 pr-4 hidden md:table-cell">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {sale.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 hidden lg:table-cell">
                            <Badge
                              variant={sale.status === 'completed' ? 'default' : 'secondary'}
                              className="capitalize text-xs"
                            >
                              {sale.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right text-muted-foreground text-xs whitespace-nowrap">
                            {formatDate(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Low Stock Alert */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Low Stock Alert</CardTitle>
              <Badge variant={data.lowStockProducts.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
                {data.lowStockProducts.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.lowStockProducts.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">All products are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.lowStockProducts.map((item) => {
                  const isOut = item.quantity === 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isOut ? 'bg-red-500' : 'bg-amber-500'}`}
                      >
                        {item.product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} / {item.product.minStockLevel} min
                        </p>
                      </div>
                      <Badge
                        variant={isOut ? 'destructive' : 'outline'}
                        className={`text-xs flex-shrink-0 ${!isOut ? 'border-amber-300 text-amber-700 bg-amber-50' : ''}`}
                      >
                        {isOut ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/5"
              onClick={() => setCurrentPage('pos')}
            >
              <Plus className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-medium">New Sale</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/5"
              onClick={() => setCurrentPage('products')}
            >
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium">Add Product</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/5"
              onClick={() => setCurrentPage('inventory')}
            >
              <PackagePlus className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-medium">Restock</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/5"
              onClick={() => setCurrentPage('customers')}
            >
              <UserPlus className="w-5 h-5 text-pink-600" />
              <span className="text-xs font-medium">Add Customer</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/5"
              onClick={() => setCurrentPage('expenses')}
            >
              <Receipt className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-medium">Add Expense</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
