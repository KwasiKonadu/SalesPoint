'use client';

import React, { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { useAppStore } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('@/components/pages/dashboard-page'));
const POSPage = lazy(() => import('@/components/pages/pos-page'));
const SalesPage = lazy(() => import('@/components/pages/sales-page'));
const ProductsPage = lazy(() => import('@/components/pages/products-page'));
const InventoryPage = lazy(() => import('@/components/pages/inventory-page'));
const CustomersPage = lazy(() => import('@/components/pages/customers-page'));
const SuppliersPage = lazy(() => import('@/components/pages/suppliers-page'));
const ExpensesPage = lazy(() => import('@/components/pages/expenses-page'));
const ReportsPage = lazy(() => import('@/components/pages/reports-page'));
const StaffPage = lazy(() => import('@/components/pages/staff-page'));
const SettingsPage = lazy(() => import('@/components/pages/settings-page'));
const LoginPage = lazy(() => import('@/components/login-page'));

const pageComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
  pos: POSPage,
  sales: SalesPage,
  products: ProductsPage,
  inventory: InventoryPage,
  customers: CustomersPage,
  suppliers: SuppliersPage,
  expenses: ExpensesPage,
  reports: ReportsPage,
  staff: StaffPage,
  settings: SettingsPage,
};

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function AppShell() {
  const { currentPage } = useAppStore();
  const PageComponent = pageComponents[currentPage];

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-y-auto bg-muted/30">
          <Suspense fallback={<PageFallback />}>
            {PageComponent ? <PageComponent /> : <PageFallback />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading StorePOS...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Suspense
        fallback={(
          <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      >
        <LoginPage />
      </Suspense>
    );
  }

  return <AppShell />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
