'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { setCurrencyCode } from '@/lib/currency';
import { setBusinessInfo } from '@/lib/business-info';
import type { BusinessSettings } from '@/lib/settings';

/** Push freshly loaded / saved settings into the app-wide stores. */
function syncStores(settings: BusinessSettings) {
  setCurrencyCode(settings.currency);
  setBusinessInfo(settings);
}

/**
 * Loads `/api/business-settings` and provides a `save`. Both the Business Info
 * and Receipt tabs read the same document, so `errorLabel` tailors the toasts.
 */
export function useBusinessSettings(errorLabel: string) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/business-settings');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!ignore) {
          setSettings(data);
          syncStores(data);
        }
      } catch {
        if (!ignore) toast.error(`Failed to load ${errorLabel}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [errorLabel]);

  const updateField = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(
    async (payload: BusinessSettings, successMessage: string) => {
      if (!user) {
        toast.error(`Failed to save ${errorLabel}`);
        return false;
      }
      setSaving(true);
      try {
        const res = await fetch('/api/business-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSettings(payload);
        syncStores(payload);
        toast.success(successMessage);
        return true;
      } catch {
        toast.error(`Failed to save ${errorLabel}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [errorLabel, user],
  );

  return { settings, setSettings, updateField, loading, saving, save };
}
