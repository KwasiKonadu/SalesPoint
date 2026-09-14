/**
 * Types, colour helpers and receipt builders shared by the POS screen and its
 * sub-components (`src/components/pos/*`). Keeping the pure logic here lets the
 * components stay presentational.
 */

import { getBusinessInfo, type BusinessInfo } from '@/lib/business-info';
import { formatCurrency } from '@/lib/format';
import { paymentMethodLabel, type PaymentMethod } from '@/lib/payment';
import { lowStockThreshold } from '@/lib/stock';

export type { PaymentMethod };

// ==================== Types ====================

export interface PosProduct {
  id: string;
  name: string;
  container?: string | null;
  size?: string | null;
  sku: string;
  sellingPrice: number;
  wholesalePrice?: number | null;
  packSize?: number | null;
  image?: string | null;
  categoryId?: string | null;
  category?: { name: string } | null;
  inventory?: { quantity: number } | null;
  productType?: { tracksStock: boolean } | null;
  targetStock?: number | null;
  lowStockPercent?: number | null;
  isActive: boolean;
}

export interface PosCategory {
  id: string;
  name: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export type CartLineMode = 'single' | 'pack';

export interface CartItem {
  product: PosProduct;
  /** Units when `mode` is 'single', whole packs when 'pack'. */
  quantity: number;
  mode: CartLineMode;
}

/** Stable identity for a cart line — a product can have a single AND a pack line. */
export function lineId(productId: string, mode: CartLineMode): string {
  return `${productId}:${mode}`;
}

/** How many stock units this line represents. */
export function lineUnits(item: CartItem): number {
  return item.mode === 'pack'
    ? item.quantity * (item.product.packSize ?? 1)
    : item.quantity;
}

/** Per-unit price for this line (wholesale for a pack line, else retail). */
export function lineUnitPrice(item: CartItem): number {
  if (item.mode === 'pack' && item.product.wholesalePrice != null) {
    return item.product.wholesalePrice;
  }
  return item.product.sellingPrice;
}

export function lineTotal(item: CartItem): number {
  return lineUnits(item) * lineUnitPrice(item);
}

export interface SaleResponse {
  id: string;
  transactionNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived?: number | null;
  changeAmount: number;
  customer?: { name: string; phone?: string | null } | null;
  soldBy: { name: string };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  createdAt: string;
}

// ==================== Colour / initials helpers ====================

const PRODUCT_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

/** Deterministic accent colour for a product with no image. */
export function getProductColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRODUCT_COLORS[Math.abs(hash) % PRODUCT_COLORS.length];
}

export function getProductTextColor(name: string): string {
  return getProductColor(name).replace('bg-', 'text-').replace('-500', '-600');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ==================== Stock helpers ====================

export type StockStatus = {
  label: string;
  variant: 'secondary' | 'destructive';
};

export function getStockStatus(product: PosProduct): StockStatus {
  const tracksStock = product.productType?.tracksStock !== false;
  if (!tracksStock) return { label: 'In Stock', variant: 'secondary' };
  const qty = product.inventory?.quantity ?? 0;
  if (qty <= 0) return { label: 'Out of Stock', variant: 'destructive' };
  const threshold = lowStockThreshold(product.targetStock, product.lowStockPercent);
  if (threshold > 0 && qty <= threshold)
    return { label: `${qty} left`, variant: 'destructive' };
  return { label: 'In Stock', variant: 'secondary' };
}

export function isOutOfStock(product: PosProduct): boolean {
  const tracksStock = product.productType?.tracksStock !== false;
  if (!tracksStock) return false;
  return (product.inventory?.quantity ?? 0) <= 0;
}

/** Max units of `product` that may sit in the cart (Infinity when untracked). */
export function stockCeiling(product: PosProduct): number {
  const tracksStock = product.productType?.tracksStock !== false;
  if (!tracksStock) return Infinity;
  return product.inventory?.quantity ?? 0;
}

// ==================== Cart calculations ====================

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  totalItems: number;
}

/** Tax rate is fixed at 0% for V1 — could be sourced from settings later. */
export const TAX_RATE = 0;

export function calcCartTotals(items: CartItem[], discountPercent: number): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxAmount = ((subtotal - discountAmount) * TAX_RATE) / 100;
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: subtotal - discountAmount + taxAmount,
    totalItems: items.reduce((sum, item) => sum + lineUnits(item), 0),
  };
}

/** Total stock units a product occupies across all its cart lines. */
export function unitsInCart(items: CartItem[], productId: string): number {
  return items
    .filter((i) => i.product.id === productId)
    .reduce((sum, i) => sum + lineUnits(i), 0);
}

// ==================== Receipt builders ====================

const escHtml = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );

/**
 * Printable HTML document for a completed sale. Business identity, footer and
 * the standard/compact layout come from Settings → Receipt (`getBusinessInfo`).
 */
export function buildReceiptHtml(
  sale: SaleResponse,
  info: BusinessInfo = getBusinessInfo(),
): string {
  const compact = info.receiptFormat === 'compact';

  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr>
        <td style="text-align:left;padding:4px 0;font-size:13px;">${escHtml(item.productName)}</td>
        <td style="text-align:center;padding:4px 0;font-size:13px;">${item.quantity}</td>
        <td style="text-align:right;padding:4px 0;font-size:13px;">${formatCurrency(item.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const headerLines = [
    info.address && `<p>${escHtml(info.address)}</p>`,
    info.phone && `<p>Tel: ${escHtml(info.phone)}</p>`,
    !compact && info.email && `<p>${escHtml(info.email)}</p>`,
  ]
    .filter(Boolean)
    .join('\n      ');

  const metaLines = [
    `<p><strong>Txn:</strong> ${escHtml(sale.transactionNumber)}</p>`,
    `<p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>`,
    !compact &&
      `<p><strong>Customer:</strong> ${escHtml(sale.customer?.name || 'Walk-in')}</p>`,
    !compact && `<p><strong>Cashier:</strong> ${escHtml(sale.soldBy?.name || '')}</p>`,
  ]
    .filter(Boolean)
    .join('\n      ');

  return `
      <!DOCTYPE html>
      <html><head><title>Receipt - ${escHtml(sale.transactionNumber)}</title>
      <style>
        body { font-family: 'Courier New', ui-monospace, Menlo, Consolas, monospace; margin: 0; padding: 20px; max-width: 300px; margin: 0 auto; }
        h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
        p { margin: 2px 0; font-size: 12px; text-align: center; }
        .divider { border-top: 1px dashed #000; margin: ${compact ? '6px' : '10px'} 0; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: bold; font-size: 15px; }
        .footer { text-align: center; margin-top: 15px; font-size: 11px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h2>${escHtml(info.name)}</h2>
      ${headerLines}
      <div class="divider"></div>
      ${metaLines}
      <div class="divider"></div>
      <table>
        <thead><tr style="border-bottom:1px solid #000;">
          <th style="text-align:left;padding:4px 0;font-size:12px;">Item</th>
          <th style="text-align:center;padding:4px 0;font-size:12px;">Qty</th>
          <th style="text-align:right;padding:4px 0;font-size:12px;">Amount</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td style="text-align:left;">Subtotal</td><td style="text-align:right;">${formatCurrency(sale.subtotal)}</td></tr>
        ${sale.discountAmount > 0 ? `<tr><td style="text-align:left;">Discount</td><td style="text-align:right;">-${formatCurrency(sale.discountAmount)}</td></tr>` : ''}
        ${sale.taxAmount > 0 ? `<tr><td style="text-align:left;">Tax</td><td style="text-align:right;">${formatCurrency(sale.taxAmount)}</td></tr>` : ''}
        <tr class="total-row"><td style="text-align:left;border-top:2px solid #000;padding-top:5px;">TOTAL</td><td style="text-align:right;border-top:2px solid #000;padding-top:5px;">${formatCurrency(sale.totalAmount)}</td></tr>
        ${
          sale.paymentMethod === 'cash' && sale.amountReceived
            ? `
        <tr><td style="text-align:left;">Received</td><td style="text-align:right;">${formatCurrency(sale.amountReceived)}</td></tr>
        <tr><td style="text-align:left;">Change</td><td style="text-align:right;">${formatCurrency(sale.changeAmount)}</td></tr>
        `
            : ''
        }
        ${
          (sale.amountReceived ?? 0) < sale.totalAmount - 0.01
            ? `<tr><td style="text-align:left;font-weight:bold;">BALANCE DUE</td><td style="text-align:right;font-weight:bold;">${formatCurrency(sale.totalAmount - (sale.amountReceived ?? 0))}</td></tr>`
            : ''
        }
      </table>
      <div class="divider"></div>
      <p><strong>Payment:</strong> ${paymentMethodLabel(sale.paymentMethod)}${
        (sale.amountReceived ?? 0) < sale.totalAmount - 0.01
          ? ' (PENDING)'
          : ''
      }</p>
      <div class="footer"><p>${escHtml(info.receiptFooter)}</p></div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `;
}

/** Plain-text receipt for the "Download" action. */
export function buildReceiptText(
  sale: SaleResponse,
  info: BusinessInfo = getBusinessInfo(),
): string {
  const compact = info.receiptFormat === 'compact';

  const itemsText = sale.items
    .map(
      (item) =>
        `  ${item.productName.padEnd(20)} x${item.quantity}    ${formatCurrency(item.subtotal)}`,
    )
    .join('\n');

  const header = [
    info.name,
    info.address && !compact ? info.address : '',
    info.phone ? `Tel: ${info.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const meta = [
    `Transaction: ${sale.transactionNumber}`,
    `Date: ${new Date(sale.createdAt).toLocaleString()}`,
    compact ? '' : `Customer: ${sale.customer?.name || 'Walk-in'}`,
    compact ? '' : `Cashier: ${sale.soldBy?.name || ''}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `
================================
${header}
            Receipt
================================

${meta}

--------------------------------
${'Item'.padEnd(22)}Qty   Amount
--------------------------------
${itemsText}
--------------------------------
Subtotal:                  ${formatCurrency(sale.subtotal)}
${sale.discountAmount > 0 ? `Discount:                 -${formatCurrency(sale.discountAmount)}\n` : ''}${sale.taxAmount > 0 ? `Tax:                      ${formatCurrency(sale.taxAmount)}\n` : ''}================================
TOTAL:                     ${formatCurrency(sale.totalAmount)}
================================
${sale.paymentMethod === 'cash' && sale.amountReceived ? `Amount Received:          ${formatCurrency(sale.amountReceived)}\nChange:                    ${formatCurrency(sale.changeAmount)}\n` : ''}Payment: ${paymentMethodLabel(sale.paymentMethod)}

    ${info.receiptFooter}
================================
    `;
}
