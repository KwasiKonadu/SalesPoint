'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  calcCartTotals,
  lineId,
  lineUnits,
  stockCeiling,
  unitsInCart,
  type CartItem,
  type CartLineMode,
  type PosCustomer,
  type PosProduct,
} from '@/lib/pos';


export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  /** Add `addUnits` stock units to the given line, respecting the stock ceiling. */
  const add = useCallback(
    (product: PosProduct, mode: CartLineMode, step: number) => {
      const unitsPerStep = mode === 'pack' ? product.packSize ?? 1 : 1;
      setItems((prev) => {
        const ceiling = stockCeiling(product);
        const used = unitsInCart(prev, product.id);
        if (used <= 0 && ceiling <= 0) {
          toast.error('Out of stock', {
            description: `${product.name} is currently unavailable`,
          });
          return prev;
        }
        if (used + step * unitsPerStep > ceiling) {
          toast.error('Not enough stock', {
            description: `Only ${ceiling} units available`,
          });
          return prev;
        }
        const id = lineId(product.id, mode);
        const existing = prev.find(
          (item) => lineId(item.product.id, item.mode) === id,
        );
        if (existing) {
          return prev.map((item) =>
            item === existing
              ? { ...item, quantity: item.quantity + step }
              : item,
          );
        }
        return [...prev, { product, quantity: step, mode }];
      });
    },
    [],
  );

  const addProduct = useCallback(
    (product: PosProduct) => add(product, 'single', 1),
    [add],
  );

  const addPack = useCallback(
    (product: PosProduct) => {
      if (!product.packSize || product.packSize <= 0) {
        add(product, 'single', 1);
        return;
      }
      add(product, 'pack', 1);
    },
    [add],
  );

  const changeQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) => {
      const item = prev.find((i) => lineId(i.product.id, i.mode) === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i !== item);

      if (delta > 0) {
        const unitsPerStep =
          item.mode === 'pack' ? item.product.packSize ?? 1 : 1;
        const ceiling = stockCeiling(item.product);
        const usedByOthers = unitsInCart(prev, item.product.id) - lineUnits(item);
        if (usedByOthers + newQty * unitsPerStep > ceiling) {
          toast.error('Not enough stock', {
            description: `Only ${ceiling} units available`,
          });
          return prev;
        }
      }
      return prev.map((i) => (i === item ? { ...i, quantity: newQty } : i));
    });
  }, []);

  /** Set an absolute quantity (from the typed field) for one line, clamped. */
  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      const item = prev.find((i) => lineId(i.product.id, i.mode) === id);
      if (!item) return prev;
      if (!Number.isFinite(qty) || qty <= 0) return prev.filter((i) => i !== item);

      const unitsPerStep =
        item.mode === 'pack' ? item.product.packSize ?? 1 : 1;
      const ceiling = stockCeiling(item.product);
      const usedByOthers = unitsInCart(prev, item.product.id) - lineUnits(item);
      const maxSteps = Math.floor((ceiling - usedByOthers) / unitsPerStep);
      let next = Math.floor(qty);
      if (next > maxSteps) {
        toast.error('Not enough stock', {
          description: `Only ${ceiling} units available`,
        });
        next = maxSteps;
      }
      if (next <= 0) return prev.filter((i) => i !== item);
      return prev.map((i) => (i === item ? { ...i, quantity: next } : i));
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setItems((prev) =>
      prev.filter((i) => lineId(i.product.id, i.mode) !== id),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setDiscountPercent(0);
    setCustomer(null);
  }, []);

  const totals = useMemo(
    () => calcCartTotals(items, discountPercent),
    [items, discountPercent],
  );

  return {
    items,
    customer,
    setCustomer,
    discountPercent,
    setDiscountPercent,
    addProduct,
    addPack,
    changeQuantity,
    setQuantity,
    removeProduct,
    clear,
    totals,
    isEmpty: items.length === 0,
  };
}

export type CartController = ReturnType<typeof useCart>;
