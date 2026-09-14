/**
 * Types, constants and pure helpers shared by the Expenses screen and its
 * sub-components (`src/components/expenses/*`).
 */

// ==================== Types ====================

export interface Expense {
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

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { expenses: number };
}

export interface ExpensesResponse {
  data: Expense[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExpenseFormData {
  expenseCategoryId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  description: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface ExpenseSummary {
  thisMonth: number;
  lastMonth: number;
  topCategory: { name: string; amount: number };
  transactionCount: number;
}

export const EXPENSES_PAGE_SIZE = 20;

// ==================== Payment methods ====================

export const EXPENSE_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export function expensePaymentLabel(value?: string | null): string {
  if (!value) return '—';
  return EXPENSE_PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
}

// ==================== Date helpers ====================

export const getTodayISO = () => new Date().toISOString().split('T')[0];

export const getFirstDayOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

export const getFirstDayOfLastMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

export const getLastDayOfLastMonthISO = () => {
  const d = new Date();
  d.setDate(0);
  return d.toISOString().split('T')[0];
};

// ==================== Colour helper ====================

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

export function getCategoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

// ==================== Summary calc ====================

/** Top spending category (by amount) for a set of expenses. */
export function topExpenseCategory(expenses: Expense[]): {
  name: string;
  amount: number;
} {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    const name = e.category?.name || 'Uncategorized';
    totals[name] = (totals[name] || 0) + e.amount;
  }
  let top = { name: 'None', amount: 0 };
  for (const [name, amount] of Object.entries(totals)) {
    if (amount > top.amount) top = { name, amount };
  }
  return top;
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

/** Month-over-month percentage change. */
export function monthChangePercent(thisMonth: number, lastMonth: number): number {
  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return ((thisMonth - lastMonth) / lastMonth) * 100;
}

export function expenseFormValues(expense: Expense | null): ExpenseFormData {
  return {
    expenseCategoryId: expense?.expenseCategoryId || '',
    amount: expense?.amount ? String(expense.amount) : '',
    date: expense?.date ? expense.date.split('T')[0] : getTodayISO(),
    paymentMethod: expense?.paymentMethod || 'cash',
    description: expense?.description || '',
  };
}
