'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Eye,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  ShoppingBag,
  ArrowLeftRight,
  Package,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// ==================== Types ====================

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
}

interface Sale {
  id: string;
  transactionNumber: string;
  customerId?: string | null;
  soldById: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  amountReceived?: number | null;
  changeAmount: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone?: string | null } | null;
  soldBy: { id: string; name: string };
  items?: SaleItem[];
  receipt?: { receiptNumber: string } | null;
}

interface SalesResponse {
  data: Sale[];
  total: number;
  page: number;
  pageSize: number;
}

interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

interface ReturnRecord {
  id: string;
  returnNumber: string;
  saleId: string;
  customerId?: string | null;
  processedById: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  sale?: { transactionNumber: string } | null;
  customer?: { name: string } | null;
  processedBy: { name: string };
  items?: ReturnItem[];
}

interface ReturnsResponse {
  data: ReturnRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
}

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `\u20B5${amount.toFixed(2)}`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const paymentMethodLabel = (method: string): string => {
  const map: Record<string, string> = {
    cash: 'Cash',
    mobile_money: 'Mobile Money',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    credit: 'Credit',
  };
  return map[method] || method;
};

const paymentMethodColor = (method: string): string => {
  const map: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    mobile_money: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    card: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    bank_transfer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    credit: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return map[method] || '';
};

const statusBadge = (status: string) => {
  if (status === 'completed') {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Completed</Badge>;
  }
  if (status === 'refunded') {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Refunded</Badge>;
  }
  if (status === 'partial_refund') {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Partial Refund</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
};

const RETURN_REASONS = [
  'Customer Changed Mind',
  'Damaged Product',
  'Incorrect Product',
  'Product Issue',
  'Other',
];

// ==================== Component ====================

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Active tab
  const [activeTab, setActiveTab] = useState('sales');

  // ---- Sales History State ----
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('all');
  const [salesStatusFilter, setSalesStatusFilter] = useState('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const salesPageSize = 10;

  // Staff list for filter
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // ---- Returns State ----
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsTotalPages, setReturnsTotalPages] = useState(1);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const returnsPageSize = 10;

  // ---- Dialogs ----
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItemInput[]>([]);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  // ==================== Fetch Sales ====================
  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams({
        page: salesPage.toString(),
        pageSize: salesPageSize.toString(),
      });
      if (salesSearch) params.set('search', salesSearch);
      if (salesStartDate) params.set('startDate', salesStartDate);
      if (salesEndDate) params.set('endDate', salesEndDate);
      if (salesPaymentFilter !== 'all') params.set('paymentMethod', salesPaymentFilter);
      if (salesStatusFilter !== 'all') params.set('status', salesStatusFilter);
      if (salesPersonFilter !== 'all') params.set('soldById', salesPersonFilter);

      const res = await fetch(`/api/sales?${params}`);
      if (!res.ok) throw new Error('Failed to fetch sales');
      const data: SalesResponse = await res.json();
      setSales(data.data);
      setSalesTotal(data.total);
      setSalesTotalPages(Math.max(1, Math.ceil(data.total / salesPageSize)));
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setSalesLoading(false);
    }
  }, [salesPage, salesSearch, salesStartDate, salesEndDate, salesPaymentFilter, salesStatusFilter, salesPersonFilter, salesPageSize]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Reset page when filters change
  useEffect(() => {
    setSalesPage(1);
  }, [salesSearch, salesStartDate, salesEndDate, salesPaymentFilter, salesStatusFilter, salesPersonFilter]);

  // ==================== Fetch Staff ====================
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/staff');
        if (res.ok) {
          const data = await res.json();
          setStaffList(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch {
        // silently fail
      }
    };
    fetchStaff();
  }, []);

  // ==================== Fetch Returns ====================
  const fetchReturns = useCallback(async () => {
    setReturnsLoading(true);
    try {
      const params = new URLSearchParams({
        page: returnsPage.toString(),
        pageSize: returnsPageSize.toString(),
      });
      const res = await fetch(`/api/returns?${params}`);
      if (!res.ok) throw new Error('Failed to fetch returns');
      const data: ReturnsResponse = await res.json();
      setReturns(data.data);
      setReturnsTotal(data.total);
      setReturnsTotalPages(Math.max(1, Math.ceil(data.total / returnsPageSize)));
    } catch {
      toast.error('Failed to load returns');
    } finally {
      setReturnsLoading(false);
    }
  }, [returnsPage, returnsPageSize]);

  useEffect(() => {
    if (activeTab === 'returns') {
      fetchReturns();
    }
  }, [activeTab, fetchReturns]);

  // ==================== Sale Detail ====================
  const openDetailDialog = async (sale: Sale) => {
    setDetailSale(null);
    setDetailLoading(true);
    setDetailDialogOpen(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}`);
      if (!res.ok) throw new Error('Failed to fetch sale details');
      const data: Sale = await res.json();
      setDetailSale(data);
    } catch {
      toast.error('Failed to load sale details');
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ==================== Receipt ====================
  const openReceiptDialog = () => {
    setReceiptDialogOpen(true);
  };

  const handlePrintReceipt = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 20px; font-size: 12px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
            .text-right { text-align: right; }
            .mt-4 { margin-top: 16px; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ==================== Process Return ====================
  const openReturnDialog = () => {
    if (!detailSale?.items) return;
    setReturnReason('');
    setReturnNotes('');
    setReturnItems(
      detailSale.items.map((item) => ({
        saleItemId: item.id,
        quantity: 0,
      }))
    );
    setReturnDialogOpen(true);
  };

  const updateReturnQty = (index: number, qty: number) => {
    const maxQty = detailSale?.items?.[index]?.quantity ?? 0;
    const clamped = Math.max(0, Math.min(qty, maxQty));
    setReturnItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: clamped };
      return updated;
    });
  };

  const calculatedRefundTotal = () => {
    if (!detailSale?.items) return 0;
    return detailSale.items.reduce((sum, item, i) => {
      return sum + (returnItems[i]?.quantity ?? 0) * item.unitPrice;
    }, 0);
  };

  const handleSubmitReturn = async () => {
    if (!detailSale) return;
    const itemsToReturn = returnItems.filter((r) => r.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }
    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    setReturnSubmitting(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: detailSale.id,
          processedById: user?.id,
          reason: returnReason,
          notes: returnNotes || undefined,
          items: itemsToReturn,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process return');
      }
      toast.success('Return processed successfully');
      setReturnDialogOpen(false);
      setDetailDialogOpen(false);
      fetchSales();
      if (activeTab === 'returns') fetchReturns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // ==================== Receipt Content ====================
  const renderReceiptContent = (sale: Sale) => (
    <div ref={receiptRef} className="font-mono text-sm space-y-1">
      {/* Business Info */}
      <div className="center bold text-base">StorePOS</div>
      <div className="center">Accra, Ghana</div>
      <div className="center">Tel: +233 XX XXX XXXX</div>
      <div className="separator" />

      {/* Receipt Info */}
      <div className="flex justify-between">
        <span>Receipt #:</span>
        <span className="bold">{sale.receipt?.receiptNumber || sale.transactionNumber}</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{formatDateTime(sale.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span>Sales Person:</span>
        <span>{sale.soldBy.name}</span>
      </div>
      {sale.customer && (
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{sale.customer.name}</span>
        </div>
      )}
      <div className="separator" />

      {/* Items */}
      <table>
        <thead>
          <tr className="bold">
            <td>Item</td>
            <td className="text-right">Qty</td>
            <td className="text-right">Price</td>
            <td className="text-right">Total</td>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item) => (
            <tr key={item.id}>
              <td className="max-w-[100px] truncate" title={item.productName}>{item.productName}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="text-right">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="separator" />

      {/* Totals */}
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>{formatCurrency(sale.subtotal)}</span>
      </div>
      {sale.discountAmount > 0 && (
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-{formatCurrency(sale.discountAmount)}</span>
        </div>
      )}
      {sale.taxAmount > 0 && (
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
      )}
      <div className="separator" />
      <div className="flex justify-between bold text-base">
        <span>TOTAL:</span>
        <span>{formatCurrency(sale.totalAmount)}</span>
      </div>
      <div className="separator" />

      {/* Payment */}
      <div className="flex justify-between">
        <span>Payment:</span>
        <span>{paymentMethodLabel(sale.paymentMethod)}</span>
      </div>
      {sale.amountReceived != null && (
        <div className="flex justify-between">
          <span>Amount Received:</span>
          <span>{formatCurrency(sale.amountReceived)}</span>
        </div>
      )}
      {sale.changeAmount > 0 && (
        <div className="flex justify-between">
          <span>Change:</span>
          <span>{formatCurrency(sale.changeAmount)}</span>
        </div>
      )}

      <div className="separator mt-4" />
      <div className="center text-xs mt-2">Thank you for your purchase!</div>
    </div>
  );

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales & Returns</h1>
        <p className="text-muted-foreground text-sm">View sales history and process returns</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales" className="gap-2">
            <Receipt className="h-4 w-4" />
            Sales History
          </TabsTrigger>
          <TabsTrigger value="returns" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Returns
          </TabsTrigger>
        </TabsList>

        {/* ==================== Sales History Tab ==================== */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transaction # or customer..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">From:</Label>
              <Input
                type="date"
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="w-[150px]"
              />
              <Label className="text-sm whitespace-nowrap">To:</Label>
              <Input
                type="date"
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="w-[150px]"
              />
            </div>

            {/* Payment Filter */}
            <Select value={salesPaymentFilter} onValueChange={setSalesPaymentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={salesStatusFilter} onValueChange={setSalesStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partial_refund">Partial Refund</SelectItem>
              </SelectContent>
            </Select>

            {/* Sales Person Filter */}
            <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sales Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Transaction #</TableHead>
                  <TableHead className="min-w-[130px]">Customer</TableHead>
                  <TableHead className="min-w-[130px] hidden md:table-cell">Sales Person</TableHead>
                  <TableHead className="text-center min-w-[80px]">Items</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[110px]">Payment</TableHead>
                  <TableHead className="min-w-[110px]">Status</TableHead>
                  <TableHead className="min-w-[110px] hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right min-w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48">
                      <div className="flex flex-col items-center justify-center text-center gap-2">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">No sales found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {sale.transactionNumber}
                      </TableCell>
                      <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="hidden md:table-cell">{sale.soldBy.name}</TableCell>
                      <TableCell className="text-center">{sale.items?.length ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentMethodColor(sale.paymentMethod)}`}>
                          {paymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(sale.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatDate(sale.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDetailDialog(sale)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!salesLoading && sales.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((salesPage - 1) * salesPageSize) + 1}–{Math.min(salesPage * salesPageSize, salesTotal)} of {salesTotal} sales
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={salesPage <= 1}
                  onClick={() => setSalesPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Page {salesPage} of {salesTotalPages}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={salesPage >= salesTotalPages}
                  onClick={() => setSalesPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== Returns Tab ==================== */}
        <TabsContent value="returns" className="space-y-4 mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Return #</TableHead>
                  <TableHead className="min-w-[150px]">Original Transaction</TableHead>
                  <TableHead className="min-w-[130px]">Customer</TableHead>
                  <TableHead className="text-center min-w-[80px]">Items</TableHead>
                  <TableHead className="text-right min-w-[110px]">Refund Amount</TableHead>
                  <TableHead className="min-w-[160px]">Reason</TableHead>
                  <TableHead className="min-w-[110px] hidden md:table-cell">Date</TableHead>
                  <TableHead className="min-w-[120px] hidden lg:table-cell">Processed By</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48">
                      <div className="flex flex-col items-center justify-center text-center gap-2">
                        <ArrowLeftRight className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">No returns yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {ret.returnNumber}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ret.sale?.transactionNumber || '—'}
                      </TableCell>
                      <TableCell>{ret.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="text-center">{ret.items?.length ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ret.refundAmount)}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate" title={ret.reason}>
                        {ret.reason}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(ret.createdAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{ret.processedBy.name}</TableCell>
                      <TableCell>{statusBadge(ret.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!returnsLoading && returns.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((returnsPage - 1) * returnsPageSize) + 1}–{Math.min(returnsPage * returnsPageSize, returnsTotal)} of {returnsTotal} returns
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={returnsPage <= 1}
                  onClick={() => setReturnsPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Page {returnsPage} of {returnsTotalPages}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={returnsPage >= returnsTotalPages}
                  onClick={() => setReturnsPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Sale Detail Dialog ==================== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="font-mono text-lg">{detailSale?.transactionNumber}</DialogTitle>
              {detailSale && statusBadge(detailSale.status)}
            </div>
            <DialogDescription>{detailSale ? formatDateTime(detailSale.createdAt) : ''}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : detailSale ? (
            <div className="space-y-5">
              {/* Customer & Sales Person Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{detailSale.customer?.name || 'Walk-in'}</p>
                    {detailSale.customer?.phone && (
                      <p className="text-sm text-muted-foreground">{detailSale.customer.phone}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Sales Person</p>
                    <p className="font-medium">{detailSale.soldBy.name}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-medium mb-2">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Cost Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSale.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">{formatCurrency(item.costPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-full max-w-[260px] space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(detailSale.subtotal)}</span>
                  </div>
                  {detailSale.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span>-{formatCurrency(detailSale.discountAmount)}</span>
                    </div>
                  )}
                  {detailSale.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(detailSale.taxAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(detailSale.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentMethodColor(detailSale.paymentMethod)}`}>
                    {paymentMethodLabel(detailSale.paymentMethod)}
                  </span>
                </div>
                {detailSale.amountReceived != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Received</p>
                    <p className="font-medium">{formatCurrency(detailSale.amountReceived)}</p>
                  </div>
                )}
                {detailSale.changeAmount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Change</p>
                    <p className="font-medium">{formatCurrency(detailSale.changeAmount)}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {detailSale.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{detailSale.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={openReceiptDialog}>
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
                <Button variant="outline" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                {isAdmin && detailSale.status === 'completed' && (
                  <Button variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={openReturnDialog}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Process Return
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ==================== Receipt View Dialog ==================== */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Transaction receipt preview</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white dark:bg-zinc-950">
            {detailSale && renderReceiptContent(detailSale)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Process Return Dialog ==================== */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Return for {detailSale?.transactionNumber}
            </DialogDescription>
          </DialogHeader>

          {detailSale && (
            <div className="space-y-4">
              {/* Original Sale Items */}
              <div>
                <h3 className="text-sm font-medium mb-2">Sale Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Sold Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-center">Return Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSale.items?.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={returnItems[idx]?.quantity ?? 0}
                              onChange={(e) => updateReturnQty(idx, parseInt(e.target.value) || 0)}
                              className="w-20 text-center mx-auto"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Return Reason *</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Optional notes about this return..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Refund Total */}
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Refund Total</span>
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(calculatedRefundTotal())}
                  </span>
                </CardContent>
              </Card>

              {/* Submit */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReturn}
                  disabled={returnSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {returnSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Return
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
