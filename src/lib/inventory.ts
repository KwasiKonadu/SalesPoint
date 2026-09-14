/**
 * Types, badge vocabularies and pure helpers shared by the Inventory screen and
 * its sub-components (`src/components/inventory/*`).
 */

// ==================== Types ====================

export interface InventoryItem {
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
    container?: string | null;
    size?: string | null;
    image?: string | null;
    costPrice: number;
    targetStock?: number | null;
    lowStockPercent: number;
    category?: { id: string; name: string } | null;
    unit?: { id: string; name: string; shortName?: string | null } | null;
  };
}

export interface InventorySummary {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockMovement {
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
    container?: string | null;
    size?: string | null;
    category?: { id: string; name: string } | null;
    unit?: { id: string; name: string; shortName?: string | null } | null;
  };
}

export interface RestockItem {
  id: string;
  restockId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  expiryDate?: string | null;
  product: { id: string; name: string; sku: string; container?: string | null; size?: string | null };
}

export interface Restock {
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
  supplier?: { id: string; businessName: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
  items?: RestockItem[];
  _count?: { items: number };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  businessName: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  container?: string | null;
  size?: string | null;
  costPrice: number;
}

export interface RestockFormItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  expiryDate: string;
}

export const INVENTORY_PAGE_SIZE = 15;

// ==================== Badge vocabularies ====================

export const MOVEMENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; addition: boolean }
> = {
  initial_stock: { label: 'Initial Stock', color: 'bg-blue-100 text-blue-700', addition: true },
  restock: { label: 'Restock', color: 'bg-emerald-100 text-emerald-700', addition: true },
  sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700', addition: false },
  return: { label: 'Return', color: 'bg-purple-100 text-purple-700', addition: true },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-700', addition: false },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700', addition: false },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', addition: false },
  adjustment: { label: 'Adjustment', color: 'bg-gray-100 text-gray-700', addition: false },
};

export const MOVEMENT_TYPE_FALLBACK = {
  label: '',
  color: 'bg-gray-100 text-gray-700',
  addition: false,
};

/** Order of the movement-type filter pills (`all` first). */
export const MOVEMENT_TYPE_FILTERS = [
  'all',
  'initial_stock',
  'restock',
  'sale',
  'return',
  'damaged',
  'expired',
  'lost',
  'adjustment',
];

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  partially_paid: { label: 'Partially Paid', color: 'bg-amber-100 text-amber-700' },
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700' },
};

export function paymentStatusConfig(status: string | null | undefined) {
  return PAYMENT_STATUS_CONFIG[status || 'unpaid'] || PAYMENT_STATUS_CONFIG.unpaid;
}

// ==================== Pure helpers ====================

/** Roll a full inventory list into the four summary tiles. */
export function computeInventorySummary(
  items: InventoryItem[],
  total: number,
): InventorySummary {
  return {
    totalValue: items.reduce(
      (sum, item) => sum + item.quantity * item.product.costPrice,
      0,
    ),
    totalProducts: total,
    lowStockCount: items.filter((i) => i.stockStatus === 'low_stock').length,
    outOfStockCount: items.filter((i) => i.stockStatus === 'out_of_stock').length,
  };
}

/** Client-side sort for the loaded inventory page. */
export function sortInventory(
  items: InventoryItem[],
  field: string,
  dir: 'asc' | 'desc',
): InventoryItem[] {
  const pick = (item: InventoryItem): string | number => {
    switch (field) {
      case 'name':
        return item.product.name.toLowerCase();
      case 'category':
        return item.product.category?.name || '';
      case 'quantity':
        return item.quantity;
      case 'stockValue':
        return item.quantity * item.product.costPrice;
      case 'status':
        return item.stockStatus;
      default:
        return item.updatedAt;
    }
  };

  return [...items].sort((a, b) => {
    const valA = pick(a);
    const valB = pick(b);
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
