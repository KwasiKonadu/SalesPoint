'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Package,
  PackageX,
  AlertTriangle,
  TrendingDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MinusCircle,
  Eye,
  Loader2,
  X,
  RefreshCw,
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Clock,
  DollarSign,
  Boxes,
  Trash2,
  FileText,
  CalendarDays,
  User,
  Truck,
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
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

// ==================== Types ====================

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  stockStatus: string;
  product: {
    id: string;
    name: string;
    sku: string;
    image?: string | null;
    costPrice: number;
    minStockLevel: number;
    category?: { id: string; name: string } | null;
    unit?: { id: string; name: string; shortName?: string | null } | null;
  };
}

interface InventoryResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface InventorySummary {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface StockMovement {
  id: string;
  inventoryId: string;
  type: string;
  quantity: number;
  note?: string | null;
  referenceId?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: { id: string; name: string } | null;
    unit?: { id: string; name: string; shortName?: string | null } | null;
  };
}

interface StockMovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  pageSize: number;
}

interface RestockItem {
  id: string;
  restockId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  expiryDate?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Restock {
  id: string;
  supplierId?: string | null;
  reference?: string | null;
  batchNumber?: string | null;
  dateReceived: string;
  expiryDate?: string | null;
  notes?: string | null;
  paymentStatus: string;
  totalCost: number;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    businessName: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items?: RestockItem[];
  _count?: { items: number };
}

interface RestockListResponse {
  data: Restock[];
  total: number;
  page: number;
  pageSize: number;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  businessName: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
}

interface RestockFormItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  expiryDate: string;
}

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `\u20B5${amount.toFixed(2)}`;
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

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const PRODUCT_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

const getProductColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRODUCT_COLORS[Math.abs(hash) % PRODUCT_COLORS.length];
};

const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; addition: boolean }> = {
  initial_stock: { label: 'Initial Stock', color: 'bg-blue-100 text-blue-700', addition: true },
  restock: { label: 'Restock', color: 'bg-emerald-100 text-emerald-700', addition: true },
  sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700', addition: false },
  return: { label: 'Return', color: 'bg-purple-100 text-purple-700', addition: true },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-700', addition: false },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700', addition: false },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', addition: false },
  adjustment: { label: 'Adjustment', color: 'bg-gray-100 text-gray-700', addition: false },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  partially_paid: { label: 'Partially Paid', color: 'bg-amber-100 text-amber-700' },
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700' },
};

// ==================== Sub-Components ====================

function ProductImage({ name, image, size = 'sm' }: { name: string; image?: string | null; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm';
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClass} rounded-lg object-cover`}
      />
    );
  }
  return (
    <div className={`${sizeClass} ${getProductColor(name)} rounded-lg flex items-center justify-center text-white font-semibold shrink-0`}>
      {getInitial(name)}
    </div>
  );
}

function StockStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'in_stock':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">In Stock</Badge>;
    case 'low_stock':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Low Stock</Badge>;
    case 'out_of_stock':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out of Stock</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const s = Math.max(2, page - 1);
      const e = Math.min(totalPages - 1, page + 1);
      for (let i = s; i <= e; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPages().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={page === p ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
// ==================== Summary Cards ====================

function SummaryCards({ summary, loading }: { summary: InventorySummary | null; loading: boolean }) {
  const cards = [
    {
      label: 'Total Inventory Value',
      value: summary ? formatCurrency(summary.totalValue) : '—',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Products',
      value: summary ? summary.totalProducts.toString() : '—',
      icon: Boxes,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Low Stock Items',
      value: summary ? summary.lowStockCount.toString() : '—',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Out of Stock Items',
      value: summary ? summary.outOfStockCount.toString() : '—',
      icon: PackageX,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`${c.bg} p-1.5 rounded-md`}>
                      <Icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{c.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ==================== Adjust Stock Dialog ====================

function AdjustStockDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('damaged');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedProductId('');
      setAdjustmentType('damaged');
      setQuantity('');
      setNote('');
      setProductSearch('');
      return;
    }
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?status=active&pageSize=200');
        const json = await res.json();
        setProducts(json.data || []);
      } catch {
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, [open]);

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: parseInt(quantity),
          type: adjustmentType,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to adjust stock');
      }
      toast.success('Stock adjusted successfully');
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Deduct stock for damaged, expired, lost items, or general adjustment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product Select */}
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Search and select a product..." />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <ScrollArea className="max-h-48">
                  {filteredProducts.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground text-center">No products found</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} <span className="text-muted-foreground">({p.sku})</span>
                      </SelectItem>
                    ))
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type *</Label>
            <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType} className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="damaged" id="damaged" />
                <Label htmlFor="damaged" className="font-normal cursor-pointer">Damaged</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expired" id="expired" />
                <Label htmlFor="expired" className="font-normal cursor-pointer">Expired</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lost" id="lost" />
                <Label htmlFor="lost" className="font-normal cursor-pointer">Lost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adjustment" id="adjustment" />
                <Label htmlFor="adjustment" className="font-normal cursor-pointer">Adjustment</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedProductId || !quantity}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== New Restock Dialog ====================

function NewRestockDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [items, setItems] = useState<RestockFormItem[]>([
    { productId: '', productName: '', quantity: 1, costPrice: 0, expiryDate: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSupplierId('');
      setReference('');
      setBatchNumber('');
      setDateReceived(new Date().toISOString().split('T')[0]);
      setExpiryDate('');
      setNotes('');
      setPaymentStatus('unpaid');
      setItems([{ productId: '', productName: '', quantity: 1, costPrice: 0, expiryDate: '' }]);
      setProductSearch('');
      return;
    }
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          fetch('/api/suppliers?pageSize=100'),
          fetch('/api/products?status=active&pageSize=200'),
        ]);
        const supJson = await supRes.json();
        const prodJson = await prodRes.json();
        setSuppliers(supJson.data || []);
        setProducts(prodJson.data || []);
      } catch {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [open]);

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const updateItem = (index: number, field: keyof RestockFormItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as Record<string, string | number>)[field] = value;
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productName = prod ? prod.name : '';
      if (prod) updated[index].costPrice = prod.costPrice;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, costPrice: 0, expiryDate: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  const canProceed = step === 1;
  const canSubmit = step === 2 && items.some((i) => i.productId && i.quantity > 0);

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          supplierId: supplierId || null,
          reference: reference || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate || null,
          dateReceived,
          notes: notes || null,
          paymentStatus,
          items: validItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            costPrice: i.costPrice,
            expiryDate: i.expiryDate || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create restock');
      }
      toast.success('Restock created successfully');
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create restock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Restock</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Step 1: Enter restock details and select supplier.'
              : 'Step 2: Add products and quantities.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <ScrollArea className="max-h-[55vh] pr-3">
          {step === 1 ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reference #</Label>
                  <Input placeholder="e.g. PO-2024-001" value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input placeholder="e.g. BN-001" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Received *</Label>
                  <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="space-y-2">
                    <Label>Product {index + 1} *</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => updateItem(index, 'productId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search and select a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <ScrollArea className="max-h-40">
                          {filteredProducts.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground text-center">No products found</p>
                          ) : (
                            filteredProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} <span className="text-muted-foreground">({p.sku})</span>
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost Price (₵) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costPrice}
                        onChange={(e) => updateItem(index, 'costPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Item Expiry Date</Label>
                    <Input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addItem} className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Running Total</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>
              Next: Add Products
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Restock
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Restock Detail Dialog ====================

function RestockDetailDialog({
  open,
  onOpenChange,
  restockId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restockId: string | null;
}) {
  const [restock, setRestock] = useState<Restock | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !restockId) {
      setRestock(null);
      return;
    }
    const fetchRestock = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restock/${restockId}`);
        if (!res.ok) throw new Error('Failed to fetch restock');
        const data = await res.json();
        setRestock(data);
      } catch {
        toast.error('Failed to load restock details');
      } finally {
        setLoading(false);
      }
    };
    fetchRestock();
  }, [open, restockId]);

  const payConfig = PAYMENT_STATUS_CONFIG[restock?.paymentStatus || 'unpaid'] || PAYMENT_STATUS_CONFIG.unpaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Restock Details</DialogTitle>
          <DialogDescription>
            {restock?.reference || `Restock #${restockId?.slice(0, 8)}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : restock ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-2">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="text-sm font-medium">{restock.supplier?.businessName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date Received</p>
                  <p className="text-sm font-medium">{formatDateTime(restock.dateReceived)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="text-sm font-medium">{restock.batchNumber || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <Badge className={payConfig.color}>{payConfig.label}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium">{restock.createdBy?.name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="text-sm font-medium">{restock.expiryDate ? formatDate(restock.expiryDate) : '—'}</p>
                </div>
              </div>

              {restock.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{restock.notes}</p>
                </div>
              )}

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Items ({restock.items?.length || 0})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restock.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(item.costPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(item.quantity * item.costPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-semibold">Total Cost</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(restock.totalCost)}</span>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Inventory Page ====================

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('overview');

  // === Shared Data ===
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // === Stock Overview State ===
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  // === Stock Movements State ===
  const [movementsData, setMovementsData] = useState<StockMovement[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementType, setMovementType] = useState('all');
  const [movementProductFilter, setMovementProductFilter] = useState('all');
  const [movementStartDate, setMovementStartDate] = useState('');
  const [movementEndDate, setMovementEndDate] = useState('');

  // === Restock State ===
  const [restockData, setRestockData] = useState<Restock[]>([]);
  const [restockTotal, setRestockTotal] = useState(0);
  const [restockPage, setRestockPage] = useState(1);
  const [restockLoading, setRestockLoading] = useState(true);
  const [restockSupplierFilter, setRestockSupplierFilter] = useState('all');
  const [restockPaymentFilter, setRestockPaymentFilter] = useState('all');
  const [newRestockOpen, setNewRestockOpen] = useState(false);
  const [detailRestockId, setDetailRestockId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // === Fetch shared data ===
  useEffect(() => {
    const fetchShared = async () => {
      try {
        const [catRes, supRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/suppliers?pageSize=100'),
          fetch('/api/products?status=active&pageSize=200'),
        ]);
        const [catJson, supJson, prodJson] = await Promise.all([
          catRes.json(),
          supRes.json(),
          prodRes.json(),
        ]);
        setCategories(catJson.data || []);
        setSuppliers(supJson.data || []);
        setAllProducts(prodJson.data || []);
      } catch {
        // Non-critical
      }
    };
    fetchShared();
  }, []);

  // === Fetch inventory (Stock Overview) ===
  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: inventoryPage.toString(),
        pageSize: '15',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const json: InventoryResponse = await res.json();
      setInventoryData(json.data || []);
      setInventoryTotal(json.total || 0);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  }, [inventoryPage, debouncedSearch, selectedCategory, selectedStatus]);

  // === Fetch summary ===
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      // Fetch all inventory to compute summary
      const res = await fetch('/api/inventory?pageSize=500');
      const json: InventoryResponse = await res.json();
      const all = json.data || [];
      const totalValue = all.reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0);
      const lowStock = all.filter((i) => i.stockStatus === 'low_stock').length;
      const outOfStock = all.filter((i) => i.stockStatus === 'out_of_stock').length;
      setSummary({
        totalValue,
        totalProducts: json.total || 0,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
      });
    } catch {
      // Non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchInventory();
      if (!summary) fetchSummary();
    }
  }, [activeTab, fetchInventory, fetchSummary, summary]);

  // Reset inventory page on filter change
  useEffect(() => {
    setInventoryPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  // === Fetch stock movements ===
  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams({
        page: movementsPage.toString(),
        pageSize: '15',
      });
      if (movementType !== 'all') params.set('type', movementType);
      if (movementProductFilter !== 'all') params.set('productId', movementProductFilter);
      if (movementStartDate) params.set('startDate', movementStartDate);
      if (movementEndDate) params.set('endDate', movementEndDate);

      const res = await fetch(`/api/stock-movements?${params.toString()}`);
      const json: StockMovementsResponse = await res.json();
      setMovementsData(json.data || []);
      setMovementsTotal(json.total || 0);
    } catch {
      toast.error('Failed to load stock movements');
    } finally {
      setMovementsLoading(false);
    }
  }, [movementsPage, movementType, movementProductFilter, movementStartDate, movementEndDate]);

  useEffect(() => {
    if (activeTab === 'movements') fetchMovements();
  }, [activeTab, fetchMovements]);

  useEffect(() => {
    setMovementsPage(1);
  }, [movementType, movementProductFilter, movementStartDate, movementEndDate]);

  // === Fetch restocks ===
  const fetchRestocks = useCallback(async () => {
    setRestockLoading(true);
    try {
      const params = new URLSearchParams({
        page: restockPage.toString(),
        pageSize: '15',
      });
      if (restockSupplierFilter !== 'all') params.set('supplierId', restockSupplierFilter);
      if (restockPaymentFilter !== 'all') params.set('paymentStatus', restockPaymentFilter);

      const res = await fetch(`/api/restock?${params.toString()}`);
      const json: RestockListResponse = await res.json();
      setRestockData(json.data || []);
      setRestockTotal(json.total || 0);
    } catch {
      toast.error('Failed to load restocks');
    } finally {
      setRestockLoading(false);
    }
  }, [restockPage, restockSupplierFilter, restockPaymentFilter]);

  useEffect(() => {
    if (activeTab === 'restock') fetchRestocks();
  }, [activeTab, fetchRestocks]);

  useEffect(() => {
    setRestockPage(1);
  }, [restockSupplierFilter, restockPaymentFilter]);

  // === Sort handler ===
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedInventory = [...inventoryData].sort((a, b) => {
    let valA: string | number;
    let valB: string | number;
    switch (sortField) {
      case 'name':
        valA = a.product.name.toLowerCase();
        valB = b.product.name.toLowerCase();
        break;
      case 'category':
        valA = a.product.category?.name || '';
        valB = b.product.category?.name || '';
        break;
      case 'quantity':
        valA = a.quantity;
        valB = b.quantity;
        break;
      case 'stockValue':
        valA = a.quantity * a.product.costPrice;
        valB = b.quantity * b.product.costPrice;
        break;
      case 'status':
        valA = a.stockStatus;
        valB = b.stockStatus;
        break;
      default:
        valA = a.updatedAt;
        valB = b.updatedAt;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // === View restock detail ===
  const viewRestockDetail = (id: string) => {
    setDetailRestockId(id);
    setDetailDialogOpen(true);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Manage stock levels, track movements, and handle restocks.</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stock Overview</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Stock Movements</span>
          </TabsTrigger>
          <TabsTrigger value="restock" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Restock</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: STOCK OVERVIEW ==================== */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          {/* Summary Cards */}
          <SummaryCards summary={summary} loading={summaryLoading} />

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pills */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map((s) => {
                  const labels: Record<string, string> = {
                    all: 'All',
                    in_stock: 'In Stock',
                    low_stock: 'Low',
                    out_of_stock: 'Out',
                  };
                  return (
                    <Button
                      key={s}
                      variant={selectedStatus === s ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => setSelectedStatus(s)}
                    >
                      {labels[s]}
                    </Button>
                  );
                })}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setAdjustDialogOpen(true)}>
                    <MinusCircle className="h-4 w-4 mr-1.5" />
                    Adjust Stock
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setActiveTab('restock'); setNewRestockOpen(true); }}>
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Restock
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Product <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1">
                        Category <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('quantity')}>
                      <div className="flex items-center justify-end gap-1">
                        Current Stock <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Min Stock</TableHead>
                    <TableHead className="cursor-pointer select-none text-right hidden lg:table-cell" onClick={() => handleSort('stockValue')}>
                      <div className="flex items-center justify-end gap-1">
                        Stock Value <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="cursor-pointer select-none hidden xl:table-cell" onClick={() => handleSort('updatedAt')}>
                      <div className="flex items-center gap-1">
                        Last Updated <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-9 h-9 rounded-lg" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                        <TableCell className="text-right hidden lg:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell className="text-right hidden lg:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-muted-foreground text-sm">
                            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                              ? 'No products match your filters.'
                              : 'No inventory data yet.'}
                          </p>
                          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedStatus('all');
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedInventory.map((item) => {
                      const stockValue = item.quantity * item.product.costPrice;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <ProductImage name={item.product.name} image={item.product.image} />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.product.category?.name || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-lg font-bold tabular-nums ${
                              item.quantity === 0
                                ? 'text-red-600'
                                : item.stockStatus === 'low_stock'
                                ? 'text-amber-600'
                                : ''
                            }`}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell tabular-nums">
                            {item.product.minStockLevel}
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell tabular-nums">
                            {formatCurrency(stockValue)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <StockStatusBadge status={item.stockStatus} />
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                            {formatDateTime(item.updatedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <PaginationBar
                page={inventoryPage}
                pageSize={15}
                total={inventoryTotal}
                onPageChange={setInventoryPage}
              />
            </CardContent>
          </Card>

          {/* Adjust Stock Dialog */}
          <AdjustStockDialog
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
            onSubmitted={() => { fetchInventory(); fetchSummary(); }}
          />
        </TabsContent>

        {/* ==================== TAB 2: STOCK MOVEMENTS ==================== */}
        <TabsContent value="movements" className="mt-6 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              {/* Date range */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={movementStartDate}
                    onChange={(e) => setMovementStartDate(e.target.value)}
                    className="pl-9 w-[150px]"
                    placeholder="From"
                  />
                </div>
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  value={movementEndDate}
                  onChange={(e) => setMovementEndDate(e.target.value)}
                  className="w-[150px]"
                  placeholder="To"
                />
              </div>

              {/* Product filter */}
              <Select value={movementProductFilter} onValueChange={setMovementProductFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground">({p.sku})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movement type filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
              {['all', 'initial_stock', 'restock', 'sale', 'return', 'damaged', 'expired', 'lost', 'adjustment'].map((t) => {
                const config = MOVEMENT_TYPE_CONFIG[t];
                const label = t === 'all' ? 'All' : config?.label || t;
                return (
                  <Button
                    key={t}
                    variant={movementType === t ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setMovementType(t)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Date/Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="hidden lg:table-cell">Reference</TableHead>
                    <TableHead className="hidden xl:table-cell">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      </TableRow>
                    ))
                  ) : movementsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-muted-foreground text-sm">
                            No stock movements found.
                          </p>
                          {(movementType !== 'all' || movementProductFilter !== 'all' || movementStartDate || movementEndDate) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMovementType('all');
                                setMovementProductFilter('all');
                                setMovementStartDate('');
                                setMovementEndDate('');
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movementsData.map((m) => {
                      const config = MOVEMENT_TYPE_CONFIG[m.type] || {
                        label: m.type,
                        color: 'bg-gray-100 text-gray-700',
                        addition: false,
                      };
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {formatDateTime(m.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{m.product.name}</p>
                              <p className="text-xs text-muted-foreground">{m.product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={`${config.color} hover:${config.color.split(' ')[0]}`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold tabular-nums ${config.addition ? 'text-emerald-600' : 'text-red-600'}`}>
                              {config.addition ? '+' : '-'}{m.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {m.referenceId ? m.referenceId.slice(0, 12) : '—'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-muted-foreground text-sm truncate max-w-[200px]">
                            {m.note || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <PaginationBar
                page={movementsPage}
                pageSize={15}
                total={movementsTotal}
                onPageChange={setMovementsPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 3: RESTOCK ==================== */}
        <TabsContent value="restock" className="mt-6 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
              {/* Supplier filter */}
              <Select value={restockSupplierFilter} onValueChange={setRestockSupplierFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.businessName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment status filter */}
              <Select value={restockPaymentFilter} onValueChange={setRestockPaymentFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <Button onClick={() => setNewRestockOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Restock
              </Button>
            )}
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference #</TableHead>
                    <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Items</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restockLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : restockData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Truck className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-muted-foreground text-sm">
                            {restockSupplierFilter !== 'all' || restockPaymentFilter !== 'all'
                              ? 'No restocks match your filters.'
                              : 'No restocks recorded yet.'}
                          </p>
                          {isAdmin && (
                            <Button size="sm" onClick={() => setNewRestockOpen(true)}>
                              <Plus className="h-4 w-4 mr-1.5" />
                              Create First Restock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    restockData.map((r) => {
                      const payConfig = PAYMENT_STATUS_CONFIG[r.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-sm">
                            {r.reference || `#${r.id.slice(0, 8)}`}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {r.supplier?.businessName || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {formatDate(r.dateReceived)}
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell tabular-nums">
                            {r._count?.items || r.items?.length || 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(r.totalCost)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={payConfig.color}>{payConfig.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewRestockDetail(r.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <PaginationBar
                page={restockPage}
                pageSize={15}
                total={restockTotal}
                onPageChange={setRestockPage}
              />
            </CardContent>
          </Card>

          {/* New Restock Dialog */}
          <NewRestockDialog
            open={newRestockOpen}
            onOpenChange={setNewRestockOpen}
            onSubmitted={fetchRestocks}
          />

          {/* Restock Detail Dialog */}
          <RestockDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            restockId={detailRestockId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
