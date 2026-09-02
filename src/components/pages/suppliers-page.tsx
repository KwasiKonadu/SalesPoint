'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Truck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// ==================== Types ====================

interface Supplier {
  id: string;
  businessName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { restocks: number };
}

interface SupplierDetail extends Supplier {
  restockHistory: RestockItem[];
  totalPurchases: number;
  outstandingBalance: number;
}

interface RestockItem {
  id: string;
  reference?: string | null;
  batchNumber?: string | null;
  dateReceived: string;
  totalCost: number;
  paymentStatus: string;
  notes?: string | null;
}

interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  pageSize: number;
}

interface SupplierFormData {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `\u20B5${amount.toFixed(2)}`;
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">Paid</Badge>;
    case 'partially_paid':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">Partial</Badge>;
    default:
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-normal">Unpaid</Badge>;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const defaultFormData: SupplierFormData = {
  businessName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

// ==================== Table Skeleton ====================

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business Name</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Phone</TableHead>
            <TableHead className="hidden xl:table-cell">Email</TableHead>
            <TableHead className="hidden xl:table-cell">Address</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[110px]" /></TableCell>
              <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-[140px]" /></TableCell>
              <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
              <TableCell><Skeleton className="h-8 w-[70px]" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==================== Supplier Form Dialog ====================

function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!supplier;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SupplierFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        businessName: supplier?.businessName || '',
        contactPerson: supplier?.contactPerson || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
        address: supplier?.address || '',
        notes: supplier?.notes || '',
        isActive: supplier?.isActive !== false,
      });
      setErrors({});
    }
  }, [open, supplier]);

  const updateField = (field: keyof SupplierFormData, value: string | boolean) => {
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
    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
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
        businessName: form.businessName.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEditing) {
        body.isActive = form.isActive;
      }

      const url = isEditing
        ? `/api/suppliers/${supplier.id}`
        : '/api/suppliers';
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
        throw new Error(err.error || 'Failed to save supplier');
      }

      toast.success(
        isEditing
          ? 'Supplier updated successfully'
          : 'Supplier created successfully'
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save supplier'
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
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the supplier details below.'
              : 'Fill in the details to add a new supplier.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              placeholder="e.g., Accra Wholesale Ltd"
              value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">{errors.businessName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="John Doe"
                value={form.contactPerson}
                onChange={(e) => updateField('contactPerson', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+233 24 000 0000"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Business Street"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {form.isActive ? 'Active supplier' : 'Inactive supplier'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
            </div>
          )}

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
              {isEditing ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Supplier Profile Dialog ====================

function SupplierProfileDialog({
  supplier,
  open,
  onOpenChange,
}: {
  supplier: SupplierDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open || !supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            {supplier?.businessName || 'Supplier Details'}
          </DialogTitle>
          <DialogDescription>
            Supplier profile and purchase history
          </DialogDescription>
        </DialogHeader>

        {supplier ? (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Purchase History</TabsTrigger>
              <TabsTrigger value="products">Products Supplied</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600">
                        <ShoppingBag className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Purchases</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(supplier.totalPurchases)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-50 text-amber-600">
                        <AlertCircle className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(supplier.outstandingBalance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-violet-50 text-violet-600">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Number of Orders</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {supplier._count?.restocks ?? supplier.restockHistory?.length ?? 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Supplier Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Supplier Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  <InfoRow icon={<Building2 className="size-4" />} label="Business Name" value={supplier.businessName} />
                  <InfoRow icon={<Building2 className="size-4" />} label="Contact Person" value={supplier.contactPerson} />
                  <InfoRow icon={<Phone className="size-4" />} label="Phone" value={supplier.phone} />
                  <InfoRow icon={<Mail className="size-4" />} label="Email" value={supplier.email} />
                  <InfoRow icon={<MapPin className="size-4" />} label="Address" value={supplier.address} />
                  <InfoRow
                    icon={<Building2 className="size-4" />}
                    label="Status"
                    value={supplier.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
                {supplier.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {supplier.restockHistory && supplier.restockHistory.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="hidden sm:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.restockHistory.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(r.dateReceived)}</TableCell>
                          <TableCell>{r.reference || '—'}</TableCell>
                          <TableCell>{r.batchNumber || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{formatCurrency(r.totalCost)}</TableCell>
                          <TableCell>{formatStatus(r.paymentStatus)}</TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[200px] truncate text-muted-foreground">
                            {r.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="size-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No purchase history yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Product supply details will appear here once restock items are tracked.</p>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ==================== Info Row Helper ====================

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ==================== Main Component ====================

export default function SuppliersPage() {
  const { user } = useAuth();

  // List state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.ceil(total / pageSize) || 1;

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const res = await fetch(`/api/suppliers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const data: SuppliersResponse = await res.json();
      setSuppliers(data.data);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Handlers
  const handleAdd = () => {
    setEditingSupplier(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormDialogOpen(true);
  };

  const handleView = async (supplier: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`);
      if (!res.ok) throw new Error();
      const detail: SupplierDetail = await res.json();
      setViewingSupplier(detail);
    } catch {
      toast.error('Failed to load supplier details');
      setViewingSupplier(supplier as SupplierDetail);
    }
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingSupplier) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete supplier');
      }
      toast.success('Supplier deactivated');
      setDeleteDialogOpen(false);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
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
        <Button onClick={handleAdd}>
          <Plus className="size-4 mr-1.5" />
          Add Supplier
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Truck className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No suppliers yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            Add your first supplier to start tracking purchases and orders.
          </p>
          <Button onClick={handleAdd}>
            <Plus className="size-4 mr-1.5" />
            Add Supplier
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact Person</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden xl:table-cell">Email</TableHead>
                <TableHead className="hidden xl:table-cell">Address</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.businessName}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.contactPerson || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{s.phone || '—'}</TableCell>
                  <TableCell className="hidden xl:table-cell">{s.email || '—'}</TableCell>
                  <TableCell className="hidden xl:table-cell max-w-[180px] truncate">{s.address || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(0)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={s.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal'
                        : 'bg-rose-50 text-rose-700 border-rose-200 font-normal'
                      }
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleView(s)}
                        title="View"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(s)}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(s)}
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
      )}

      {/* Pagination */}
      {!loading && total > pageSize && (
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}
            {Math.min(page * pageSize, total) < total
              ? `-${Math.min(page * pageSize, total)}`
              : `-${total}`}{' '}
            of {total} suppliers
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

      {/* ==================== DIALOGS ==================== */}

      {/* Add/Edit Supplier Dialog */}
      <SupplierFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        supplier={editingSupplier}
        onSuccess={fetchSuppliers}
      />

      {/* View Supplier Dialog */}
      <SupplierProfileDialog
        supplier={viewingSupplier}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingSupplier?.businessName}&quot;?
              This will mark the supplier as inactive. You can reactivate it later.
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
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
