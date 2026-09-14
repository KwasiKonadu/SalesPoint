/**
 * Types, form defaults and validation shared by the Staff screen and its
 * sub-components (`src/components/staff/*`).
 */

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
}

export const emptyStaffForm: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  role: 'sales_person',
  password: '',
  confirmPassword: '',
};

/** Form values seeded from an existing staff member (or a blank one). */
export function staffFormValues(staff: StaffMember | null): StaffFormData {
  if (!staff) return emptyStaffForm;
  return {
    name: staff.name,
    email: staff.email,
    phone: staff.phone || '',
    role: staff.role,
    password: '',
    confirmPassword: '',
  };
}

export const STAFF_PAGE_SIZE = 10;
export const STAFF_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const STAFF_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales_person', label: 'Sales Person' },
];

/** Returns the first validation error message, or `null` when the form is valid. */
export function validateStaffForm(
  form: StaffFormData,
  isEditing: boolean,
): string | null {
  if (!form.name.trim()) return 'Name is required';
  if (!form.email.trim()) return 'Email is required';
  if (!STAFF_EMAIL_RE.test(form.email)) return 'Please enter a valid email address';

  const passwordRequired = !isEditing;
  if (passwordRequired || form.password) {
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
  }
  return null;
}
