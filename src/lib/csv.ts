/**
 * Reads a spreadsheet export or a paste from Excel/Sheets into product rows,
 * and builds the downloadable template. Pure functions, no dependencies.
 */

/** Splits text into rows of cells. Handles quotes, escaped quotes and commas / tabs / semicolons. */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const first = src.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => first.split(ch).length - 1;
  const delimiter = ['\t', ';', ','].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',');

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

export const PRODUCT_COLUMNS = [
  { key: 'name', label: 'Name', required: true, aliases: ['name', 'productname', 'product', 'item'] },
  { key: 'sku', label: 'SKU', aliases: ['sku', 'code', 'itemcode', 'barcode'] },
  { key: 'category', label: 'Category', aliases: ['category'] },
  { key: 'type', label: 'Type', aliases: ['type', 'producttype'] },
  { key: 'container', label: 'Container', aliases: ['container', 'packaging'] },
  { key: 'size', label: 'Size', aliases: ['size'] },
  { key: 'unit', label: 'Unit', aliases: ['unit', 'uom'] },
  { key: 'costPrice', label: 'Cost price', aliases: ['costprice', 'cost', 'buyingprice'] },
  { key: 'sellingPrice', label: 'Selling price', required: true, aliases: ['sellingprice', 'price', 'selling', 'retailprice'] },
  { key: 'wholesalePrice', label: 'Wholesale price', aliases: ['wholesaleprice', 'wholesale'] },
  { key: 'packSize', label: 'Pack size', aliases: ['packsize', 'pack', 'unitsperpack'] },
  { key: 'initialStock', label: 'Initial stock', aliases: ['initialstock', 'stock', 'quantity', 'qty', 'openingstock'] },
  { key: 'description', label: 'Description', aliases: ['description', 'details'] },
  { key: 'image', label: 'Image link', aliases: ['image', 'imageurl', 'imagelink', 'photo'] },
  { key: 'showOnWebsite', label: 'Show on website', aliases: ['showonwebsite', 'website', 'showonstore', 'online'] },
] as const;

export type ProductColumnKey = (typeof PRODUCT_COLUMNS)[number]['key'];
export type RawProductRow = Partial<Record<ProductColumnKey, string>>;

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Turns parsed cells into keyed rows using the header line. Unknown columns are reported, not guessed. */
export function toProductRows(table: string[][]): { rows: RawProductRow[]; unknownColumns: string[]; missing: string[] } {
  if (table.length === 0) return { rows: [], unknownColumns: [], missing: ['Name', 'Selling price'] };
  const header = table[0];
  const keyAt = header.map((h) => PRODUCT_COLUMNS.find((c) => (c.aliases as readonly string[]).includes(norm(h)))?.key);
  const unknownColumns = header.filter((h, i) => h.trim() && !keyAt[i]);
  const present = new Set(keyAt.filter(Boolean));
  const missing = PRODUCT_COLUMNS.filter((c) => 'required' in c && c.required && !present.has(c.key)).map((c) => c.label);
  const rows = table.slice(1).map((cells) => {
    const r: RawProductRow = {};
    keyAt.forEach((k, i) => { if (k) r[k] = (cells[i] ?? '').trim(); });
    return r;
  });
  return { rows, unknownColumns, missing };
}

/** The downloadable template: a header line and two example rows. */
export function productTemplateCsv(): string {
  const header = PRODUCT_COLUMNS.map((c) => c.label).join(',');
  const examples = [
    ['Coca-Cola', '', 'Beverages', 'Stocked item', 'Bottle', '500ml', 'ml', '3.50', '5.00', '3.80', '12', '48', 'Chilled soft drink', '', 'yes'],
    ['Delivery Service', '', '', '', '', '', '', '0', '15', '', '', '', '', '', 'no'],
  ];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [header, ...examples.map((r) => r.map(esc).join(','))].join('\r\n') + '\r\n';
}
