'use client';

import { useAppStore, type PageId } from '@/lib/store';
import { MobileMenuButton } from './app-sidebar';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-context';

const pageTitles: Record<PageId, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview of your business performance' },
  pos: { title: 'Point of Sale', description: 'Process new sales transactions' },
  sales: { title: 'Sales History', description: 'View and manage all transactions' },
  products: { title: 'Products', description: 'Manage your product catalog' },
  inventory: { title: 'Inventory', description: 'Track stock levels and movements' },
  customers: { title: 'Customers', description: 'Manage customer information' },
  suppliers: { title: 'Suppliers', description: 'Manage supplier relationships' },
  expenses: { title: 'Expenses', description: 'Track business expenses' },
  reports: { title: 'Reports', description: 'Business analytics and insights' },
  staff: { title: 'Staff Management', description: 'Manage team members and permissions' },
  settings: { title: 'Settings', description: 'Configure your business' },
  login: { title: 'Sign In', description: '' },
};

export function AppHeader() {
  const { currentPage } = useAppStore();
  const { page } = pageTitles[currentPage] || { title: '', description: '' };
  const showSearch = ['dashboard', 'products', 'sales', 'customers', 'suppliers', 'inventory'].includes(currentPage);
  const userRole = (useSession().session?.user as any)?.role || 'sales_person';

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <div>
          <h1 className="text-lg font-semibold text-foreground">{page.title}</h1>
          {page.description && (
            <p className="text-xs text-muted-foreground hidden sm:block">{page.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 w-64 h-9" />
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{userRole.replace('_', ' ')}</span>
        </div>
      </div>
    </header>
  );
}
