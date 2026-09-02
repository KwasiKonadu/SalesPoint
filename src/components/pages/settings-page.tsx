'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Package,
  Receipt,
  Save,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ==================== Types ====================

interface BusinessSettings {
  [key: string]: string;
}

interface ProductType {
  id: string;
  name: string;
  description: string | null;
  tracksStock: boolean;
  isActive: boolean;
}

interface Unit {
  id: string;
  name: string;
  shortName: string | null;
  isActive: boolean;
}

// ==================== Business Info Tab ====================

function BusinessInfoTab() {
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business-settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSettings(data);
    } catch {
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Business settings saved');
    } catch {
      toast.error('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const taxEnabled = settings.tax_enabled === 'true';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Business Information</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Update your business details and tax configuration.
        </p>
      </div>

      <div className="grid gap-5 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={settings.business_name || ''}
            onChange={(e) => updateField('business_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={settings.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={settings.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={settings.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={settings.currency || 'GHS'}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={settings.tax_rate || ''}
              onChange={(e) => updateField('tax_rate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="tax_enabled">Tax Enabled</Label>
            <p className="text-sm text-muted-foreground">
              Apply tax to sales transactions.
            </p>
          </div>
          <Switch
            id="tax_enabled"
            checked={taxEnabled}
            onCheckedChange={(checked) => updateField('tax_enabled', String(checked))}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            value={settings.logo_url || ''}
            onChange={(e) => updateField('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== Product Config Tab ====================

function ProductConfigTab() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [minStock, setMinStock] = useState('5');
  const [loading, setLoading] = useState(true);

  // Product Type dialog
  const [ptDialogOpen, setPtDialogOpen] = useState(false);
  const [ptEditing, setPtEditing] = useState<ProductType | null>(null);
  const [ptName, setPtName] = useState('');
  const [ptDescription, setPtDescription] = useState('');
  const [ptTracksStock, setPtTracksStock] = useState(true);
  const [ptSaving, setPtSaving] = useState(false);
  const [ptDeleteTarget, setPtDeleteTarget] = useState<ProductType | null>(null);
  const [ptDeleting, setPtDeleting] = useState(false);

  // Unit dialog
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitEditing, setUnitEditing] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitShortName, setUnitShortName] = useState('');
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitDeleteTarget, setUnitDeleteTarget] = useState<Unit | null>(null);
  const [unitDeleting, setUnitDeleting] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [ptRes, uRes] = await Promise.all([
        fetch('/api/product-types'),
        fetch('/api/units'),
      ]);
      if (!ptRes.ok || !uRes.ok) throw new Error('Failed to fetch');
      const ptData = await ptRes.json();
      const uData = await uRes.json();
      setProductTypes(Array.isArray(ptData) ? ptData : []);
      setUnits(Array.isArray(uData) ? uData : []);
    } catch {
      toast.error('Failed to load product configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ---- Product Type handlers ----
  const openAddProductType = () => {
    setPtEditing(null);
    setPtName('');
    setPtDescription('');
    setPtTracksStock(true);
    setPtDialogOpen(true);
  };

  const openEditProductType = (pt: ProductType) => {
    setPtEditing(pt);
    setPtName(pt.name);
    setPtDescription(pt.description || '');
    setPtTracksStock(pt.tracksStock);
    setPtDialogOpen(true);
  };

  const saveProductType = async () => {
    if (!ptName.trim()) {
      toast.error('Name is required');
      return;
    }
    setPtSaving(true);
    try {
      const url = ptEditing ? `/api/product-types/${ptEditing.id}` : '/api/product-types';
      const res = await fetch(url, {
        method: ptEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ptName.trim(),
          description: ptDescription.trim() || null,
          tracksStock: ptTracksStock,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      toast.success(ptEditing ? 'Product type updated' : 'Product type added');
      setPtDialogOpen(false);
      fetchConfig();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product type');
    } finally {
      setPtSaving(false);
    }
  };

  const deleteProductType = async () => {
    if (!ptDeleteTarget) return;
    setPtDeleting(true);
    try {
      const res = await fetch(`/api/product-types/${ptDeleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product type deleted');
      setPtDeleteTarget(null);
      fetchConfig();
    } catch {
      toast.error('Failed to delete product type');
    } finally {
      setPtDeleting(false);
    }
  };

  // ---- Unit handlers ----
  const openAddUnit = () => {
    setUnitEditing(null);
    setUnitName('');
    setUnitShortName('');
    setUnitDialogOpen(true);
  };

  const openEditUnit = (u: Unit) => {
    setUnitEditing(u);
    setUnitName(u.name);
    setUnitShortName(u.shortName || '');
    setUnitDialogOpen(true);
  };

  const saveUnit = async () => {
    if (!unitName.trim()) {
      toast.error('Name is required');
      return;
    }
    setUnitSaving(true);
    try {
      const url = unitEditing ? `/api/units/${unitEditing.id}` : '/api/units';
      const res = await fetch(url, {
        method: unitEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unitName.trim(),
          shortName: unitShortName.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      toast.success(unitEditing ? 'Unit updated' : 'Unit added');
      setUnitDialogOpen(false);
      fetchConfig();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save unit');
    } finally {
      setUnitSaving(false);
    }
  };

  const deleteUnit = async () => {
    if (!unitDeleteTarget) return;
    setUnitDeleting(true);
    try {
      const res = await fetch(`/api/units/${unitDeleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Unit deleted');
      setUnitDeleteTarget(null);
      fetchConfig();
    } catch {
      toast.error('Failed to delete unit');
    } finally {
      setUnitDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Product Types */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Product Types</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define the types of products you sell.
            </p>
          </div>
          <Button onClick={openAddProductType} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Type
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Tracks Stock</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No product types yet.
                  </TableCell>
                </TableRow>
              ) : (
                productTypes.map((pt) => (
                  <TableRow key={pt.id}>
                    <TableCell className="font-medium">{pt.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={pt.tracksStock ? 'default' : 'outline'} className="gap-1">
                        {pt.tracksStock ? (
                          <><CheckCircle2 className="h-3 w-3" /> Yes</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> No</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={pt.isActive ? 'default' : 'outline'}
                        className={pt.isActive ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-emerald-200' : ''}
                      >
                        {pt.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditProductType(pt)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit {pt.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setPtDeleteTarget(pt)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {pt.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Units */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Units of Measurement</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define units for measuring products.
            </p>
          </div>
          <Button onClick={openAddUnit} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Short Name</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No units yet.
                  </TableCell>
                </TableRow>
              ) : (
                units.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {u.shortName || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={u.isActive ? 'default' : 'outline'}
                        className={u.isActive ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-emerald-200' : ''}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditUnit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit {u.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setUnitDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {u.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Default Minimum Stock Level */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Default Minimum Stock Level</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Default alert threshold for low stock notifications.
          </p>
        </div>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="min-stock">Minimum Stock Level</Label>
          <Input
            id="min-stock"
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Applied to new products that don&apos;t specify a custom level.
          </p>
        </div>
      </div>

      {/* Product Type Dialog */}
      <Dialog open={ptDialogOpen} onOpenChange={(open) => { if (!open) setPtDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ptEditing ? 'Edit Product Type' : 'Add Product Type'}</DialogTitle>
            <DialogDescription>
              {ptEditing ? 'Update the product type details.' : 'Create a new product type.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pt-name">Name *</Label>
              <Input
                id="pt-name"
                placeholder="e.g., Physical Product"
                value={ptName}
                onChange={(e) => setPtName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-desc">Description</Label>
              <Textarea
                id="pt-desc"
                placeholder="Brief description (optional)"
                value={ptDescription}
                onChange={(e) => setPtDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pt-stock"
                checked={ptTracksStock}
                onCheckedChange={(checked) => setPtTracksStock(checked === true)}
              />
              <Label htmlFor="pt-stock" className="cursor-pointer">Tracks Stock</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPtDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProductType} disabled={ptSaving}>
              {ptSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {ptEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Type Delete Dialog */}
      <AlertDialog open={!!ptDeleteTarget} onOpenChange={(open) => { if (!open) setPtDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{ptDeleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the product type. Existing products using this type will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ptDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProductType}
              disabled={ptDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {ptDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={(open) => { if (!open) setUnitDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{unitEditing ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
            <DialogDescription>
              {unitEditing ? 'Update the unit details.' : 'Create a new unit of measurement.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Name *</Label>
              <Input
                id="unit-name"
                placeholder="e.g., Kilogram"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-short">Short Name</Label>
              <Input
                id="unit-short"
                placeholder="e.g., kg"
                value={unitShortName}
                onChange={(e) => setUnitShortName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveUnit} disabled={unitSaving}>
              {unitSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {unitEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Delete Dialog */}
      <AlertDialog open={!!unitDeleteTarget} onOpenChange={(open) => { if (!open) setUnitDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{unitDeleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the unit. Existing products using this unit will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unitDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUnit}
              disabled={unitDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {unitDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Receipt Settings Tab ====================

function ReceiptSettingsTab() {
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Receipt-specific fields
  const [footerMessage, setFooterMessage] = useState('');
  const [receiptFormat, setReceiptFormat] = useState('standard');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business-settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSettings(data);
      setFooterMessage(data.receipt_footer || 'Thank you for your purchase!');
      setReceiptFormat(data.receipt_format || 'standard');
    } catch {
      toast.error('Failed to load receipt settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        ...settings,
        receipt_footer: footerMessage,
        receipt_format: receiptFormat,
      };
      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Receipt settings saved');
      setSettings(payload);
    } catch {
      toast.error('Failed to save receipt settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Receipt Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure what appears on printed and digital receipts.
        </p>
      </div>

      <div className="grid gap-5 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="rcpt-business-name">Business Name</Label>
          <Input
            id="rcpt-business-name"
            value={settings.business_name || ''}
            onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Pre-filled from business settings.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rcpt-phone">Business Phone</Label>
            <Input
              id="rcpt-phone"
              value={settings.phone || ''}
              onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rcpt-email">Business Email</Label>
            <Input
              id="rcpt-email"
              value={settings.email || ''}
              onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcpt-address">Business Address</Label>
          <Textarea
            id="rcpt-address"
            value={settings.address || ''}
            onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
            rows={2}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="rcpt-footer">Footer Message</Label>
          <Textarea
            id="rcpt-footer"
            placeholder="Thank you for your purchase!"
            value={footerMessage}
            onChange={(e) => setFooterMessage(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message appears at the bottom of every receipt.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcpt-format">Receipt Format</Label>
          <Select value={receiptFormat} onValueChange={setReceiptFormat}>
            <SelectTrigger id="rcpt-format" className="w-full sm:w-64">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose how receipts are formatted when printed or sent.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Receipt Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Settings Page ====================

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your business settings, product configuration, and receipt preferences.
        </p>
      </div>

      <Tabs defaultValue="business-info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="business-info" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:block" />
            <span className="hidden xs:inline">Business</span> Info
          </TabsTrigger>
          <TabsTrigger value="product-config" className="gap-2">
            <Package className="h-4 w-4 hidden sm:block" />
            Product Config
          </TabsTrigger>
          <TabsTrigger value="receipt-settings" className="gap-2">
            <Receipt className="h-4 w-4 hidden sm:block" />
            Receipt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-info">
          <Card>
            <CardContent className="pt-6">
              <BusinessInfoTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product-config">
          <Card>
            <CardContent className="pt-6">
              <ProductConfigTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt-settings">
          <Card>
            <CardContent className="pt-6">
              <ReceiptSettingsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
