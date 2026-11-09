/**
 * Read-only product catalogue for the public storefront. Only fields that are
 * safe to expose leave this module — never cost or wholesale price, supplier
 * data or exact stock beyond what the shop needs to show availability.
 */
import { db } from '@/lib/db'
import { effectivePrice } from '@/lib/pricing'
import { productLabel } from '@/lib/products'
import { slugify } from '@/lib/slug'
import { normalizePromises, normalizeStoreDetails, resolveStoreDetails, STORE_DETAILS_KEY, windowStatus } from '@/lib/website'

const DAY = 24 * 60 * 60 * 1000
/** Stock shown for products that don't track inventory (services, etc.). */
const UNTRACKED_STOCK = 999

export interface PublicCategory {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  image: string
}

export interface PublicProduct {
  id: string
  slug: string
  name: string
  sku: string
  categoryId: string
  /** Minor units (pesewas), effective price after any active discount. */
  price: number
  /** Minor units; the normal price while a discount is active, else null. */
  compareAtPrice: number | null
  /** ISO time the running discount ends (end of its last day, UTC); null when not on sale or open-ended. */
  saleEnds: string | null
  description: string
  details: [string, string][]
  variants: null
  /** A full pack sold at the wholesale rate; null when the product has no (worthwhile) pack. */
  pack: { size: number; price: number } | null
  /** Stock in single units. */
  stock: number
  images: string[]
  featured: boolean
  isNew: boolean
  /** Units sold in the last 30 days. */
  popularity: number
  published: true
  createdAt: number
}

export const minor = (n: number) => Math.round(n * 100)

export function toPublicCategory(c: {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
}): PublicCategory {
  return {
    id: c.id,
    slug: slugify(c.name),
    name: c.name,
    description: c.description ?? '',
    icon: c.icon ?? '',
    image: c.image ?? '',
  }
}

export async function loadCategories(): Promise<PublicCategory[]> {
  const rows = await db.productCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(toPublicCategory)
}

function parseDetails(raw: unknown): [string, string][] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is [unknown, unknown] => Array.isArray(r) && r.length >= 2)
    .map(([k, v]) => [String(k), String(v)])
}

/**
 * The pack offer for a product (major units): the wholesale price per unit for a full pack, same as the till.
 * Null when there is none, or when it would cost no less than buying that many singles.
 */
export function packOffer(
  p: { sellingPrice: number; packSize: number | null; wholesalePrice: number | null } & Parameters<typeof effectivePrice>[0],
  now: Date = new Date(),
): { size: number; total: number } | null {
  const size = p.packSize ?? 0
  const total = p.wholesalePrice != null ? Math.round(p.wholesalePrice * size * 100) / 100 : 0
  const single = effectivePrice(p, now, 'web')
  return size > 1 && total > 0 && total < single * size ? { size, total } : null
}

/** Every product flagged for the website, mapped to the public shape. */
export async function loadProducts(now: Date = new Date()): Promise<PublicProduct[]> {
  const since = new Date(now.getTime() - 30 * DAY)
  const [rows, sold] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, showOnWebsite: true, slug: { not: null } },
      include: { inventory: true, productType: true },
    }),
    db.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { createdAt: { gte: since } } },
      _sum: { quantity: true },
    }),
  ])
  const soldBy = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]))

  return rows.map((p) => {
    const tracks = p.productType?.tracksStock ?? true
    // A pack is the wholesale price per unit for a full pack, same as the till.
    // It is hidden when it would cost no less than buying that many singles.
    const single = effectivePrice(p, now, 'web')
    const onSale = single < p.sellingPrice
    const offer = packOffer(p, now)
    return {
      id: p.id,
      slug: p.slug!,
      name: productLabel(p),
      sku: p.sku,
      categoryId: p.categoryId ?? '',
      price: minor(single),
      compareAtPrice: onSale ? minor(p.sellingPrice) : null,
      saleEnds: onSale && p.discountEnd ? new Date(new Date(p.discountEnd).setUTCHours(23, 59, 59, 999)).toISOString() : null,
      description: p.description ?? '',
      details: parseDetails(p.details),
      variants: null,
      pack: offer ? { size: offer.size, price: minor(offer.total) } : null,
      stock: tracks ? Math.max(p.inventory?.quantity ?? 0, 0) : UNTRACKED_STOCK,
      images: [...new Set([p.image, ...p.images].filter((u): u is string => !!u))],
      featured: p.featured,
      isNew: now.getTime() - p.createdAt.getTime() < 30 * DAY,
      popularity: soldBy.get(p.id) ?? 0,
      published: true as const,
      createdAt: p.createdAt.getTime(),
    }
  })
}

export const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export type PublicSlotLink = { type: 'product' | 'category' | 'sale' | 'url'; target: string | null }

export interface PublicSlot {
  id: string
  type: string
  title: string
  subtitle: string
  imageUrl: string
  buttonLabel: string
  link: PublicSlotLink | null
  /** Only products that are currently on the website. */
  productIds: string[]
}

/** Slots that are live now, in display order. Slots whose products are gone are dropped. */
export async function loadSlots(products: PublicProduct[], now: Date = new Date()): Promise<PublicSlot[]> {
  const rows = await db.promoSlot.findMany()
  const onSite = new Set(products.map((p) => p.id))
  const out: PublicSlot[] = []
  // Fixed display order on the homepage.
  const ORDER = ['hero', 'product_of_week', 'collection', 'announcement']
  rows.sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
  for (const r of rows) {
    if (windowStatus(r, now) !== 'live') continue
    const productIds = r.productIds.filter((id) => onSite.has(id))
    if (r.type === 'product_of_week' && productIds.length === 0) continue
    if (r.type === 'collection' && productIds.length === 0) continue
    out.push({
      id: r.id,
      type: r.type,
      title: r.title,
      subtitle: r.subtitle ?? '',
      imageUrl: r.imageUrl ?? '',
      buttonLabel: r.buttonLabel ?? '',
      link: r.linkType
        ? { type: r.linkType as PublicSlotLink['type'], target: r.linkTarget }
        : null,
      productIds: r.type === 'product_of_week' ? productIds.slice(0, 1) : r.type === 'hero' ? productIds.slice(0, 2) : productIds,
    })
  }
  return out
}

/** Business name, contacts and the website-only copy, with overrides already applied. */
export async function loadStore() {
  const rows = await db.businessSetting.findMany({
    where: { key: { in: ['business_name', 'email', 'phone', 'address', STORE_DETAILS_KEY] } },
  })
  const by = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  let parsed: unknown = null
  try { parsed = by[STORE_DETAILS_KEY] ? JSON.parse(by[STORE_DETAILS_KEY]) : null } catch { /* not set up */ }
  return {
    name: (by.business_name ?? '').trim(),
    ...resolveStoreDetails(normalizeStoreDetails(parsed), by),
  }
}

export const PROMISES_KEY = 'website_promises'

export interface PublicPromises {
  /** Minor units; null when free delivery is off. */
  freeDeliveryThreshold: number | null
  deliveryAreas: { id: string; name: string; fee: number | null; eta: string }[]
  /** Days; null when returns are off. */
  returnDays: number | null
  pickup: { enabled: boolean; address: string; hours: string; note: string }
}

/** What the website may promise. Anything not set up (or switched off) comes back off. */
export async function loadPromises(): Promise<PublicPromises> {
  const row = await db.businessSetting.findUnique({ where: { key: PROMISES_KEY } })
  let parsed: unknown = null
  try { parsed = row ? JSON.parse(row.value) : null } catch { /* not set up */ }
  const p = normalizePromises(parsed)
  // Pickup is the shop itself: unless a different address or hours were typed in, use Business info and the website hours.
  const shop = await loadStore()
  return {
    freeDeliveryThreshold: p.freeDelivery.enabled ? minor(p.freeDelivery.threshold) : null,
    deliveryAreas: p.delivery.areas.map((a) => ({
      id: a.id,
      name: a.name,
      fee: a.fee === null ? null : minor(a.fee),
      eta: a.eta,
    })),
    returnDays: p.returns.enabled ? p.returns.days : null,
    pickup: p.pickup.enabled
      ? { enabled: true, address: p.pickup.address.trim() || shop.address, hours: p.pickup.hours.trim() || shop.hours, note: p.pickup.note }
      : { enabled: false, address: '', hours: '', note: '' },
  }
}
