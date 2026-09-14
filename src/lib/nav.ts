import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Truck,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Zap,
} from 'lucide-react';

export type UserRole = 'admin' | 'sales_person' | string;

export interface NavRoute {
  /** URL path, also used as the stable key. */
  href: string;
  /** Sidebar label. */
  label: string;
  /** Header title. */
  title: string;
  /** Header subtitle. */
  description: string;
  icon: React.ElementType;
  /** Only visible / accessible to admins. */
  adminOnly?: boolean;
}

export const NAV_ROUTES: NavRoute[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    description: 'Overview of your business performance',
    icon: LayoutDashboard,
  },
  {
    href: '/pos',
    label: 'POS / New Sale',
    title: 'Point of Sale',
    description: 'Process new sales transactions',
    icon: Zap,
  },
  {
    href: '/sales',
    label: 'Sales History',
    title: 'Sales & Returns',
    description: 'View and manage all transactions',
    icon: ShoppingCart,
  },
  {
    href: '/products',
    label: 'Products',
    title: 'Products',
    description: 'Manage your product catalog',
    icon: Package,
  },
  {
    href: '/inventory',
    label: 'Inventory',
    title: 'Inventory',
    description: 'Track stock levels and movements',
    icon: Warehouse,
  },
  {
    href: '/customers',
    label: 'Customers',
    title: 'Customers',
    description: 'Manage customer information',
    icon: Users,
  },
  {
    href: '/suppliers',
    label: 'Suppliers',
    title: 'Suppliers',
    description: 'Manage supplier relationships',
    icon: Truck,
    adminOnly: true,
  },
  {
    href: '/expenses',
    label: 'Expenses',
    title: 'Expenses',
    description: 'Track business expenses',
    icon: Receipt,
    adminOnly: true,
  },
  {
    href: '/reports',
    label: 'Reports',
    title: 'Reports',
    description: 'Business analytics and insights',
    icon: BarChart3,
  },
  {
    href: '/staff',
    label: 'Staff',
    title: 'Staff Management',
    description: 'Manage team members and permissions',
    icon: UserCog,
    adminOnly: true,
  },
  {
    href: '/settings',
    label: 'Settings',
    title: 'Settings',
    description: 'Configure your business',
    icon: Settings,
    adminOnly: true,
  },
];

/** The route a signed-in user lands on. */
export const DEFAULT_ROUTE = '/dashboard';

export function routeForPath(pathname: string): NavRoute | undefined {
  return NAV_ROUTES.find(
    (r) => pathname === r.href || pathname.startsWith(`${r.href}/`),
  );
}

export function visibleRoutes(role: UserRole): NavRoute[] {
  return NAV_ROUTES.filter((r) => !r.adminOnly || role === 'admin');
}

export function canAccess(pathname: string, role: UserRole): boolean {
  const route = routeForPath(pathname);
  if (!route) return true;
  return !route.adminOnly || role === 'admin';
}
