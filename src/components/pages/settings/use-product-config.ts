'use client';

import { useProductTypes } from '@/hooks/api/use-product-types';
import { useUnits } from '@/hooks/api/use-units';

/** Loads the product-type and unit lists for the Product Config tab. */
export function useProductConfig() {
  const productTypes = useProductTypes();
  const units = useUnits();

  return {
    productTypes: productTypes.data ?? [],
    units: units.data ?? [],
    loading: productTypes.isPending || units.isPending,
  };
}
