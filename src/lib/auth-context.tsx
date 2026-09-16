'use client';

// Thin wrapper around NextAuth so the rest of the app keeps the same small
// surface (`useAuth`/`useSession` returning `{ user, status, login, logout }`)
// it had before, while the actual session is now a real HttpOnly cookie
// (JWT) issued and verified by NextAuth — not a client-side flag.

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
  SessionProvider,
  signIn,
  signOut,
  useSession as useNextAuthSession,
} from 'next-auth/react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'loading',
  login: async () => {},
  logout: () => {},
});

function AuthBridge({ children }: { children: React.ReactNode }) {
  const { data, status } = useNextAuthSession();

  const user = useMemo<AuthUser | null>(() => {
    if (!data?.user) return null;
    const { id, email, name, role } = data.user as AuthUser;
    return { id, email, name, role };
  }, [data]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
  }, []);

  const logout = useCallback(() => {
    void signOut({ redirect: false });
  }, []);

  const ctxValue: AuthContextType = { user, status, login, logout };

  return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthBridge>{children}</AuthBridge>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSession() {
  const ctx = useContext(AuthContext);
  return { ...ctx, session: ctx.user };
}
