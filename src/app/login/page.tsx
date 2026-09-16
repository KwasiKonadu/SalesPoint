'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_ROUTE } from '@/lib/nav';
import LoginPage from '@/components/login-page';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { status } = useAuth();
  const router = useRouter();

  // Already signed in (e.g. session still valid in this browser session) —
  // skip straight past the login form.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(DEFAULT_ROUTE);
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <LoginPage />;
}
