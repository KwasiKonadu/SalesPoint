'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

const SESSION_KEY = 'storepos_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Read the persisted session only after mount so the first client render
  // matches the server ("loading"), avoiding a hydration mismatch.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      setUser(stored ? (JSON.parse(stored) as AuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const status: 'loading' | 'authenticated' | 'unauthenticated' =
    loading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const userData = await res.json();
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const ctxValue: AuthContextType = { user, status, login, logout };

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSession() {
  const ctx = useContext(AuthContext);
  return { ...ctx, session: ctx.user as any };
}
