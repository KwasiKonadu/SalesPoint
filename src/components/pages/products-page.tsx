'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  Pencil,
  Eye,
  MoreHorizontal,
  Download,
  Package,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  Tag,
  X,
  Loader2,
  CircleDot,
  FolderOpen,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// ==================== Types ====================

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  image?: string | null;
  categoryId?: string | null;
  productTypeId?: string | null;
  unitId?: string | null;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  taxEnabled: boolean;
  taxRate: number;
  isActive: boolean;
  minStockLevel: number;
  createdAt: string;
  category?: { id: string; name: string } | null;
  productType?: { id: string; name: string; tracksStock: boolean } | null;
  unit?: { id: string; name: string; shortName?: string | null } | null;
  inventory?: { id: string; quantity: number } | null;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

interface ProductType {
  id: string;
  name: string;
  tracksStock: boolean;
}

interface Unit {
  id: string;
  name: string;
  shortName?: string | null;
}

interface ProductsResponse {
  data: ProductItem[];
  total: number;
  page: number;
  pageSize: number;
}

type ViewMode = 'table' | 'grid';

// ==================== Helpers ====================

const formatCurrency = (amount: number): string => {
  return `\u20B5${amount.toFixed(2)}`;
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

// ==================== Zod Schema ====================

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  productTypeId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, 'Must be 0 or greater'),
  sellingPrice: z.coerce.number().min(0.01, 'Selling price is required'),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  initialStock: z.coerce.number().int().min(0).optional(),
  minStockLevel: z.coerce.number().int().min(0),
  taxEnabled: z.boolean(),
  taxRate: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ==================== Product Image Placeholder ====================

function ProductImage({
  name,
  image,
  size = 'sm',
}: {
  name: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-24 w-24 text-2xl',
  };

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getProductColor(name)} rounded-lg flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {getInitial(name)}
    </div>
  );
}

// ==================== Stock Badge ====================

function StockBadge({
  quantity,
  minStockLevel,
  tracksStock = true,
}: {
  quantity: number;
  minStockLevel: number;
  tracksStock?: boolean;
}) {
  if (!tracksStock) {
    return (
      <Badge variant="outline" className="font-normal">
        N/A
      </Badge>
    );
  }

  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="font-normal tabular-nums">
        {quantity}
      </Badge>
    );
  }

  if (quantity <= minStockLevel) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-medium tabular-nums">
        <CircleDot className="size-2.5 fill-amber-500 text-amber-500" />
        {quantity}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium tabular-nums">
      <CircleDot className="size-2.5 fill-emerald-500 text-emerald-500" />
      {quantity}
    </span>
  );
}

// ==================== Product Form Dialog ====================

function ProductFormDialog({
  open,
  onOpenChange,
  product,
  productTypes,
  categories,
  units,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem | null;
  productTypes: ProductType[];
  categories: Category[];
  units: Unit[];
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!product;
  const [submitting, setSubmitting] = useState(false);

  const selectedProductType = product?.productTypeId
    ? productTypes.find((t) => t.id === product.productTypeId)
    : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      categoryId: product?.categoryId || null,
      productTypeId: product?.productTypeId || null,
      unitId: product?.unitId || null,
      costPrice: product?.costPrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      wholesalePrice: product?.wholesalePrice || null,
      imageUrl: product?.image || null,
      initialStock: 0,
      minStockLevel: product?.minStockLevel || 5,
      taxEnabled: product?.taxEnabled || false,
      taxRate: product?.taxRate || 0,
      isActive: product?.isActive !== false,
    },
  });

  const taxEnabled = watch('taxEnabled');
  const isActive = watch('isActive');
  const productTypeId = watch('productTypeId');
  const tracksStock = isEditing
    ? selectedProductType?.tracksStock ?? true
    : productTypes.find((t) => t.id === productTypeId)?.tracksStock ?? true;

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name || '',
        sku: product?.sku || '',
        description: product?.description || '',
        categoryId: product?.categoryId || null,
        productTypeId: product?.productTypeId || null,
        unitId: product?.unitId || null,
        costPrice: product?.costPrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        wholesalePrice: product?.wholesalePrice || null,
        imageUrl: product?.image || null,
        initialStock: 0,
        minStockLevel: product?.minStockLevel || 5,
        taxEnabled: product?.taxEnabled || false,
        taxRate: product?.taxRate || 0,
        isActive: product?.isActive !== false,
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: data.name,
        sku: data.sku || undefined,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        productTypeId: data.productTypeId || undefined,
        unitId: data.unitId || undefined,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice || undefined,
        taxEnabled: data.taxEnabled,
        taxRate: data.taxEnabled ? data.taxRate : 0,
        minStockLevel: data.minStockLevel,
        image: data.imageUrl || undefined,
      };

      if (!isEditing && tracksStock) {
        body.initialStock = data.initialStock;
      }

      if (isEditing) {
        body.isActive = data.isActive;
      }

      const url = isEditing
        ? `/api/products/${product.id}`
        : '/api/products';
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
        throw new Error(err.error || 'Failed to save product');
      }

      toast.success(
        isEditing
          ? 'Product updated successfully'
          : 'Product created successfully'
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save product'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the product details below.'
              : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Coca-Cola Can"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  placeholder="Leave empty to auto-generate"
                  {...register('sku')}
                  aria-invalid={!!errors.sku}
                />
                {errors.sku && (
                  <p className="text-xs text-destructive">{errors.sku.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional product description..."
                rows={2}
                {...register('description')}
              />
            </div>
          </div>

          <Separator />

          {/* Classification */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Classification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={watch('categoryId') || '_none'}
                  onValueChange={(val) =>
                    setValue(
                      'categoryId',
                      val === '_none' ? null : val
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select
                  value={watch('productTypeId') || '_none'}
                  onValueChange={(val) =>
                    setValue(
                      'productTypeId',
                      val === '_none' ? null : val
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {productTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={watch('unitId') || '_none'}
                  onValueChange={(val) =>
                    setValue('unitId', val === '_none' ? null : val)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                        {unit.shortName ? ` (${unit.shortName})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">
                  Cost Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    \u20B5
                  </span>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7 tabular-nums"
                    {...register('costPrice')}
                    aria-invalid={!!errors.costPrice}
                  />
                </div>
                {errors.costPrice && (
                  <p className="text-xs text-destructive">{errors.costPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">
                  Selling Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    \u20B5
                  </span>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7 tabular-nums"
                    {...register('sellingPrice')}
                    aria-invalid={!!errors.sellingPrice}
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    \u20B5
                  </span>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7 tabular-nums"
                    {...register('wholesalePrice')}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory & Tax */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Inventory & Tax</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isEditing && tracksStock && (
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Initial Stock</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="tabular-nums"
                    {...register('initialStock')}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  step="1"
                  className="tabular-nums"
                  {...register('minStockLevel')}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={taxEnabled}
                  onCheckedChange={(checked) =>
                    setValue('taxEnabled', checked)
                  }
                />
                <Label className="cursor-pointer" onClick={() => setValue('taxEnabled', !taxEnabled)}>
                  Tax Enabled
                </Label>
              </div>

              {taxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="tabular-nums"
                    {...register('taxRate')}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Image & Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Image & Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  {...register('imageUrl')}
                />
              </div>

              {isEditing && (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setValue('isActive', checked)
                    }
                  />
                  <Label className="cursor-pointer" onClick={() => setValue('isActive', !isActive)}>
                    Active
                  </Label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
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
              {isEditing ? 'Update Product' : 'Create Product'}
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
  category: Category | null;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!category;
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name || '');
      setDescription(category?.description || '');
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);

    try {
      const url = isEditing
        ? `/api/categories/${category.id}`
        : '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';
      const body: Record<string, unknown> = { name: name.trim() };

      if (description.trim()) {
        body.description = description.trim();
      }
      if (isEditing) {
        body.isActive = category.isActive;
      }

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
        throw new Error(err.error || 'Failed to save category');
      }

      toast.success(
        isEditing
          ? 'Category updated'
          : 'Category created'
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update category details.'
              : 'Create a new product category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Beverages"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== View Product Dialog ====================

function ViewProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ProductImage name={product.name} image={product.image} size="lg" />
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
              <div className="mt-1">
                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Category</span>
              <p className="font-medium">{product.category?.name || 'None'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Type</span>
              <p className="font-medium">{product.productType?.name || 'None'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Unit</span>
              <p className="font-medium">{product.unit?.name || 'None'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Stock</span>
              <p className="font-medium tabular-nums">
                {product.inventory?.quantity ?? 0}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Cost Price</span>
              <p className="font-medium tabular-nums">{formatCurrency(product.costPrice)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Selling Price</span>
              <p className="font-medium tabular-nums">{formatCurrency(product.sellingPrice)}</p>
            </div>
            {product.wholesalePrice != null && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Wholesale Price</span>
                <p className="font-medium tabular-nums">{formatCurrency(product.wholesalePrice)}</p>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-muted-foreground">Min. Stock Level</span>
              <p className="font-medium tabular-nums">{product.minStockLevel}</p>
            </div>
            {product.taxEnabled && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Tax Rate</span>
                <p className="font-medium tabular-nums">{product.taxRate}%</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Table Skeleton ====================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

// ==================== Grid Skeleton ====================

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-24 w-24 rounded-lg mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
            <Skeleton className="h-5 w-16 mx-auto" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== Category Table Skeleton ====================

function CategoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

// ==================== Main Products Page ====================

export default function ProductsPage() {
  const { user } = useAuth();

  // Data state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('_all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category dialog state
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catDeleteDialogOpen, setCatDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [catDeleting, setCatDeleting] = useState(false);

  // Category tab state
  const [catLoading, setCatLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, statusFilter]);

  // Fetch categories for filter dropdown (active only)
  const fetchFilterCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch all categories (with product counts) for management tab
  const fetchAllCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await fetch('/api/categories?all=true');
      if (res.ok) {
        const data = await res.json();
        setAllCategories(data);
      }
    } catch {
      // silent
    } finally {
      setCatLoading(false);
    }
  }, []);

  // Fetch product types and units
  const fetchMetaData = useCallback(async () => {
    try {
      const [typesRes, unitsRes] = await Promise.all([
        fetch('/api/product-types'),
        fetch('/api/units'),
      ]);
      if (typesRes.ok) setProductTypes(await typesRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      // silent
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (categoryFilter !== '_all') params.set('categoryId', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data: ProductsResponse = await res.json();
        setProducts(data.data);
        setTotalProducts(data.total);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchFilterCategories();
    fetchMetaData();
  }, [fetchFilterCategories, fetchMetaData]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refresh helpers
  const refreshAll = useCallback(() => {
    fetchProducts();
    fetchFilterCategories();
  }, [fetchProducts, fetchFilterCategories]);

  // Product CRUD handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleViewProduct = (product: ProductItem) => {
    setViewingProduct(product);
    setViewDialogOpen(true);
  };

  const handleToggleActive = async (product: ProductItem) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          productTypeId: product.productTypeId,
          unitId: product.unitId,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          wholesalePrice: product.wholesalePrice,
          taxEnabled: product.taxEnabled,
          taxRate: product.taxRate,
          minStockLevel: product.minStockLevel,
          isActive: !product.isActive,
        }),
      });

      if (res.ok) {
        toast.success(
          product.isActive
            ? 'Product deactivated'
            : 'Product activated'
        );
        refreshAll();
      }
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteClick = (product: ProductItem) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        toast.success('Product deactivated');
        setDeleteDialogOpen(false);
        setDeletingProduct(null);
        refreshAll();
      }
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // Category CRUD handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCatFormOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatFormOpen(true);
  };

  const handleToggleCategory = async (cat: Category) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: cat.name,
          description: cat.description,
          isActive: !cat.isActive,
        }),
      });
      if (res.ok) {
        toast.success(
          cat.isActive ? 'Category deactivated' : 'Category activated'
        );
        fetchAllCategories();
        fetchFilterCategories();
      }
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleCategoryDeleteClick = (cat: Category) => {
    setDeletingCategory(cat);
    setCatDeleteDialogOpen(true);
  };

  const handleCategoryDeleteConfirm = async () => {
    if (!user || !deletingCategory) return;
    setCatDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        toast.success('Category deactivated');
        setCatDeleteDialogOpen(false);
        setDeletingCategory(null);
        fetchAllCategories();
        fetchFilterCategories();
      }
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setCatDeleting(false);
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

  const PaginationBar = () => {
    if (totalProducts <= pageSize) return null;
    return (
      <div className="flex items-center justify-between px-2 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}
          {Math.min(page * pageSize, totalProducts) < totalProducts
            ? `-${Math.min(page * pageSize, totalProducts)}`
            : `-${totalProducts}`}{' '}
          of {totalProducts} products
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
    );
  };

  // ==================== TABLE VIEW ====================

  const TableView = () => {
    if (!loading && products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No products found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            {debouncedSearch || categoryFilter !== '_all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first product.'}
          </p>
          {!debouncedSearch && categoryFilter === '_all' && (
            <Button onClick={handleAddProduct}>
              <Plus className="size-4 mr-2" />
              Add your first product
            </Button>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right tabular-nums">Cost Price</TableHead>
                <TableHead className="text-right tabular-nums">Selling Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className={!product.isActive ? 'opacity-60' : ''}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        name={product.name}
                        image={product.image}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline" className="font-normal">
                        {product.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {product.productType?.name || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatCurrency(product.costPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell>
                    <StockBadge
                      quantity={product.inventory?.quantity ?? 0}
                      minStockLevel={product.minStockLevel}
                      tracksStock={product.productType?.tracksStock ?? true}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? 'default' : 'secondary'}
                      className="font-normal"
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="size-3.5" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                            <Eye className="size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(product)}
                          >
                            <Power className="size-4" />
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationBar />
      </div>
    );
  };

  // ==================== GRID VIEW ====================

  const GridView = () => {
    if (!loading && products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No products found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            {debouncedSearch || categoryFilter !== '_all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first product.'}
          </p>
          {!debouncedSearch && categoryFilter === '_all' && (
            <Button onClick={handleAddProduct}>
              <Plus className="size-4 mr-2" />
              Add your first product
            </Button>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${!product.isActive ? 'opacity-60' : ''}`}
              onClick={() => handleEditProduct(product)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <ProductImage
                  name={product.name}
                  image={product.image}
                  size="lg"
                />
                <div className="w-full min-w-0">
                  <p className="font-medium text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.sku}
                  </p>
                </div>
                {product.category && (
                  <Badge variant="outline" className="font-normal text-xs">
                    {product.category.name}
                  </Badge>
                )}
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(product.sellingPrice)}
                </p>
                <StockBadge
                  quantity={product.inventory?.quantity ?? 0}
                  minStockLevel={product.minStockLevel}
                  tracksStock={product.productType?.tracksStock ?? true}
                />
                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.isActive ? 'default' : 'secondary'}
                    className="font-normal text-xs"
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <PaginationBar />
      </div>
    );
  };

  // ==================== CATEGORY TAB ====================

  const CategoriesTab = () => {
    useEffect(() => {
      fetchAllCategories();
    }, [fetchAllCategories]);

    if (catLoading) {
      return <CategoryTableSkeleton />;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allCategories.length} categories
          </p>
          <Button size="sm" onClick={handleAddCategory}>
            <Plus className="size-4 mr-1.5" />
            Add Category
          </Button>
        </div>

        {allCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium">No categories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create categories to organize your products.
            </p>
            <Button size="sm" onClick={handleAddCategory}>
              <Plus className="size-4 mr-1.5" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {allCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors ${!cat.isActive ? 'opacity-60' : ''}`}
              >
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {cat.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant={cat.isActive ? 'outline' : 'secondary'}
                  className="font-normal tabular-nums shrink-0"
                >
                  {cat._count?.products ?? 0} products
                </Badge>
                <Badge
                  variant={cat.isActive ? 'default' : 'secondary'}
                  className="font-normal shrink-0"
                >
                  {cat.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditCategory(cat)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleCategory(cat)}
                    >
                      <Power className="size-4" />
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleCategoryDeleteClick(cat)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="size-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="size-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="size-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* ==================== PRODUCTS TAB ==================== */}
        <TabsContent value="products">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="_all">All</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>

              <Button onClick={handleAddProduct}>
                <Plus className="size-4 mr-1.5" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            viewMode === 'table' ? (
              <TableSkeleton />
            ) : (
              <GridSkeleton />
            )
          ) : viewMode === 'table' ? (
            <TableView />
          ) : (
            <GridView />
          )}
        </TabsContent>

        {/* ==================== CATEGORIES TAB ==================== */}
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS ==================== */}

      {/* Add/Edit Product Dialog */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        productTypes={productTypes}
        categories={categories}
        units={units}
        onSuccess={refreshAll}
      />

      {/* View Product Dialog */}
      <ViewProductDialog
        product={viewingProduct}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Delete Product Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingProduct?.name}&quot;?
              This will mark the product as inactive. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
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

      {/* Add/Edit Category Dialog */}
      <CategoryFormDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        category={editingCategory}
        onSuccess={() => {
          fetchAllCategories();
          fetchFilterCategories();
        }}
      />

      {/* Delete Category Confirmation */}
      <AlertDialog
        open={catDeleteDialogOpen}
        onOpenChange={setCatDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingCategory?.name}&quot;?
              Products in this category will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={catDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCategoryDeleteConfirm}
              disabled={catDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {catDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
