'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  TrendingUp,
  TrendingDown,
  Tag,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface Expense {
  id: string;
  expenseCategoryId?: string | null;
  amount: number;
  date: string;
  paymentMethod?: string | null;
  description?: string | null;
  attachment?: string | null;
  createdAt: string;
  category?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { expenses: number };
}

interface ExpensesResponse {
  data: Expense[];
  total: number;
  page: number;
  pageSize: number;
}

interface ExpenseFormData {
  expenseCategoryId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  description: string;
}

interface CategoryFormData {
  name: string;
  description: string;
}

// ==================== Constants ====================

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const paymentMethodLabel = (value?: string | null) => {
  if (!value) return '—';
  const found = PAYMENT_METHODS.find((m) => m.value === value);
  return found?.label || value;
};

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `\u20B5${amount.toFixed(2)}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

const getFirstDayOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

const getLastDayOfMonthISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().split('T')[0];
};

const getFirstDayOfLastMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

const getLastDayOfLastMonthISO = () => {
  const d = new Date();
  d.setDate(0);
  return d.toISOString().split('T')[0];
};

const CATEGORY_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
];

const getCategoryColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

// ==================== Summary Cards Skeleton ====================

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== Table Skeleton ====================

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Payment</TableHead>
            <TableHead className="hidden xl:table-cell">Created By</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[160px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[90px]" /></TableCell>
              <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-8 w-[70px]" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==================== Expense Form Dialog ====================

function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  categories: ExpenseCategory[];
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!expense;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>({
    expenseCategoryId: '',
    amount: '',
    date: getTodayISO(),
    paymentMethod: 'cash',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        expenseCategoryId: expense?.expenseCategoryId || '',
        amount: expense?.amount ? String(expense.amount) : '',
        date: expense?.date ? expense.date.split('T')[0] : getTodayISO(),
        paymentMethod: expense?.paymentMethod || 'cash',
        description: expense?.description || '',
      });
      setErrors({});
    }
  }, [open, expense]);

  const updateField = (field: keyof ExpenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!form.date) {
      newErrors.date = 'Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod || undefined,
        description: form.description.trim() || undefined,
        expenseCategoryId: form.expenseCategoryId || undefined,
      };

      const url = isEditing
        ? `/api/expenses/${expense.id}`
        : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save expense');
      }

      toast.success(
        isEditing
          ? 'Expense updated successfully'
          : 'Expense added successfully'
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save expense'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the expense details below.'
              : 'Record a new business expense.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-category">Category</Label>
              <Select
                value={form.expenseCategoryId}
                onValueChange={(v) => updateField('expenseCategoryId', v)}
              >
                <SelectTrigger id="exp-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-payment">Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => updateField('paymentMethod', v)}
              >
                <SelectTrigger id="exp-payment">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-description">Description</Label>
            <Textarea
              id="exp-description"
              placeholder="What was this expense for?"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Category Form Dialog ====================

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategory | null;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!category;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CategoryFormData>({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        name: category?.name || '',
        description: category?.description || '',
      });
      setErrors({});
    }
  }, [open, category]);

  const updateField = (field: keyof CategoryFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save category');
      }

      toast.success(
        isEditing
          ? 'Category updated successfully'
          : 'Category created successfully'
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save category'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category name and description.'
              : 'Create a new expense category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g., Rent"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Component ====================

export default function ExpensesPage() {
  const { user } = useAuth();

  // Expenses list state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('_all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('_all');
  const pageSize = 20;

  // Categories
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // Summary
  const [summary, setSummary] = useState({
    thisMonth: 0,
    lastMonth: 0,
    topCategory: { name: '', amount: 0 },
    transactionCount: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const totalPages = Math.ceil(total / pageSize) || 1;

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/expense-categories');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data);
    } catch {
      // silent
    }
  }, []);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (categoryFilter !== '_all' && categoryFilter) {
        params.set('categoryId', categoryFilter);
      }
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/expenses?${params}`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data: ExpensesResponse = await res.json();
      setExpenses(data.data);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, startDate, endDate]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      // Fetch this month expenses
      const thisMonthParams = new URLSearchParams({
        startDate: getFirstDayOfMonthISO(),
        endDate: getTodayISO(),
        pageSize: '1000',
      });
      const thisMonthRes = await fetch(`/api/expenses?${thisMonthParams}`);
      if (!thisMonthRes.ok) throw new Error();
      const thisMonthData: ExpensesResponse = await thisMonthRes.json();

      // Fetch last month expenses
      const lastMonthParams = new URLSearchParams({
        startDate: getFirstDayOfLastMonthISO(),
        endDate: getLastDayOfLastMonthISO(),
        pageSize: '1000',
      });
      const lastMonthRes = await fetch(`/api/expenses?${lastMonthParams}`);
      if (!lastMonthRes.ok) throw new Error();
      const lastMonthData: ExpensesResponse = await lastMonthRes.json();

      const thisMonthTotal = thisMonthData.data.reduce((s, e) => s + e.amount, 0);
      const lastMonthTotal = lastMonthData.data.reduce((s, e) => s + e.amount, 0);

      // Calculate top category for this month
      const catTotals: Record<string, number> = {};
      thisMonthData.data.forEach((e) => {
        const catName = e.category?.name || 'Uncategorized';
        catTotals[catName] = (catTotals[catName] || 0) + e.amount;
      });
      let topCat = { name: 'None', amount: 0 };
      Object.entries(catTotals).forEach(([name, amount]) => {
        if (amount > topCat.amount) topCat = { name, amount };
      });

      setSummary({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        topCategory: topCat,
        transactionCount: thisMonthData.total,
      });
    } catch {
      // silent - summary is non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSummary();
  }, [fetchCategories, fetchSummary]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, startDate, endDate, paymentFilter]);

  // Client-side search & payment filter
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          e.createdBy?.name.toLowerCase().includes(q)
      );
    }
    if (paymentFilter !== '_all') {
      result = result.filter((e) => e.paymentMethod === paymentFilter);
    }
    return result;
  }, [expenses, search, paymentFilter]);

  // Calculate month change
  const monthChange = useMemo(() => {
    if (summary.lastMonth === 0) {
      return summary.thisMonth > 0 ? 100 : 0;
    }
    return ((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100;
  }, [summary.thisMonth, summary.lastMonth]);

  // Handlers
  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormDialogOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeletingExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingExpense) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete expense');
      }
      toast.success('Expense deleted');
      setDeleteDialogOpen(false);
      setDeletingExpense(null);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCatFormOpen(true);
  };

  const handleSuccess = () => {
    fetchExpenses();
    fetchCategories();
    fetchSummary();
  };

  // Pagination helpers
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summaryLoading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Expenses This Month */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Expenses (This Month)</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(summary.thisMonth)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Month vs Month */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${monthChange >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {monthChange >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">vs Last Month</p>
                  <div className="flex items-center gap-1">
                    <p className={`text-lg font-semibold tabular-nums ${monthChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(1)}%
                    </p>
                    {monthChange >= 0 ? (
                      <ArrowUpRight className="size-4 text-rose-500" />
                    ) : (
                      <ArrowDownRight className="size-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Category */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-violet-50 text-violet-600">
                  <Tag className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Category</p>
                  <p className="text-lg font-semibold truncate max-w-[140px]">
                    {summary.topCategory.name}
                  </p>
                  {summary.topCategory.amount > 0 && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(summary.topCategory.amount)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Count */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-50 text-amber-600">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {summary.transactionCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="expenses">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="size-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="size-4" />
              Categories
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== EXPENSES TAB ==================== */}
        <TabsContent value="expenses">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px]"
                placeholder="From"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px]"
                placeholder="To"
              />

              <Select
                value={paymentFilter}
                onValueChange={setPaymentFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAddExpense}>
                <Plus className="size-4 mr-1.5" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TableSkeleton />
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="size-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-medium">No expenses found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                {search || categoryFilter !== '_all' || startDate || endDate
                  ? 'Try adjusting your search or filters.'
                  : 'Record your first expense to start tracking spending.'}
              </p>
              {!search && categoryFilter === '_all' && !startDate && !endDate && (
                <Button onClick={handleAddExpense}>
                  <Plus className="size-4 mr-1.5" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden lg:table-cell">Payment Method</TableHead>
                      <TableHead className="hidden xl:table-cell">Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(exp.date)}
                        </TableCell>
                        <TableCell>
                          {exp.category ? (
                            <Badge
                              variant="outline"
                              className="font-normal"
                            >
                              {exp.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                          {exp.description || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(exp.amount)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {paymentMethodLabel(exp.paymentMethod)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {exp.createdBy?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditExpense(exp)}
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteExpense(exp)}
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!loading && total > pageSize && (
                <div className="flex items-center justify-between px-2 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}
                    {Math.min(page * pageSize, total) < total
                      ? `-${Math.min(page * pageSize, total)}`
                      : `-${total}`}{' '}
                    of {total} expenses
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    {getPageNumbers().map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ==================== CATEGORIES TAB ==================== */}
        <TabsContent value="categories">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
            </p>
            <Button onClick={handleAddCategory} size="sm">
              <Plus className="size-4 mr-1.5" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tag className="size-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-medium">No categories yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create categories to organize your expenses.
              </p>
              <Button onClick={handleAddCategory} size="sm">
                <Plus className="size-4 mr-1.5" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Card key={cat.id} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-lg ${getCategoryColor(cat.name)} text-white font-semibold text-sm shrink-0`}
                      >
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium truncate">{cat.name}</h4>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCatFormOpen(true);
                            }}
                            title="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {cat._count?.expenses ?? 0} expense{(cat._count?.expenses ?? 0) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS ==================== */}

      {/* Add/Edit Expense Dialog */}
      <ExpenseFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        expense={editingExpense}
        categories={categories}
        onSuccess={handleSuccess}
      />

      {/* Add/Edit Category Dialog */}
      <CategoryFormDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        category={editingCategory}
        onSuccess={handleSuccess}
      />

      {/* Delete Expense Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense of{' '}
              <span className="font-medium">
                {deletingExpense ? formatCurrency(deletingExpense.amount) : ''}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
