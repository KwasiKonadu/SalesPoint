/**
 * Types, colour helpers and the product form schema shared by the Products
 * screen and its sub-components (`src/components/products/*`).
 */

import { z } from 'zod';

// ==================== Types ====================

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  container?: string | null;
  size?: string | null;
  description?: string | null;
  image?: string | null;
  categoryId?: string | null;
  productTypeId?: string | null;
  unitId?: string | null;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  packSize?: number | null;
  taxEnabled: boolean;
  taxRate: number;
  isActive: boolean;
  targetStock?: number | null;
  lowStockPercent: number;
  /** Among the top units-sold products in the last 30 days (set by the API). */
  isBestSeller?: boolean;
  createdAt: string;
  category?: { id: string; name: string } | null;
  productType?: { id: string; name: string; tracksStock: boolean } | null;
  unit?: { id: string; name: string; shortName?: string | null } | null;
  inventory?: { id: string; quantity: number } | null;
}

/** "Bottle 1L" — the container/size part of a product, or "" when neither is set. */
export function variantLabel(
  p: { container?: string | null; size?: string | null },
): string {
  return [p.container, p.size].filter(Boolean).join(' ');
}

/** "Coca-Cola · Bottle 1L", or just the name when there's no container/size. */
export function productLabel(
  p: { name: string; container?: string | null; size?: string | null },
): string {
  const label = variantLabel(p);
  return label ? `${p.name} · ${label}` : p.name;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

export interface ProductType {
  id: string;
  name: string;
  tracksStock: boolean;
}

export interface Unit {
  id: string;
  name: string;
  shortName?: string | null;
}

export interface ProductsResponse {
  data: ProductItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type ViewMode = 'table' | 'grid';

// ==================== Colour / initial helpers ====================

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

/** Deterministic accent colour for a product with no image. */
export function getProductColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRODUCT_COLORS[Math.abs(hash) % PRODUCT_COLORS.length];
}

export function getProductInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ==================== Form schema ====================

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional().nullable(),
  container: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  productTypeId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, 'Must be 0 or greater'),
  sellingPrice: z.coerce.number().min(0.01, 'Selling price is required'),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  packSize: z.coerce.number().int().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  initialStock: z.coerce.number().int().min(0).optional(),
  lowStockPercent: z.coerce.number().int().min(0).max(100),
  taxEnabled: z.boolean(),
  taxRate: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Default form values derived from an existing product (or a blank product).
 * New products fall back to the business-wide default low-stock percent from
 * Settings → Product Config.
 */
export function productFormDefaults(
  product: ProductItem | null,
  defaultLowStockPercent = 20,
): ProductFormValues {
  return {
    name: product?.name || '',
    sku: product?.sku || '',
    container: product?.container || '',
    size: product?.size || '',
    description: product?.description || '',
    categoryId: product?.categoryId || null,
    productTypeId: product?.productTypeId || null,
    unitId: product?.unitId || null,
    costPrice: product?.costPrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    wholesalePrice: product?.wholesalePrice || null,
    packSize: product?.packSize ?? null,
    imageUrl: product?.image || null,
    initialStock: 0,
    lowStockPercent: product?.lowStockPercent ?? defaultLowStockPercent,
    taxEnabled: product?.taxEnabled || false,
    taxRate: product?.taxRate || 0,
    isActive: product?.isActive !== false,
  };
}
