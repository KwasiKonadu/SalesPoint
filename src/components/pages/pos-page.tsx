'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Trash2,
  CheckCircle2,
  Printer,
  Download,
  Send,
  ChevronRight,
  CircleDot,
  AlertCircle,
  RotateCcw,
  UserPlus,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// ==================== Types ====================

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  image?: string | null;
  categoryId?: string | null;
  category?: { name: string } | null;
  inventory?: { quantity: number } | null;
  productType?: { tracksStock: boolean } | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleResponse {
  id: string;
  transactionNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived?: number | null;
  changeAmount: number;
  customer?: { name: string } | null;
  soldBy: { name: string };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  createdAt: string;
}

type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'credit';

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `₵${amount.toFixed(2)}`;
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="size-4" /> },
  { value: 'mobile_money', label: 'Mobile Money', icon: <Smartphone className="size-4" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="size-4" /> },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 className="size-4" /> },
  { value: 'credit', label: 'Credit', icon: <Wallet className="size-4" /> },
];

// ==================== Component ====================

export default function POSPage() {
  const { user } = useAuth();

  // ---- Data state ----
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // ---- Filter state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // ---- Cart state ----
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // ---- Dialog state ----
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [sendReceiptOpen, setSendReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);

  // ---- Checkout state ----
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ---- Add customer state ----
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // ---- Send receipt state ----
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [sendTo, setSendTo] = useState('');

  // ---- Ref for receipt printing ----
  const receiptRef = useRef<HTMLDivElement>(null);

  // ==================== Data Fetching ====================

  const fetchProducts = useCallback(async (search = '', categoryId: string | null = null) => {
    try {
      setProductsError(null);
      const params = new URLSearchParams({ status: 'active' });
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.data || data || []);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [fetchProducts, fetchCategories, fetchCustomers]);

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchDebounce) clearTimeout(searchDebounce);
    const timeout = setTimeout(() => {
      setProductsLoading(true);
      fetchProducts(value, selectedCategoryId);
    }, 300);
    setSearchDebounce(timeout);
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setProductsLoading(true);
    fetchProducts(searchQuery, categoryId);
  };

  // ==================== Cart Logic ====================

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Check stock limit
        const tracksStock = product.productType?.tracksStock !== false;
        const stockQty = product.inventory?.quantity ?? 0;
        if (tracksStock && existing.quantity >= stockQty) {
          toast.error('Not enough stock', { description: `Only ${stockQty} units available` });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Check if product has stock
      const tracksStock = product.productType?.tracksStock !== false;
      const stockQty = product.inventory?.quantity ?? 0;
      if (tracksStock && stockQty <= 0) {
        toast.error('Out of stock', { description: `${product.name} is currently unavailable` });
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Check stock limit for increase
          if (delta > 0) {
            const tracksStock = item.product.productType?.tracksStock !== false;
            const stockQty = item.product.inventory?.quantity ?? 0;
            if (tracksStock && newQty > stockQty) {
              toast.error('Not enough stock', { description: `Only ${stockQty} units available` });
              return item;
            }
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
    setSelectedCustomer(null);
  };

  // ==================== Cart Calculations ====================

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const discountAmount = (subtotal * discountPercent) / 100;

  // Simple tax: apply 0% by default (could be fetched from settings)
  const taxRate = 0;
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;

  const total = subtotal - discountAmount + taxAmount;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const changeAmount =
    paymentMethod === 'cash' && amountReceived
      ? Math.max(0, parseFloat(amountReceived) - total)
      : 0;

  // ==================== Checkout ====================

  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentMethod('cash');
    setAmountReceived('');
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < total) {
        toast.error('Invalid amount', { description: 'Amount received must be at least ' + formatCurrency(total) });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const body = {
        soldById: user.id,
        customerId: selectedCustomer?.id || null,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sale failed');
      }

      const sale = await res.json();
      setLastSale(sale);
      setCheckoutOpen(false);
      setReceiptOpen(true);
      toast.success('Sale completed!', { description: sale.transactionNumber });
    } catch (err) {
      toast.error('Sale failed', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setReceiptOpen(false);
    setLastSale(null);
    setCartItems([]);
    setDiscountPercent(0);
    setSelectedCustomer(null);
    setAmountReceived('');
  };

  // ==================== Add Customer ====================

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!user) return;

    setIsAddingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add customer');
      }
      const customer = await res.json();
      setCustomers((prev) => [...prev, customer]);
      setSelectedCustomer(customer);
      setAddCustomerOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      toast.success('Customer added');
    } catch (err) {
      toast.error('Failed to add customer', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // ==================== Receipt Actions ====================

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow || !lastSale) return;

    const itemsHtml = lastSale.items
      .map(
        (item) => `
      <tr>
        <td style="text-align:left;padding:4px 0;font-size:13px;">${item.productName}</td>
        <td style="text-align:center;padding:4px 0;font-size:13px;">${item.quantity}</td>
        <td style="text-align:right;padding:4px 0;font-size:13px;">${formatCurrency(item.subtotal)}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Receipt - ${lastSale.transactionNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; max-width: 300px; margin: 0 auto; }
        h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
        p { margin: 2px 0; font-size: 12px; text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: bold; font-size: 15px; }
        .footer { text-align: center; margin-top: 15px; font-size: 11px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h2>STORE POS</h2>
      <p>Receipt</p>
      <div class="divider"></div>
      <p><strong>Txn:</strong> ${lastSale.transactionNumber}</p>
      <p><strong>Date:</strong> ${new Date(lastSale.createdAt).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${lastSale.customer?.name || 'Walk-in'}</p>
      <p><strong>Cashier:</strong> ${lastSale.soldBy?.name || ''}</p>
      <div class="divider"></div>
      <table>
        <thead><tr style="border-bottom:1px solid #000;">
          <th style="text-align:left;padding:4px 0;font-size:12px;">Item</th>
          <th style="text-align:center;padding:4px 0;font-size:12px;">Qty</th>
          <th style="text-align:right;padding:4px 0;font-size:12px;">Amount</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td style="text-align:left;">Subtotal</td><td style="text-align:right;">${formatCurrency(lastSale.subtotal)}</td></tr>
        ${lastSale.discountAmount > 0 ? `<tr><td style="text-align:left;">Discount</td><td style="text-align:right;">-${formatCurrency(lastSale.discountAmount)}</td></tr>` : ''}
        ${lastSale.taxAmount > 0 ? `<tr><td style="text-align:left;">Tax</td><td style="text-align:right;">${formatCurrency(lastSale.taxAmount)}</td></tr>` : ''}
        <tr class="total-row"><td style="text-align:left;border-top:2px solid #000;padding-top:5px;">TOTAL</td><td style="text-align:right;border-top:2px solid #000;padding-top:5px;">${formatCurrency(lastSale.totalAmount)}</td></tr>
        ${lastSale.paymentMethod === 'cash' && lastSale.amountReceived ? `
        <tr><td style="text-align:left;">Received</td><td style="text-align:right;">${formatCurrency(lastSale.amountReceived)}</td></tr>
        <tr><td style="text-align:left;">Change</td><td style="text-align:right;">${formatCurrency(lastSale.changeAmount)}</td></tr>
        ` : ''}
      </table>
      <div class="divider"></div>
      <p><strong>Payment:</strong> ${lastSale.paymentMethod.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
      <div class="footer"><p>Thank you for your purchase!</p></div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleDownloadReceipt = () => {
    if (!lastSale) return;

    const itemsText = lastSale.items
      .map(
        (item) =>
          `  ${item.productName.padEnd(20)} x${item.quantity}    ${formatCurrency(item.subtotal)}`
      )
      .join('\n');

    const receiptText = `
================================
         STORE POS
            Receipt
================================

Transaction: ${lastSale.transactionNumber}
Date: ${new Date(lastSale.createdAt).toLocaleString()}
Customer: ${lastSale.customer?.name || 'Walk-in'}
Cashier: ${lastSale.soldBy?.name || ''}

--------------------------------
${'Item'.padEnd(22)}Qty   Amount
--------------------------------
${itemsText}
--------------------------------
Subtotal:                  ${formatCurrency(lastSale.subtotal)}
${lastSale.discountAmount > 0 ? `Discount:                 -${formatCurrency(lastSale.discountAmount)}\n` : ''}${lastSale.taxAmount > 0 ? `Tax:                      ${formatCurrency(lastSale.taxAmount)}\n` : ''}================================
TOTAL:                     ${formatCurrency(lastSale.totalAmount)}
================================
${lastSale.paymentMethod === 'cash' && lastSale.amountReceived ? `Amount Received:          ${formatCurrency(lastSale.amountReceived)}\nChange:                    ${formatCurrency(lastSale.changeAmount)}\n` : ''}Payment: ${lastSale.paymentMethod.replace('_', ' ')}

    Thank you for your purchase!
================================
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${lastSale.transactionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  const handleSendReceipt = () => {
    if (!sendTo.trim()) {
      toast.error('Please enter a recipient', {
        description:
          sendMethod === 'email' ? 'Enter a valid email address' : 'Enter a valid phone number',
      });
      return;
    }
    // In a real app, this would call an API. For V1, show success toast.
    toast.success(`Receipt sent via ${sendMethod}`, {
      description: `Sent to ${sendTo}`,
    });
    setSendReceiptOpen(false);
    setSendTo('');
  };

  // ==================== Stock Helpers ====================

  const getStockStatus = (product: Product) => {
    const tracksStock = product.productType?.tracksStock !== false;
    if (!tracksStock) return { label: 'In Stock', variant: 'secondary' as const };
    const qty = product.inventory?.quantity ?? 0;
    if (qty <= 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (qty <= (product.minStockLevel ?? 5))
      return { label: `${qty} left`, variant: 'destructive' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  const isOutOfStock = (product: Product) => {
    const tracksStock = product.productType?.tracksStock !== false;
    if (!tracksStock) return false;
    return (product.inventory?.quantity ?? 0) <= 0;
  };

  // ==================== Render ====================

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ==================== LEFT SIDE: Product Area ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-12 pl-10 text-base rounded-xl bg-muted/40 border-muted-foreground/10 focus-visible:bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !selectedCategoryId
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-3 space-y-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <AlertCircle className="size-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{productsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProductsLoading(true);
                  fetchProducts(searchQuery, selectedCategoryId);
                }}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Package className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No products found</p>
              {(searchQuery || selectedCategoryId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryFilter(null);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => {
                const oos = isOutOfStock(product);
                const stock = getStockStatus(product);
                return (
                  <motion.button
                    key={product.id}
                    whileTap={oos ? undefined : { scale: 0.97 }}
                    onClick={() => !oos && addToCart(product)}
                    disabled={oos}
                    className={`group relative text-left rounded-xl border bg-card p-3 transition-all duration-150 ${
                      oos
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/50 hover:shadow-sm cursor-pointer active:bg-accent/50'
                    }`}
                  >
                    {/* Product Image / Placeholder */}
                    <div
                      className={`aspect-square w-full rounded-lg flex items-center justify-center overflow-hidden ${
                        oos ? 'bg-muted' : getProductColor(product.name) + '/10'
                      }`}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span
                          className={`text-lg font-semibold ${
                            oos
                              ? 'text-muted-foreground/30'
                              : getProductColor(product.name).replace('bg-', 'text-').replace('-500', '-600')
                          }`}
                        >
                          {getInitials(product.name)}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="mt-2.5 space-y-1">
                      <p className="text-sm font-medium leading-tight truncate">
                        {product.name}
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      <Badge
                        variant={stock.variant}
                        className="text-[10px] px-1.5 py-0"
                      >
                        <CircleDot className="size-2.5 mr-0.5" />
                        {stock.label}
                      </Badge>
                    </div>

                    {/* Quick add indicator on hover */}
                    {!oos && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                          <Plus className="size-3.5" />
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== RIGHT SIDE: Cart Area ==================== */}
      <div className="w-[420px] max-md:w-[380px] border-l bg-card flex flex-col shrink-0">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Cart</h2>
            {totalItems > 0 && (
              <Badge variant="default" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 min-h-0">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="size-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No items in cart</p>
              <p className="text-xs text-muted-foreground/60">Click products to add them</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="px-3 py-2 space-y-1">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, x: 20 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                    >
                      {/* Product Image Placeholder */}
                      <div
                        className={`size-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                          getProductColor(item.product.name)
                            .replace('bg-', 'bg-')
                            .replace('-500', '-500') + '/15'
                        } ${
                          getProductColor(item.product.name)
                            .replace('bg-', 'text-')
                            .replace('-500', '-600')
                        }`}
                      >
                        {getInitials(item.product.name)}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.sellingPrice)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="size-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="size-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Subtotal & Remove */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(item.product.sellingPrice * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-muted-foreground/60 hover:text-destructive transition-colors ml-auto flex"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Cart Summary & Actions (Fixed Bottom) */}
        {cartItems.length > 0 && (
          <div className="border-t bg-card space-y-3 p-4">
            {/* Customer Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <div className="flex gap-1.5">
                <Select
                  value={selectedCustomer?.id || 'walk-in'}
                  onValueChange={(val) => {
                    if (val === 'walk-in') {
                      setSelectedCustomer(null);
                    } else {
                      const c = customers.find((c) => c.id === val);
                      if (c) setSelectedCustomer(c);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.phone && (
                            <span className="text-muted-foreground text-xs">• {c.phone}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setAddCustomerOpen(true)}
                  title="Add Customer"
                >
                  <UserPlus className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Discount Input */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">Discount</Label>
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val) || val < 0) setDiscountPercent(0);
                    else if (val > 100) setDiscountPercent(100);
                    else setDiscountPercent(val);
                  }}
                  placeholder="0"
                  className="h-8 w-16 text-sm text-center"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              {discountPercent > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setDiscountPercent(0)}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>

            {/* Summary Lines */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full rounded-xl py-5 text-base font-semibold"
              size="lg"
              onClick={openCheckout}
            >
              Checkout • {formatCurrency(total)}
              <ChevronRight className="size-5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ==================== ADD CUSTOMER DIALOG ==================== */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Quickly add a new customer for this sale</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                placeholder="Customer name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomer()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                placeholder="Phone number"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomer()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={isAddingCustomer || !newCustomerName.trim()}>
              {isAddingCustomer ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== CHECKOUT DIALOG ==================== */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => !isProcessing && setCheckoutOpen(open)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>Review and confirm the transaction</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Order Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Order Summary</h4>
              <div className="rounded-lg border">
                <div className="p-3 space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(item.product.sellingPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold pt-1">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Customer</h4>
              <p className="text-sm">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Payment Method</h4>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${
                      paymentMethod === pm.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={pm.value} className="sr-only" />
                    <div
                      className={`size-8 rounded-md flex items-center justify-center ${
                        paymentMethod === pm.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {pm.icon}
                    </div>
                    <span className="text-sm font-medium">{pm.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Cash Amount Received */}
            {paymentMethod === 'cash' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="amount-received" className="text-sm font-semibold text-muted-foreground">
                    Amount Received
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ₵
                    </span>
                    <Input
                      id="amount-received"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="h-11 pl-7 text-lg font-semibold tabular-nums"
                      autoFocus
                    />
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20, 50, 100]
                      .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                      .slice(0, 4)
                      .map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmountReceived(val.toFixed(2))}
                          className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                        >
                          {formatCurrency(val)}
                        </button>
                      ))}
                  </div>
                </div>
                {amountReceived && parseFloat(amountReceived) >= total && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-700 font-medium">Change</span>
                      <span className="text-lg font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={
                isProcessing ||
                (paymentMethod === 'cash' &&
                  (!amountReceived || parseFloat(amountReceived) < total))
              }
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm • {formatCurrency(total)}
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== RECEIPT SUCCESS DIALOG ==================== */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="text-center space-y-3 py-2">
            {/* Success Icon */}
            <div className="mx-auto size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="size-9 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Sale Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lastSale?.transactionNumber}
              </p>
            </div>
          </div>

          {/* Receipt Preview */}
          {lastSale && (
            <div ref={receiptRef}>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
                <div className="space-y-1">
                  {lastSale.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="tabular-nums shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(lastSale.subtotal)}</span>
                  </div>
                  {lastSale.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatCurrency(lastSale.discountAmount)}</span>
                    </div>
                  )}
                  {lastSale.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="tabular-nums">{formatCurrency(lastSale.taxAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(lastSale.totalAmount)}</span>
                  </div>
                  {lastSale.paymentMethod === 'cash' && lastSale.amountReceived != null && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Received</span>
                        <span className="tabular-nums">{formatCurrency(lastSale.amountReceived)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Change</span>
                        <span className="tabular-nums">{formatCurrency(lastSale.changeAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>{lastSale.customer?.name || 'Walk-in'}</p>
                  <p className="capitalize">
                    {lastSale.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handlePrintReceipt}>
                <Printer className="size-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadReceipt}>
                <Download className="size-4" />
                Download
              </Button>
              <Button
                variant="outline"
                className="col-span-2"
                onClick={() => {
                  setSendMethod('whatsapp');
                  setSendTo(selectedCustomer?.phone || lastSale?.customer?.phone || '');
                  setSendReceiptOpen(true);
                }}
              >
                <Send className="size-4" />
                Send Receipt
              </Button>
            </div>
            <Button
              className="w-full rounded-xl py-5 text-base font-semibold"
              size="lg"
              onClick={handleNewSale}
            >
              New Sale
              <ChevronRight className="size-5 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== SEND RECEIPT DIALOG ==================== */}
      <Dialog open={sendReceiptOpen} onOpenChange={setSendReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Receipt</DialogTitle>
            <DialogDescription>Choose how to send the receipt to the customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Send via</Label>
              <RadioGroup
                value={sendMethod}
                onValueChange={(val) => {
                  setSendMethod(val as 'whatsapp' | 'sms' | 'email');
                  setSendTo('');
                }}
                className="flex gap-2"
              >
                {[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'email', label: 'Email' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm font-medium ${
                      sendMethod === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-to">
                {sendMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                id="send-to"
                type={sendMethod === 'email' ? 'email' : 'tel'}
                placeholder={
                  sendMethod === 'email' ? 'customer@example.com' : '+233 XX XXX XXXX'
                }
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReceipt()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendReceiptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReceipt}>
              <Send className="size-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
