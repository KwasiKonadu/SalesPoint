/**
 * Types and form defaults shared by the Customers screen and its sub-components
 * (`src/components/customers/*`).
 */

export interface Customer {
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

export interface CustomerSale {
  id: string;
  transactionNumber: string;
  totalAmount: number;
  paymentMethod: string;
  /** completed | pending (credit, unsettled) | failed */
  paymentStatus: string;
  amountReceived?: number | null;
  status: string;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  _count: { sales: number };
  _sum: { totalAmount: number | null };
  sales?: CustomerSale[];
  /** Sum still owed across unpaid, non-refunded sales. */
  outstandingBalance?: number;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

export const emptyCustomerForm: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

/** Form values seeded from an existing customer (or a blank customer). */
export function customerFormValues(customer: Customer | null): CustomerFormData {
  if (!customer) return emptyCustomerForm;
  return {
    name: customer.name,
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || '',
    isActive: customer.isActive,
  };
}

export const CUSTOMERS_PAGE_SIZE = 10;
