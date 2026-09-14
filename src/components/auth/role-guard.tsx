'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { DEFAULT_ROUTE } from '@/lib/nav';

/**
 * Gates its children behind a role. Admin-only routes wrap their page body in
 * this so a sales_person who navigates directly to the URL gets a clear
 * "not allowed" screen instead of a broken page or a silent redirect.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: 'admin';
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (user?.role !== allow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Admin access required</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You don&apos;t have permission to view this page.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={DEFAULT_ROUTE}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
