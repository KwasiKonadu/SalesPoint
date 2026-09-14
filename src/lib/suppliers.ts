/**
 * Types and form helpers shared by the Suppliers screen and its sub-components
 * (`src/components/suppliers/*`).
 */

export interface Supplier {
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

export interface SupplierRestock {
  id: string;
  reference?: string | null;
  batchNumber?: string | null;
  dateReceived: string;
  totalCost: number;
  paymentStatus: string;
  notes?: string | null;
}

export interface SupplierDetail extends Supplier {
  restockHistory: SupplierRestock[];
  totalPurchases: number;
  outstandingBalance: number;
}

export interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierFormData {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

export const defaultSupplierForm: SupplierFormData = {
  businessName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

/** Form values seeded from an existing supplier (or a blank supplier). */
export function supplierFormValues(supplier: Supplier | null): SupplierFormData {
  return {
    businessName: supplier?.businessName || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive !== false,
  };
}

export const SUPPLIERS_PAGE_SIZE = 20;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
