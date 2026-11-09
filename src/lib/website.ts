/**
 * Website CMS rules shared by the SalesPoint screens and the public API:
 * promotion-slot types and when they are live, and website-only discounts.
 */

/** URL-safe slug, e.g. "Personal Care" -> "personal-care". */
export function slugify(...parts: (string | null | undefined)[]): string {
  const s = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'product'
}

// ==================== Slots ====================

export const SLOT_TYPES = [
  { value: 'hero', label: 'Hero banner', hint: 'The big banner at the top of the homepage. Several rotate.' },
  { value: 'product_of_week', label: 'Product of the week', hint: 'One product as a large feature card.' },
  { value: 'collection', label: 'Hand-picked collection', hint: 'A titled row of products you choose.' },
  { value: 'announcement', label: 'Announcement bar', hint: 'One line across the top of every page.' },
] as const;

export type SlotType = (typeof SLOT_TYPES)[number]['value'];
export type LinkType = 'product' | 'category' | 'sale' | 'url';

export interface PromoSlotItem {
  id: string;
  type: SlotType;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  buttonLabel?: string | null;
  linkType?: LinkType | null;
  linkTarget?: string | null;
  productIds: string[];
  startAt?: string | null;
  endAt?: string | null;
  isActive: boolean;
}

interface Windowed {
  isActive: boolean;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
}

export type WindowStatus = 'off' | 'scheduled' | 'live' | 'ended';

/** A slot or discount runs from `startAt` to the end of the `endAt` day (UTC); either may be open. */
export function windowStatus(w: Windowed, now: Date = new Date()): WindowStatus {
  if (!w.isActive) return 'off';
  if (w.startAt && now < new Date(w.startAt)) return 'scheduled';
  if (w.endAt) {
    const end = new Date(w.endAt);
    end.setUTCHours(23, 59, 59, 999);
    if (now > end) return 'ended';
  }
  return 'live';
}

/** Returns an error message, or null when the slot input is valid. */
export function validateSlot(b: {
  type?: string; title?: string; linkType?: string | null; linkTarget?: string | null;
  productIds?: string[]; startAt?: string | null; endAt?: string | null;
}): string | null {
  if (!SLOT_TYPES.some((t) => t.value === b.type)) return 'Choose a slot type';
  if (!b.title?.trim()) return 'A title is required';
  if (b.type === 'product_of_week' && !(b.productIds?.length === 1)) return 'Pick one product';
  if (b.type === 'collection' && !b.productIds?.length) return 'Pick at least one product';
  if (b.linkType && b.linkType !== 'sale' && !b.linkTarget?.trim()) return 'Enter where the button goes';
  if (b.startAt && b.endAt && new Date(b.endAt) < new Date(b.startAt)) return 'End date must be on or after the start date';
  return null;
}

// ==================== Promises (delivery, returns, pickup) ====================

export interface DeliveryArea {
  id: string;
  name: string;
  /** Fee in major units; null = we don't deliver there. */
  fee: number | null;
  eta: string;
}

export interface Promises {
  freeDelivery: { enabled: boolean; threshold: number };
  delivery: { areas: DeliveryArea[] };
  returns: { enabled: boolean; days: number };
  pickup: { enabled: boolean; address: string; hours: string; note: string };
}

export const EMPTY_PROMISES: Promises = {
  freeDelivery: { enabled: false, threshold: 0 },
  delivery: { areas: [] },
  returns: { enabled: false, days: 30 },
  // On by default: customers collect from the shop. The address falls back to Business info.
  pickup: { enabled: true, address: '', hours: '', note: '' },
};

/** Fills in anything missing so old or partial saves never break the screens. */
export function normalizePromises(raw: unknown): Promises {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Promises>;
  const areas = Array.isArray(r.delivery?.areas) ? r.delivery!.areas : [];
  return {
    freeDelivery: {
      enabled: !!r.freeDelivery?.enabled,
      threshold: Math.max(0, Number(r.freeDelivery?.threshold) || 0),
    },
    delivery: {
      areas: areas.map((a, i) => ({
        id: String(a.id || `${slugify(a.name)}-${i}`),
        name: String(a.name ?? ''),
        fee: a.fee === null || a.fee === undefined || (a.fee as unknown) === '' ? null : Number(a.fee),
        eta: String(a.eta ?? ''),
      })),
    },
    returns: { enabled: !!r.returns?.enabled, days: Math.round(Number(r.returns?.days)) || 30 },
    pickup: {
      enabled: r.pickup?.enabled === undefined ? true : !!r.pickup.enabled,
      address: String(r.pickup?.address ?? ''),
      hours: String(r.pickup?.hours ?? ''),
      note: String(r.pickup?.note ?? ''),
    },
  };
}

/** Returns an error message, or null when the promises are valid. */
export function validatePromises(p: Promises): string | null {
  if (p.freeDelivery.enabled && !(p.freeDelivery.threshold > 0)) return 'Enter the order amount for free delivery';
  const names = new Set<string>();
  for (const a of p.delivery.areas) {
    if (!a.name.trim()) return 'Every delivery area needs a name';
    if (names.has(a.name.trim().toLowerCase())) return `"${a.name}" is listed twice`;
    names.add(a.name.trim().toLowerCase());
    if (a.fee !== null && !(a.fee >= 0)) return `Fee for "${a.name}" must be 0 or more`;
  }
  if (p.returns.enabled && !(Number.isInteger(p.returns.days) && p.returns.days >= 1 && p.returns.days <= 365)) {
    return 'Return days must be between 1 and 365';
  }
  return null;
}

/**
 * What a customer pays for delivery: the area's fee, waived once the order
 * reaches the free-delivery amount. `fee: null` means no delivery to that area.
 */
export function deliveryCharge(p: Promises, areaId: string, subtotal: number): { fee: number | null; free: boolean } {
  const area = p.delivery.areas.find((a) => a.id === areaId);
  if (!area || area.fee === null) return { fee: null, free: false };
  const free = p.freeDelivery.enabled && subtotal >= p.freeDelivery.threshold;
  return { fee: free ? 0 : area.fee, free };
}

// ==================== STORE DETAILS ====================

export interface StoreSocial { label: string; url: string }

/**
 * Website-only copy for the footer and contact page. Email, phone and address
 * follow Settings → Business info unless filled in here (blank = follow).
 */
export interface StoreDetails {
  about: string
  tagline: string
  hours: string
  email: string
  phone: string
  address: string
  socials: StoreSocial[]
}

export const STORE_DETAILS_KEY = 'website_store'

export const EMPTY_STORE_DETAILS: StoreDetails = { about: '', tagline: '', hours: '', email: '', phone: '', address: '', socials: [] }

export function normalizeStoreDetails(raw: unknown): StoreDetails {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  return {
    about: s(r.about),
    tagline: s(r.tagline),
    hours: s(r.hours),
    email: s(r.email),
    phone: s(r.phone),
    address: s(r.address),
    socials: (Array.isArray(r.socials) ? r.socials : [])
      .map((x) => ({ label: s((x as Record<string, unknown>)?.label), url: s((x as Record<string, unknown>)?.url) }))
      .filter((x) => x.label || x.url),
  }
}

export function validateStoreDetails(d: StoreDetails): string | null {
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return 'Enter a valid email address'
  if (d.about.length > 400) return 'Keep the description under 400 characters'
  for (const s of d.socials) {
    if (!s.label || !s.url) return 'Each social link needs a name and an address'
    if (!/^https?:\/\//i.test(s.url)) return `The address for ${s.label} must start with https://`
  }
  return null
}

/** What the website shows: a filled-in override wins, otherwise Business info. */
export function resolveStoreDetails(d: StoreDetails, business: { email?: string; phone?: string; address?: string }) {
  return {
    ...d,
    email: d.email || business.email?.trim() || '',
    phone: d.phone || business.phone?.trim() || '',
    address: d.address || business.address?.trim() || '',
  }
}
