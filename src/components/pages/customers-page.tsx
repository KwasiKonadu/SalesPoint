'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
  ShoppingBag,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

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
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ==================== Types ====================

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { sales: number };
  _sum?: { totalAmount: number | null };
}

interface CustomerDetail extends Customer {
  _count: { sales: number };
  _sum: { totalAmount: number | null };
  sales?: CustomerSale[];
}

interface CustomerSale {
  id: string;
  transactionNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

interface CustomerFormData {
  name: string;
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
  return <Badge variant="outline">{status}</Badge>;
};

const emptyForm: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

// ==================== Component ====================

export default function CustomersPage() {
  // List state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Profile dialog
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState<CustomerDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data: CustomersResponse = await res.json();
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(Math.max(1, Math.ceil(data.total / pageSize)));
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Open add dialog
  const openAddDialog = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setFormDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      isActive: customer.isActive,
    });
    setFormDialogOpen(true);
  };

  // Save customer (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        // Update
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update customer');
        toast.success('Customer updated successfully');
      } else {
        // Create
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create customer');
        toast.success('Customer added successfully');
      }
      setFormDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(editingCustomer ? 'Failed to update customer' : 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteDialog = (customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      toast.success('Customer deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // Open profile dialog
  const openProfileDialog = async (customer: Customer) => {
    setProfileCustomer(null);
    setProfileLoading(true);
    setProfileDialogOpen(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (!res.ok) throw new Error('Failed to fetch customer details');
      const data: CustomerDetail = await res.json();
      setProfileCustomer(data);
    } catch (err) {
      toast.error('Failed to load customer details');
      setProfileDialogOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage your customer database</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Name</TableHead>
              <TableHead className="min-w-[130px]">Phone</TableHead>
              <TableHead className="min-w-[180px] hidden md:table-cell">Email</TableHead>
              <TableHead className="min-w-[180px] hidden lg:table-cell">Address</TableHead>
              <TableHead className="text-right min-w-[120px]">Total Purchases</TableHead>
              <TableHead className="text-center min-w-[80px]"># Purchases</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48">
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <Users className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">No customers yet. Add your first customer.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.email || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{customer.address || '—'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer._sum?.totalAmount ?? 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {customer._count?.sales ?? 0}
                  </TableCell>
                  <TableCell>
                    {customer.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openProfileDialog(customer)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(customer)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(customer)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && customers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ==================== Add/Edit Dialog ==================== */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update the customer information below.'
                : 'Fill in the details to add a new customer.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                placeholder="Customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-address">Address</Label>
              <Textarea
                id="cust-address"
                placeholder="Street address, city, region"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-notes">Notes</Label>
              <Textarea
                id="cust-notes"
                placeholder="Any additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cust-status">Active</Label>
              <Switch
                id="cust-status"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCustomer ? 'Update' : 'Add'} Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Customer Profile Dialog ==================== */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{profileCustomer?.name ?? 'Customer'}</DialogTitle>
            <DialogDescription>Customer profile & purchase history</DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : profileCustomer ? (
            <Tabs defaultValue="purchases" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="purchases" className="flex-1">Purchase History</TabsTrigger>
              </TabsList>

              <TabsContent value="purchases" className="mt-4 space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-semibold">{formatCurrency(profileCustomer._sum?.totalAmount ?? 0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchases</p>
                        <p className="text-lg font-semibold">{profileCustomer._count?.sales ?? 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Purchase</p>
                        <p className="text-lg font-semibold">
                          {profileCustomer.sales && profileCustomer.sales.length > 0
                            ? formatDate(profileCustomer.sales[0].createdAt)
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {profileCustomer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {profileCustomer.phone}
                    </div>
                  )}
                  {profileCustomer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {profileCustomer.email}
                    </div>
                  )}
                  {profileCustomer.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {profileCustomer.address}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Purchase History Table */}
                {!profileCustomer.sales || profileCustomer.sales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No purchase history yet.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileCustomer.sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-sm">{sale.transactionNumber}</TableCell>
                            <TableCell>{formatDate(sale.createdAt)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentMethodColor(sale.paymentMethod)}`}>
                                {paymentMethodLabel(sale.paymentMethod)}
                              </span>
                            </TableCell>
                            <TableCell>{statusBadge(sale.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirmation Dialog ==================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCustomer?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
