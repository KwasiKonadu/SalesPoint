// Central query-key registry. Keeping every domain's keys in one place
// avoids typo'd cache keys and makes cross-hook invalidation (e.g. a sale
// affecting both /api/sales and /api/inventory) easy to find.
export const queryKeys = {
  staff: {
    all: ['staff'] as const,
    list: (params: Record<string, unknown>) => ['staff', 'list', params] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    catalog: ['products', 'catalog'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  productTypes: {
    all: ['product-types'] as const,
  },
  units: {
    all: ['units'] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    list: (params: Record<string, unknown>) => ['suppliers', 'list', params] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  sales: {
    all: ['sales'] as const,
    list: (params: Record<string, unknown>) => ['sales', 'list', params] as const,
    detail: (id: string) => ['sales', 'detail', id] as const,
  },
  returns: {
    all: ['returns'] as const,
    list: (params: Record<string, unknown>) => ['returns', 'list', params] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (params: Record<string, unknown>) => ['expenses', 'list', params] as const,
    summary: (params: Record<string, unknown>) => ['expenses', 'summary', params] as const,
  },
  expenseCategories: {
    all: ['expense-categories'] as const,
  },
  inventory: {
    overview: (params: Record<string, unknown>) => ['inventory', 'overview', params] as const,
    refs: ['inventory', 'refs'] as const,
    stockMovements: (params: Record<string, unknown>) => ['inventory', 'stock-movements', params] as const,
  },
  restocks: {
    all: ['restocks'] as const,
    list: (params: Record<string, unknown>) => ['restocks', 'list', params] as const,
    detail: (id: string) => ['restocks', 'detail', id] as const,
  },
  pos: {
    catalog: ['pos', 'catalog'] as const,
  },
  businessSettings: {
    all: ['business-settings'] as const,
  },
  productConfig: {
    all: ['product-config'] as const,
  },
  dashboard: {
    all: (params: Record<string, unknown>) => ['dashboard', params] as const,
  },
  reports: {
    all: (params: Record<string, unknown>) => ['reports', params] as const,
  },
};
