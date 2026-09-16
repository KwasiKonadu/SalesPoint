'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { setCurrencyCode } from '@/lib/currency';
import { setBusinessInfo } from '@/lib/business-info';
import { useBusinessSettingsQuery, useSaveBusinessSettings } from '@/hooks/api/use-business-settings';
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
  const query = useBusinessSettingsQuery();
  const saveMutation = useSaveBusinessSettings();

  // Local editable draft, seeded from the server document once it loads.
  const [settings, setSettings] = useState<BusinessSettings>({});
  useEffect(() => {
    if (query.data) {
      setSettings(query.data);
      syncStores(query.data);
    }
  }, [query.data]);

  useEffect(() => {
    if (query.isError) toast.error(`Failed to load ${errorLabel}`);
  }, [query.isError, errorLabel]);

  const updateField = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(
    async (payload: BusinessSettings, successMessage: string) => {
      try {
        const saved = await saveMutation.mutateAsync(payload);
        setSettings(saved);
        syncStores(saved);
        toast.success(successMessage);
        return true;
      } catch {
        toast.error(`Failed to save ${errorLabel}`);
        return false;
      }
    },
    [errorLabel, saveMutation],
  );

  return {
    settings,
    setSettings,
    updateField,
    loading: query.isPending,
    saving: saveMutation.isPending,
    save,
  };
}
