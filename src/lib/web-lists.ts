/** A customer's saved cart and wishlist, so they follow the account from device to device. */
import type { WebAccount } from '@prisma/client'
import { db } from '@/lib/db'

export const MAX_CART_LINES = 100
export const MAX_WISHLIST = 300

export type CartLine = { productId: string; variantId: string | null; qty: number }
export type Lists = { cart: CartLine[]; wishlist: string[] }

export const listsOf = (a: Pick<WebAccount, 'cart' | 'wishlist'>): Lists => ({
  cart: Array.isArray(a.cart) ? (a.cart as CartLine[]) : [],
  wishlist: Array.isArray(a.wishlist) ? (a.wishlist as string[]) : [],
})

/** Clean what the browser sent; anything malformed is dropped rather than stored. */
export function cleanCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return []
  const out: CartLine[] = []
  for (const r of raw.slice(0, MAX_CART_LINES) as Record<string, unknown>[]) {
    const productId = typeof r?.productId === 'string' ? r.productId.slice(0, 80) : ''
    const variantId = typeof r?.variantId === 'string' && r.variantId ? r.variantId.slice(0, 80) : null
    const qty = Math.floor(Number(r?.qty))
    if (!productId || !(qty > 0)) continue
    if (out.some((l) => l.productId === productId && l.variantId === variantId)) continue
    out.push({ productId, variantId, qty: Math.min(qty, 99) })
  }
  return out
}

export function cleanWishlist(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && !!x).map((x) => x.slice(0, 80)))].slice(0, MAX_WISHLIST)
}

/** Save whichever of cart / wishlist was sent. */
export async function saveLists(accountId: string, body: { cart?: unknown; wishlist?: unknown }): Promise<Lists> {
  const data: { cart?: CartLine[]; wishlist?: string[] } = {}
  if (body.cart !== undefined) data.cart = cleanCart(body.cart)
  if (body.wishlist !== undefined) data.wishlist = cleanWishlist(body.wishlist)
  return listsOf(await db.webAccount.update({ where: { id: accountId }, data }))
}
