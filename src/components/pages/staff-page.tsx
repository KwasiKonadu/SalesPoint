'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  ShieldCheck,
  CircleDot,
  Power,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  role: 'sales_person',
  password: '',
  confirmPassword: '',
};

export default function StaffPage() {
  const { user } = useAuth();

  // Data state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Deactivate dialog state
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/staff?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch staff');

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.staff || data.data || [];
      setStaffList(list);
      const totalCount = Array.isArray(data) ? data.length : (data.total || list.length);
      setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
    } catch {
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      password: '',
      confirmPassword: '',
    });
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address';
    if (!editingStaff) {
      if (!form.password) return 'Password is required';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    } else {
      if (form.password && form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.password && form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
      };

      if (form.password) {
        body.password = form.password;
      }

      const url = editingStaff
        ? `/api/staff/${editingStaff.id}`
        : '/api/staff';

      const res = await fetch(url, {
        method: editingStaff ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save staff');
      }

      toast.success(editingStaff ? 'Staff member updated' : 'Staff member added');
      setDialogOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/staff/${deactivateTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to deactivate staff');
      toast.success(`${deactivateTarget.name} has been deactivated`);
      setDeactivateTarget(null);
      fetchStaff();
    } catch {
      toast.error('Failed to deactivate staff member');
    } finally {
      setDeactivating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your team members and their access roles.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Button onClick={handleOpenAdd} className="gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Date Added</TableHead>
              <TableHead className="hidden xl:table-cell">Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-30" />
                    <p>No staff members yet.</p>
                    <Button variant="outline" size="sm" onClick={handleOpenAdd} className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Add your first staff member
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {staff.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {staff.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                      {staff.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                      <CircleDot className="h-3 w-3" />
                      {staff.role === 'admin' ? 'Admin' : 'Sales Person'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={staff.isActive ? 'default' : 'outline'}
                      className={staff.isActive ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-emerald-200' : ''}
                    >
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(staff.createdAt)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(staff)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {staff.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeactivateTarget(staff)}
                        disabled={staff.id === user?.id}
                      >
                        <Power className="h-4 w-4" />
                        <span className="sr-only">
                          {staff.isActive ? 'Deactivate' : 'Activate'} {staff.name}
                        </span>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) setDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? 'Update staff member information. Leave password blank to keep current.'
                : 'Create a new staff account with login credentials.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name *</Label>
              <Input
                id="staff-name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm((f) => ({ ...f, role: val }))}
              >
                <SelectTrigger id="staff-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_person">Sales Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-password">
                Password {editingStaff ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="staff-password"
                type="password"
                placeholder={editingStaff ? 'Enter new password' : 'Password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            {!editingStaff && (
              <div className="space-y-2">
                <Label htmlFor="staff-confirm-password">Confirm Password *</Label>
                <Input
                  id="staff-confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStaff ? 'Update' : 'Add'} Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateTarget?.name}? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deactivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
