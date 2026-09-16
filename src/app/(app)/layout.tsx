'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { setCurrencyCode } from '@/lib/currency';
import { setBusinessInfo } from '@/lib/business-info';
import { useBusinessSettingsQuery } from '@/hooks/api/use-business-settings';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { PageTabsBand, PageTabsProvider } from '@/components/molecules/page-tabs';
import { Loader2 } from 'lucide-react';

function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  // No session — send the user back to the login page.
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Hydrate the app-wide business settings once the user is signed in, so every
  // page (not just Settings) formats money with the configured currency and
  // shows the real business identity on receipts.
  const { data: businessSettings } = useBusinessSettingsQuery({ enabled: status === 'authenticated' });
  useEffect(() => {
    if (!businessSettings) return;
    setCurrencyCode(businessSettings.currency);
    setBusinessInfo(businessSettings);
  }, [businessSettings]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <FullScreenLoader label="Loading StorePOS..." />;
  }

  return (
    <PageTabsProvider>
      <div className="flex h-screen overflow-hidden bg-muted/50 lg:gap-2 lg:p-2">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-card lg:rounded-lg lg:border lg:border-border lg:shadow-sm">
          <AppHeader />
          <PageTabsBand />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </PageTabsProvider>
  );
}
